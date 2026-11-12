import { describe, it, expect } from 'vitest'
import { generateAdrSuite } from '../adrGenerator'
import { createBlankModel } from '../sections'

describe('adrGenerator', () => {
  it('generates a full suite of 5 MADR architectural decision records', () => {
    const model = createBlankModel('Order Fulfillment Engine', 'SaaS Web App')
    model.stack = 'Go 1.22+, PostgreSQL 16, Redis, Docker'

    const adrs = generateAdrSuite(model)
    expect(adrs.length).toBeGreaterThanOrEqual(5)

    const titles = adrs.map((a) => a.title)
    expect(titles).toContain('Pemilihan Arsitektur Inti & Tech Stack')
    expect(titles).toContain('Strategi Database & Integritas Relasional')
    expect(titles).toContain('Standar Komunikasi API & Format Kontrak JSON')
    expect(titles).toContain('Otentikasi, Autorisasi & Keamanan Sesi Klien')
    expect(titles).toContain('Strategi Caching & Ketahanan Beban Puncak')

    // Verify MADR format elements
    const adr1 = adrs[0]!
    expect(adr1.markdown).toContain('# 1. Pemilihan Arsitektur Inti & Tech Stack')
    expect(adr1.markdown).toContain('## Context and Problem Statement')
    expect(adr1.markdown).toContain('## Decision Outcome')
    expect(adr1.markdown).toContain('## Positive Consequences')
    expect(adr1.markdown).toContain('## Negative Consequences & Trade-offs')
    expect(adr1.positiveConsequences.length).toBeGreaterThanOrEqual(2)
  })
})
