/**
 * Deterministic parser for extracting structured Entities, Relationships,
 * User Flow sequences, and API Endpoints from PRD markdown text.
 * Generates both interactive visual model representations and Mermaid.js syntax.
 */

export interface EntityField {
  name: string
  type: string
  isPk: boolean
  isFk: boolean
  fkTargetTable?: string
}

export interface EntityRelationship {
  fromTable: string
  toTable: string
  fromField: string
  relationType: 'one-to-many' | 'many-to-one'
}

export interface ParsedEntity {
  name: string
  fields: EntityField[]
}

export interface ParsedFlowStep {
  stepNumber: number
  actor: string
  action: string
  target: string
  details: string
}

export interface ParsedEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
}

/**
 * Parses markdown Data Models text (from Section 08) into structured Entities and Fields.
 * Handles formats like:
 * - organizations: id (PK), slug (UNIQUE), name, plan_tier, created_at
 * - **feature_flags**: id (PK), org_id (FK), key (VARCHAR), enabled (BOOL)
 * - `flag_audit_logs`: id (PK), flag_id (FK), actor_email (VARCHAR)
 */
export function parseDataModels(text: string): ParsedEntity[] {
  if (!text || !text.trim()) return []

  const entities: ParsedEntity[] = []
  const lines = text.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    // Match lines like "- **table_name**: field1, field2..." or "• table_name: field1..."
    const tableMatch = line.match(/^[-*•\s]*(\*\*)?([a-zA-Z0-9_]+)(\*\*)?\s*:\s*(.+)$/)
    if (!tableMatch) continue

    const tableName = tableMatch[2]!
    const fieldsRaw = tableMatch[4]!

    // Parse comma-separated fields
    const rawTokens = fieldsRaw.split(',').map((f) => f.trim()).filter(Boolean)
    const fields: EntityField[] = []

    for (const token of rawTokens) {
      // Tokens like "id (PK)", "org_id (FK)", "key (VARCHAR)", "enabled (BOOL)", "created_at"
      const parenMatch = token.match(/^([a-zA-Z0-9_]+)\s*\(([^)]+)\)$/)

      if (parenMatch) {
        const fName = parenMatch[1]!
        const meta = parenMatch[2]!.toUpperCase()

        const isPk = meta.includes('PK') || meta.includes('PRIMARY')
        const isFk = meta.includes('FK') || meta.includes('FOREIGN') || fName.endsWith('_id')

        let typeStr = 'VARCHAR'
        if (isPk) {
          typeStr = 'INT'
        } else if (meta.includes('INT')) {
          typeStr = 'INT'
        } else if (meta.includes('BOOL')) {
          typeStr = 'BOOLEAN'
        } else if (meta.includes('JSON')) {
          typeStr = 'JSONB'
        } else if (meta.includes('FLOAT') || meta.includes('DOUBLE') || meta.includes('DECIMAL')) {
          typeStr = 'FLOAT'
        } else if (meta.includes('TIMESTAMP') || meta.includes('DATE') || meta.includes('TIME')) {
          typeStr = 'TIMESTAMP'
        } else if (meta.includes('TEXT')) {
          typeStr = 'TEXT'
        } else if (meta.includes('UUID')) {
          typeStr = 'UUID'
        } else if (meta && !meta.includes('KEY') && !meta.includes('UNIQUE')) {
          typeStr = meta
        }

        let fkTargetTable: string | undefined
        if (isFk && fName.endsWith('_id')) {
          const base = fName.replace(/_id$/, '')
          fkTargetTable = base.endsWith('s') ? base : `${base}s`
        }

        fields.push({
          name: fName,
          type: typeStr,
          isPk,
          isFk,
          fkTargetTable,
        })
      } else {
        const cleanName = token.replace(/[^a-zA-Z0-9_]/g, '')
        if (cleanName) {
          const isFk = cleanName.endsWith('_id')
          const isPk = cleanName === 'id'
          fields.push({
            name: cleanName,
            type: isPk ? 'INT' : cleanName.includes('date') || cleanName.includes('at') ? 'TIMESTAMP' : 'VARCHAR',
            isPk,
            isFk,
            fkTargetTable: isFk ? `${cleanName.replace(/_id$/, '')}s` : undefined,
          })
        }
      }
    }

    if (fields.length > 0) {
      entities.push({
        name: tableName,
        fields,
      })
    }
  }

  return entities
}

/**
 * Derives relational foreign key mappings across parsed entities.
 */
export function extractRelationships(entities: ParsedEntity[]): EntityRelationship[] {
  const tableNames = new Set(entities.map((e) => e.name.toLowerCase()))
  const relationships: EntityRelationship[] = []

  for (const entity of entities) {
    for (const field of entity.fields) {
      if (field.isFk && field.fkTargetTable) {
        const target = field.fkTargetTable.toLowerCase()
        const found = tableNames.has(target)
          ? target
          : Array.from(tableNames).find((t) => t.startsWith(target.slice(0, -1)))

        if (found) {
          relationships.push({
            fromTable: found,
            toTable: entity.name,
            fromField: field.name,
            relationType: 'one-to-many',
          })
        }
      }
    }
  }

  return relationships
}

/**
 * Parses User Flows text (from Section 05) into sequence steps.
 */
