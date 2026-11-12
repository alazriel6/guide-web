import { describe, it, expect } from 'vitest'
import {
  evaluateProductionReadiness,
  generatePrrMarkdown,
} from '../prrAudit'
import { createBlankModel } from '../sections'

describe('prrAudit', () => {
  it('blocks unhardened prototype with missing critical SRE safeguards', () => {
    const rawModel = createBlankModel('Naive Service', 'REST Microservice')
    rawModel.stack = 'Python, SQLite'
    rawModel.api_contract = 'GET /api/items'

    const report = evaluateProductionReadiness(rawModel)
    expect(report.verdict).toBe('BLOCKED')
    expect(report.criticalFailedCount).toBeGreaterThan(0)
    expect(report.score).toBeLessThan(70)
  })

  it('approves production-ready architecture with all pillars satisfied', () => {
    const hardened = createBlankModel('Enterprise Banking Gateway', 'REST Microservice')
    hardened.stack = 'Go, PostgreSQL, Redis, Pino structured logger'
    hardened.data_models = 'accounts: id (PK), user_id (FK), status (INDEX)'
    hardened.api_contract = 'GET /healthz\nGET /api/accounts?cursor=abc&limit=20\nPOST /api/auth/refresh'
    hardened.nfr = 'CORS whitelist https://bank.com. Automated daily backup snapshots. Egress timeout 3s. Request ID tracing correlation.'
    hardened.constraints = 'Parameterized SQL queries only with zero string concat. Graceful shutdown SIGTERM. Rate limit 100 req/min.'

    const report = evaluateProductionReadiness(hardened)
    expect(report.verdict).toBe('READY')
    expect(report.criticalFailedCount).toBe(0)
    expect(report.score).toBeGreaterThanOrEqual(85)

    const markdown = generatePrrMarkdown(report, hardened)
    expect(markdown).toContain('READY FOR PRODUCTION')
    expect(markdown).toContain('Lead Software Architect')
    expect(markdown).toContain('Site Reliability Engineer (SRE)')
  })
})
