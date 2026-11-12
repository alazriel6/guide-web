import type { PrdModel } from './sections'
import {
  parseDataModels,
  parseApiEndpoints,
  type ParsedEntity,
} from './diagramParser'

export interface OpenApiSchemaProperty {
  type: string
  description?: string
  format?: string
  example?: unknown
}

export interface OpenApiParameter {
  name: string
  in: 'path' | 'query' | 'header'
  required: boolean
  schema: {
    type: string
    default?: string
  }
  description?: string
}

export interface OpenApiOperation {
  summary: string
  operationId: string
  description?: string
  parameters?: OpenApiParameter[]
  requestBody?: {
    required: boolean
    content: {
      'application/json': {
        schema: {
          $ref?: string
          type?: string
          properties?: Record<string, OpenApiSchemaProperty>
        }
      }
    }
  }
  responses: Record<
    string,
    {
      description: string
      content?: {
        'application/json': {
          schema: {
            $ref?: string
            type?: string
            items?: { $ref: string }
          }
        }
      }
    }
  >
}

export interface OpenApiDocument {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  servers: Array<{ url: string; description: string }>
  paths: Record<string, Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', OpenApiOperation>>>
  components: {
    schemas: Record<
      string,
      {
        type: 'object'
        properties: Record<string, OpenApiSchemaProperty>
        required?: string[]
      }
    >
  }
}

/**
 * Maps database field types into standard OpenAPI 3.1 data types and formats.
 */
function mapFieldToSchemaProperty(field: { name: string; type: string; isPk: boolean }): OpenApiSchemaProperty {
  const t = field.type.toUpperCase()
  if (field.isPk || t.includes('INT') || t.includes('SERIAL')) {
    return { type: 'integer', format: t.includes('BIG') ? 'int64' : 'int32' }
  }
  if (t.includes('BOOL')) {
    return { type: 'boolean' }
  }
  if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL') || t.includes('NUMERIC')) {
    return { type: 'number', format: 'double' }
  }
  if (t.includes('TIMESTAMP') || t.includes('DATE') || t.includes('TIME')) {
    return { type: 'string', format: 'date-time' }
  }
  if (t.includes('JSON')) {
    return { type: 'object' }
  }
  if (t.includes('UUID')) {
    return { type: 'string', format: 'uuid' }
  }
  return { type: 'string' }
}

/**
 * Builds OpenAPI 3.1 components.schemas from parsed entities.
 */
function buildComponentSchemas(entities: ParsedEntity[]): OpenApiDocument['components']['schemas'] {
  const schemas: OpenApiDocument['components']['schemas'] = {
    ErrorEnvelope: {
      type: 'object',
      properties: {
        error: { type: 'string', description: 'Error message or code' },
        status: { type: 'integer', description: 'HTTP status code' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['error', 'status'],
    },
  }

  for (const entity of entities) {
    const properties: Record<string, OpenApiSchemaProperty> = {}
    const required: string[] = []

    for (const field of entity.fields) {
      properties[field.name] = mapFieldToSchemaProperty(field)
      if (field.isPk) {
        required.push(field.name)
      }
    }

    schemas[entity.name] = {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    }
  }

  return schemas
}

/**
 * Normalizes an API path into OpenAPI template format (e.g. `/flags/:id` -> `/flags/{id}`).
 * Also extracts query parameters if present in the raw path.
 */
function normalizePath(rawPath: string): { path: string; queryParams: string[] } {
  const [basePathAndParams, queryString] = rawPath.split('?')
  let path = (basePathAndParams || '/').trim()

  // Replace :param with {param}
  path = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')

  const queryParams: string[] = []
  if (queryString) {
    const pairs = queryString.split('&')
    for (const p of pairs) {
      const k = p.split('=')[0]?.trim()
      if (k) queryParams.push(k)
    }
  }

  return { path, queryParams }
}

/**
 * Generates an OperationId from HTTP method and path.
 */
function generateOperationId(method: string, path: string): string {
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/[{}:]/g, ''))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))

  const methodPrefix = method.toLowerCase()
  return `${methodPrefix}${parts.join('') || 'Root'}`
}

/**
 * Generates an OpenAPI 3.1 Document object from a PRD Model.
 */