export function parseUserFlows(text: string): ParsedFlowStep[] {
  if (!text || !text.trim()) return []

  const steps: ParsedFlowStep[] = []
  const lines = text.split('\n')

  let stepCounter = 1

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    // Handle numbered lines: "1. User initiates checkout -> Gateway processes charge -> DB creates order"
    // Or bullet lines: "- Step 1: ..."
    const cleaned = line.replace(/^(\d+\.|[-*•])\s*/, '')
    const parts = cleaned.split(/\s*(?:->|==>|-->)\s*/)

    if (parts.length >= 2) {
      for (let i = 0; i < parts.length - 1; i++) {
        const source = parts[i]!.trim()
        const dest = parts[i + 1]!.trim()
        steps.push({
          stepNumber: stepCounter++,
          actor: source.length > 30 ? source.slice(0, 28) + '...' : source,
          action: 'routes to',
          target: dest.length > 30 ? dest.slice(0, 28) + '...' : dest,
          details: `${source} -> ${dest}`,
        })
      }
    } else if (cleaned.length > 10) {
      steps.push({
        stepNumber: stepCounter++,
        actor: 'Client / User',
        action: 'executes',
        target: 'Application Service',
        details: cleaned,
      })
    }
  }

  return steps
}

/**
 * Parses API Endpoints text (from Section 09) into structured endpoints.
 */
export function parseApiEndpoints(text: string): ParsedEndpoint[] {
  if (!text || !text.trim()) return []

  const endpoints: ParsedEndpoint[] = []
  const lines = text.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const match = line.match(
      /(GET|POST|PUT|PATCH|DELETE)\s+([/\w\-:?&=.]+)(?:\s*(?:->|:|-)\s*(.+))?/i,
    )
    if (match) {
      endpoints.push({
        method: match[1]!.toUpperCase() as ParsedEndpoint['method'],
        path: match[2]!,
        description: match[3]?.trim() || 'API Route Endpoint',
      })
    }
  }

  return endpoints
}

/**
 * Generates Mermaid.js erDiagram code from parsed entities.
 */
export function generateMermaidErDiagram(entities: ParsedEntity[]): string {
  if (entities.length === 0) {
    return 'erDiagram\n    %% No entities detected in section 08\n'
  }

  const relationships = extractRelationships(entities)
  const lines: string[] = ['erDiagram']

  // Relationships section
  if (relationships.length > 0) {
    for (const rel of relationships) {
      lines.push(`    ${rel.fromTable} ||--o{ ${rel.toTable} : "has"`)
    }
  }

  // Entity definitions
  for (const entity of entities) {
    lines.push(`    ${entity.name} {`)
    for (const field of entity.fields) {
      const typeSanitized = field.type.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'string'
      const keyLabel = field.isPk ? 'PK' : field.isFk ? 'FK' : ''
      lines.push(`        ${typeSanitized} ${field.name} ${keyLabel}`.trimEnd())
    }
    lines.push('    }')
  }

  return lines.join('\n')
}

/**
 * Generates Mermaid.js sequenceDiagram code from user flows and endpoints.
 */
export function generateMermaidSequenceDiagram(
  flows: ParsedFlowStep[],
  endpoints: ParsedEndpoint[],
): string {
  const lines: string[] = [
    'sequenceDiagram',
    '    autonumber',
    '    actor Client as Client / User',
    '    participant Gateway as API Gateway',
    '    participant Service as Application Logic',
    '    participant DB as Database / Store',
  ]

  if (endpoints.length > 0) {
    for (const ep of endpoints.slice(0, 5)) {
      lines.push(`    Client->>Gateway: ${ep.method} ${ep.path}`)
      lines.push(`    Gateway->>Service: Dispatch Request`)
      lines.push(`    Service->>DB: Query / Mutate State`)
      lines.push(`    DB-->>Service: Return Result`)
      lines.push(`    Service-->>Client: 200 OK (${ep.description.slice(0, 30)})`)
    }
  } else if (flows.length > 0) {
    for (const flow of flows.slice(0, 6)) {
      lines.push(`    Client->>Service: ${flow.details.slice(0, 45)}`)
      lines.push(`    Service->>DB: Persist state changes`)
      lines.push(`    DB-->>Client: Confirm state commit`)
    }
  } else {
    lines.push('    Client->>Gateway: Request execution')
    lines.push('    Gateway->>DB: Commit transaction')
  }

  return lines.join('\n')
}

/**
 * Generates Mermaid.js flowchart code from user flows.
 */
export function generateMermaidFlowchart(flows: ParsedFlowStep[]): string {
  if (flows.length === 0) {
    return 'flowchart TD\n    A["Start"] --> B["Process Flow"] --> C["Complete"]'
  }

  const lines: string[] = ['flowchart TD']
  for (let i = 0; i < flows.length; i++) {
    const f = flows[i]!
    const fromId = `N${i}`
    const toId = `N${i + 1}`
    const label = `${f.stepNumber}. ${f.details.replace(/"/g, "'")}`
    lines.push(`    ${fromId}["${label}"]`)
    if (i < flows.length - 1) {
      lines.push(`    ${fromId} --> ${toId}`)
    }
  }

  return lines.join('\n')
}
