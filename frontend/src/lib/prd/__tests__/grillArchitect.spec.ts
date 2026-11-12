import { describe, it, expect } from 'vitest'
import {
  grillArchitecture,
  applyGrillFixesToModel,
} from '../grillArchitect'
import { createBlankModel } from '../sections'

describe('grillArchitect', () => {
  it('identifies critical bottlenecks on minimal unhardened blueprint', () => {
    const rawModel = createBlankModel('Naive App', 'SaaS Web App')
    rawModel.stack = 'Node.js, PostgreSQL'
    rawModel.data_models = 'users (id, email, password)'
    rawModel.api_contract = 'GET /api/users\nPOST /api/users'

    const report = grillArchitecture(rawModel)
    expect(report.criticalCount).toBeGreaterThan(0)
    expect(report.score).toBeLessThan(75)

    // Check specific bottleneck findings
    const findingIds = report.findings.map((f) => f.id)
    expect(findingIds).toContain('missing-caching-layer')
    expect(findingIds).toContain('missing-rate-limiter')
    expect(findingIds).toContain('unbounded-query-pagination')
  })

  it('awards high score and strength badges to hardened enterprise blueprint', () => {
    const hardened = createBlankModel('Enterprise Core', 'SaaS Web App')
    hardened.stack = 'Go 1.22, PostgreSQL 16, Redis Cluster, Kafka'
    hardened.data_models = 'users (id PK, email UNIQUE, status VARCHAR(20), INDEX on status)'
    hardened.api_contract = 'GET /api/v1/healthz\nGET /api/v1/users?cursor=xyz&limit=20\nPOST /api/v1/auth/refresh'
    hardened.nfr = 'Rate Limiting 100 req/min per IP. Database Read Replica multi-az with automated failover. Redis LRU cache hit > 90%. Connection timeout 3s.'
    hardened.constraints = 'Parameterized SQL queries only with zero raw concatenation. Stateless servers. Token refresh rotation.'

    const report = grillArchitecture(hardened)
    expect(report.score).toBeGreaterThanOrEqual(85)
    expect(report.strengthsCount).toBeGreaterThanOrEqual(3)
    expect(report.criticalCount).toBe(0)
  })

  it('applies 1-click hardening fixes into Section 10 (NFR) and Section 12 (Constraints)', () => {
    const rawModel = createBlankModel('Vulnerable App', 'SaaS Web App')
    rawModel.stack = 'Express, MySQL'
    rawModel.api_contract = 'GET /api/posts'

    const initialReport = grillArchitecture(rawModel)
    expect(initialReport.suggestedNfrAdditions.length).toBeGreaterThan(0)

    const hardenedModel = applyGrillFixesToModel(rawModel, initialReport)
    expect(hardenedModel.nfr).toContain('Rate Limiting')
    expect(hardenedModel.nfr).toContain('Pagination')
    expect(hardenedModel.constraints).toContain('parameter binding')

    // Second evaluation should show improved score
    const postReport = grillArchitecture(hardenedModel)
    expect(postReport.score).toBeGreaterThan(initialReport.score)
  })
})
