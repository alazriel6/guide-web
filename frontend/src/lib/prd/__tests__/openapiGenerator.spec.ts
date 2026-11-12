import { describe, it, expect } from 'vitest'
import {
  generateOpenApiDocument,
  stringifyYaml,
  generatePostmanCollection,
} from '../openapiGenerator'
import { createBlankModel } from '../sections'

describe('openapiGenerator', () => {
  const model = createBlankModel()
  model.title = 'B2B Feature Flags API'
  model.category = 'SaaS Web App'
  model.overview = 'High-throughput flag evaluation and SSE delta updates.'
  model.data_models = `
• organizations: id (PK), name (VARCHAR), plan_tier, created_at (TIMESTAMP)
• feature_flags: id (PK), org_id (FK), key (VARCHAR), enabled (BOOL), rollout_pct (INT)
`
  model.api_contract = `
- GET /api/v1/flags?env=production -> Returns evaluated flag manifest
- POST /api/v1/flags -> Creates a new flag definition across environments
- PUT /api/v1/flags/:id/toggle -> Atomic version-checked flag state mutation
- DELETE /api/v1/flags/:id -> Remove flag definition
`

  it('generates an OpenAPI 3.1.0 document from PRD model', () => {
    const doc = generateOpenApiDocument(model)

    expect(doc.openapi).toBe('3.1.0')
    expect(doc.info.title).toBe('B2B Feature Flags API')
    expect(doc.servers[0]?.url).toBe('/api/v1')

    // Check components.schemas
    expect(doc.components.schemas.organizations).toBeDefined()
    expect(doc.components.schemas.feature_flags).toBeDefined()
    expect(doc.components.schemas.ErrorEnvelope).toBeDefined()

    expect(doc.components.schemas.feature_flags?.properties.enabled?.type).toBe('boolean')
    expect(doc.components.schemas.feature_flags?.properties.id?.type).toBe('integer')

    // Check paths
    expect(doc.paths['/api/v1/flags']).toBeDefined()
    expect(doc.paths['/api/v1/flags']?.get).toBeDefined()
    expect(doc.paths['/api/v1/flags']?.post).toBeDefined()

    // Path parameters normalization (:id -> {id})
    expect(doc.paths['/api/v1/flags/{id}']).toBeDefined()
    expect(doc.paths['/api/v1/flags/{id}']?.delete).toBeDefined()
    expect(doc.paths['/api/v1/flags/{id}/toggle']?.put).toBeDefined()

    // Parameters
    const getFlagsParams = doc.paths['/api/v1/flags']?.get?.parameters
    expect(getFlagsParams?.some((p) => p.name === 'env' && p.in === 'query')).toBe(true)

    const deleteParams = doc.paths['/api/v1/flags/{id}']?.delete?.parameters
    expect(deleteParams?.some((p) => p.name === 'id' && p.in === 'path')).toBe(true)

    // RequestBody for POST
    expect(doc.paths['/api/v1/flags']?.post?.requestBody).toBeDefined()
  })

  it('serializes OpenAPI document into clean YAML', () => {
    const doc = generateOpenApiDocument(model)
    const yaml = stringifyYaml(doc)

    expect(yaml).toContain('openapi: 3.1.0')
    expect(yaml).toContain('title: B2B Feature Flags API')
    expect(yaml).toContain('paths:')
    expect(yaml).toContain('/api/v1/flags:')
    expect(yaml).toContain('components:')
    expect(yaml).toContain('schemas:')
    expect(yaml).toContain('feature_flags:')
  })

  it('generates valid Postman Collection v2.1.0 format', () => {
    const postmanJson = generatePostmanCollection(model)
    const parsed = JSON.parse(postmanJson)

    expect(parsed.info.name).toBe('B2B Feature Flags API')
    expect(parsed.info.schema).toContain('v2.1.0')
    expect(parsed.item.length).toBe(4)
    expect(parsed.item[0].request.method).toBe('GET')
    expect(parsed.item[1].request.method).toBe('POST')
    expect(parsed.item[2].request.method).toBe('PUT')
    expect(parsed.item[3].request.method).toBe('DELETE')
  })

  it('handles empty API contracts with a graceful fallback', () => {
    const blank = createBlankModel()
    const doc = generateOpenApiDocument(blank)
    expect(doc.paths['/health']).toBeDefined()
    expect(doc.paths['/health']?.get?.summary).toContain('Health')
  })
})
