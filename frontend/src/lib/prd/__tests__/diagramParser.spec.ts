import { describe, it, expect } from 'vitest'
import {
  parseDataModels,
  extractRelationships,
  parseUserFlows,
  parseApiEndpoints,
  generateMermaidErDiagram,
  generateMermaidSequenceDiagram,
  generateMermaidFlowchart,
} from '../diagramParser'

describe('diagramParser', () => {
  const sampleDataModels = `
Core Entities
• organizations: id (PK), slug (UNIQUE), name, plan_tier, created_at
• feature_flags: id (PK), org_id (FK), key (VARCHAR), env (VARCHAR), enabled (BOOL), rollout_pct (INT), version (INT)
• flag_audit_logs: id (PK), flag_id (FK), actor_email (VARCHAR), previous_state (JSONB), created_at
`

  const sampleFlows = `
1. User configures flag rule -> 2. Evaluator generates SHA-256 bucket -> 3. Client SDK fetches SSE delta stream.
4. Client SDK evaluates flag in-memory.
`

  const sampleEndpoints = `
- GET /api/v1/flags?env=production -> Returns evaluated flag manifest
- POST /api/v1/flags -> Creates a new flag definition across environments
- PUT /api/v1/flags/:id/toggle -> Atomic version-checked flag state mutation
- DELETE /api/v1/flags/:id -> Remove flag definition
`

  it('parses tables, fields, and types from markdown data models', () => {
    const entities = parseDataModels(sampleDataModels)
    expect(entities).toHaveLength(3)

    const orgs = entities.find((e) => e.name === 'organizations')
    expect(orgs).toBeDefined()
    expect(orgs?.fields.some((f) => f.name === 'id' && f.isPk)).toBe(true)
    expect(orgs?.fields.some((f) => f.name === 'name')).toBe(true)

    const flags = entities.find((e) => e.name === 'feature_flags')
    expect(flags).toBeDefined()
    expect(flags?.fields.some((f) => f.name === 'org_id' && f.isFk)).toBe(true)
    expect(flags?.fields.some((f) => f.name === 'enabled' && f.type === 'BOOLEAN')).toBe(true)
  })

  it('extracts foreign key relationships across entities', () => {
    const entities = parseDataModels(sampleDataModels)
    const relationships = extractRelationships(entities)

    expect(relationships.length).toBeGreaterThanOrEqual(1)
    const orgToFlags = relationships.find(
      (r) => r.fromTable === 'organizations' && r.toTable === 'feature_flags',
    )
    expect(orgToFlags).toBeDefined()
    expect(orgToFlags?.fromField).toBe('org_id')
  })

  it('parses user flow sequence steps', () => {
    const flows = parseUserFlows(sampleFlows)
    expect(flows.length).toBeGreaterThan(0)
    expect(flows[0]?.stepNumber).toBe(1)
  })

  it('parses REST API endpoints', () => {
    const endpoints = parseApiEndpoints(sampleEndpoints)
    expect(endpoints).toHaveLength(4)
    expect(endpoints[0]?.method).toBe('GET')
    expect(endpoints[0]?.path).toBe('/api/v1/flags?env=production')
    expect(endpoints[1]?.method).toBe('POST')
    expect(endpoints[2]?.method).toBe('PUT')
    expect(endpoints[3]?.method).toBe('DELETE')
  })

  it('generates valid Mermaid.js erDiagram syntax', () => {
    const entities = parseDataModels(sampleDataModels)
    const mermaid = generateMermaidErDiagram(entities)

    expect(mermaid).toContain('erDiagram')
    expect(mermaid).toContain('organizations ||--o{ feature_flags : "has"')
    expect(mermaid).toContain('organizations {')
    expect(mermaid).toContain('int id PK')
    expect(mermaid).toContain('feature_flags {')
  })

  it('generates valid Mermaid.js sequenceDiagram syntax', () => {
    const flows = parseUserFlows(sampleFlows)
    const endpoints = parseApiEndpoints(sampleEndpoints)
    const mermaid = generateMermaidSequenceDiagram(flows, endpoints)

    expect(mermaid).toContain('sequenceDiagram')
    expect(mermaid).toContain('autonumber')
    expect(mermaid).toContain('participant Gateway as API Gateway')
    expect(mermaid).toContain('GET /api/v1/flags?env=production')
  })

  it('generates valid Mermaid.js flowchart syntax', () => {
    const flows = parseUserFlows(sampleFlows)
    const mermaid = generateMermaidFlowchart(flows)

    expect(mermaid).toContain('flowchart TD')
  })

  it('handles empty inputs gracefully', () => {
    expect(parseDataModels('')).toEqual([])
    expect(parseUserFlows('')).toEqual([])
    expect(parseApiEndpoints('')).toEqual([])
    expect(generateMermaidErDiagram([])).toContain('erDiagram')
    expect(generateMermaidSequenceDiagram([], [])).toContain('sequenceDiagram')
  })
})