export function generateOpenApiDocument(model: PrdModel): OpenApiDocument {
  const title = model.title || 'Application REST API'
  const description = `${model.overview || 'API Specification'}\n\nCategory: ${model.category || 'General'}`
  const entities = parseDataModels(model.data_models || '')
  const endpoints = parseApiEndpoints(model.api_contract || '')

  const schemas = buildComponentSchemas(entities)
  const paths: OpenApiDocument['paths'] = {}

  // Match each endpoint
  for (const ep of endpoints) {
    const { path, queryParams } = normalizePath(ep.path)
    const method = ep.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'

    if (!paths[path]) {
      paths[path] = {}
    }

    const pathParamsMatch = path.match(/\{([a-zA-Z0-9_]+)\}/g) || []
    const parameters: OpenApiParameter[] = []

    for (const rawParam of pathParamsMatch) {
      const paramName = rawParam.replace(/[{}]/g, '')
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `Unique identifier for ${paramName}`,
      })
    }

    for (const q of queryParams) {
      parameters.push({
        name: q,
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: `Filter query parameter: ${q}`,
      })
    }

    const opId = generateOperationId(ep.method, path)

    // Determine target schema reference if matching entity found
    const targetEntity = entities.find((e) =>
      path.toLowerCase().includes(e.name.toLowerCase().slice(0, -1)),
    )
    const schemaRef = targetEntity ? `#/components/schemas/${targetEntity.name}` : undefined

    const operation: OpenApiOperation = {
      summary: ep.description || `${ep.method} ${path}`,
      operationId: opId,
      parameters: parameters.length > 0 ? parameters : undefined,
      responses: {
        '200': {
          description: 'Successful operation',
          content: schemaRef
            ? {
                'application/json': {
                  schema: method === 'get' && !path.includes('{')
                    ? { type: 'array', items: { $ref: schemaRef } }
                    : { $ref: schemaRef },
                },
              }
            : {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
        },
        '400': {
          description: 'Bad Request / Validation Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorEnvelope' },
            },
          },
        },
      },
    }

    if (method === 'post' || method === 'put' || method === 'patch') {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: schemaRef ? { $ref: schemaRef } : { type: 'object' },
          },
        },
      }
    }

    paths[path]![method] = operation
  }

  // Fallback if no endpoints defined
  if (Object.keys(paths).length === 0) {
    paths['/health'] = {
      get: {
        summary: 'Health check endpoint',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service operational status',
          },
        },
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title,
      version: '1.0.0',
      description,
    },
    servers: [
      { url: '/api/v1', description: 'Production / Local API Base' },
    ],
    paths,
    components: {
      schemas,
    },
  }
}

/**
 * Zero-dependency YAML stringifier tailored for OpenAPI 3.1 documents.
 */
export function stringifyYaml(data: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)

  if (data === null || data === undefined) {
    return 'null'
  }

  if (typeof data === 'boolean') {
    return data ? 'true' : 'false'
  }

  if (typeof data === 'number') {
    return String(data)
  }

  if (typeof data === 'string') {
    if (data.includes('\n')) {
      const lines = data.split('\n').map((l) => `${pad}  ${l}`).join('\n')
      return `|\n${lines}`
    }
    if (/[:#{}[\],&*?|<>=!%@`-]/.test(data) || data.trim() !== data || data === '') {
      return `"${data.replace(/"/g, '\\"')}"`
    }
    return data
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]'
    const items = data.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const itemYaml = stringifyYaml(item, indent + 1).trimStart()
        return `${pad}- ${itemYaml}`
      }
      return `${pad}- ${stringifyYaml(item, 0)}`
    })
    return items.join('\n')
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    )
    if (entries.length === 0) return '{}'

    const lines = entries.map(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        if (Array.isArray(val) && val.length === 0) {
          return `${pad}${key}: []`
        }
        if (!Array.isArray(val) && Object.keys(val).length === 0) {
          return `${pad}${key}: {}`
        }
        return `${pad}${key}:\n${stringifyYaml(val, indent + 1)}`
      }
      return `${pad}${key}: ${stringifyYaml(val, 0)}`
    })
    return lines.join('\n')
  }

  return String(data)
}

/**
 * Generates Postman Collection v2.1 JSON from PRD Model.
 */
export function generatePostmanCollection(model: PrdModel): string {
  const endpoints = parseApiEndpoints(model.api_contract || '')
  const title = model.title || 'PRD API Collection'

  const items = endpoints.map((ep) => {
    const { path, queryParams } = normalizePath(ep.path)
    const urlParts = path.split('/').filter(Boolean)
    const queries = queryParams.map((q) => ({ key: q, value: '' }))

    return {
      name: ep.description || `${ep.method} ${path}`,
      request: {
        method: ep.method,
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' },
        ],
        url: {
          raw: `{{baseUrl}}${path}${queryParams.length > 0 ? '?' + queryParams.map((q) => `${q}=`).join('&') : ''}`,
          host: ['{{baseUrl}}'],
          path: urlParts,
          query: queries.length > 0 ? queries : undefined,
        },
        body: ['POST', 'PUT', 'PATCH'].includes(ep.method)
          ? {
              mode: 'raw',
              raw: '{\n  \n}',
              options: { raw: { language: 'json' } },
            }
          : undefined,
        description: ep.description,
      },
      response: [],
    }
  })

  const collection = {
    info: {
      name: title,
      description: model.overview || 'Generated via BlueprintDev',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: items,
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:8080/api/v1',
        type: 'string',
      },
    ],
  }

  return JSON.stringify(collection, null, 2)
}

/**
 * Browser file download helper for OpenAPI & Postman specifications.
 */
export function downloadSpecFile(
  content: string,
  filename: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
