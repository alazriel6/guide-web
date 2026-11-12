import { describe, it, expect } from 'vitest'
import { generateSqlDdl, generateSqlFromPrd } from '../sqlGenerator'
import { createBlankModel } from '../sections'

describe('sqlGenerator', () => {
  const model = createBlankModel()
  model.title = 'E-Commerce Marketplace'
  model.data_models = `
• accounts: id (PK), email (VARCHAR), is_verified (BOOL), created_at (TIMESTAMP)
• store_orders: id (PK), account_id (FK), total_amount (FLOAT), metadata (JSONB)
`

  it('generates valid PostgreSQL DDL with FK constraints and indexes', () => {
    const sql = generateSqlFromPrd(model, 'postgresql')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS accounts')
    expect(sql).toContain('id BIGSERIAL PRIMARY KEY')
    expect(sql).toContain('BOOLEAN DEFAULT FALSE')
    expect(sql).toContain('TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS store_orders')
    expect(sql).toContain('CONSTRAINT fk_store_orders_account_id FOREIGN KEY (account_id) REFERENCES accounts(id)')
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_store_orders_account_id ON store_orders (account_id);')
  })

  it('generates valid MySQL DDL', () => {
    const sql = generateSqlFromPrd(model, 'mysql')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS accounts')
    expect(sql).toContain('id BIGINT AUTO_INCREMENT PRIMARY KEY')
    expect(sql).toContain('TINYINT(1) DEFAULT 0')
  })

  it('generates valid SQLite DDL', () => {
    const sql = generateSqlFromPrd(model, 'sqlite')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS accounts')
    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
  })

  it('handles empty data models without error', () => {
    const emptySql = generateSqlDdl([])
    expect(emptySql).toContain('-- No structured data models detected')
  })
})
