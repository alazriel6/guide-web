import { describe, it, expect } from 'vitest'
import {
  detectSourceFormat,
  parseSqlDdl,
  parsePrismaSchema,
  parseOpenApiPaths,
  reverseEngineerToBlueprint,
} from '../reverseBlueprint'

describe('reverseBlueprint', () => {
  describe('detectSourceFormat', () => {
    it('detects SQL DDL format', () => {
      const sql = `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));`
      expect(detectSourceFormat(sql)).toBe('sql')
    })

    it('detects Prisma schema format', () => {
      const prisma = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }
        model User {
          id Int @id @default(autoincrement())
        }
      `
      expect(detectSourceFormat(prisma)).toBe('prisma')
    })

    it('detects OpenAPI format', () => {
      const openapi = `
        openapi: 3.0.0
        info:
          title: Sample API
        paths:
          /users:
            get:
      `
      expect(detectSourceFormat(openapi)).toBe('openapi')
    })

    it('detects Docker compose format', () => {
      const compose = `
        version: '3.8'
        services:
          web:
            image: nginx:alpine
      `
      expect(detectSourceFormat(compose)).toBe('docker')
    })
  })

  describe('parseSqlDdl', () => {
    it('extracts tables, columns, and generates CRUD endpoints', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE orders (
          id UUID PRIMARY KEY,
          user_id INT REFERENCES users(id),
          total_amount DECIMAL(10, 2),
          status VARCHAR(20)
        );
      `
      const result = parseSqlDdl(sql)
      expect(result.tables).toEqual(['users', 'orders'])
      expect(result.dataModelsText).toContain('- **users**:')
      expect(result.dataModelsText).toContain('id SERIAL (PK)')
      expect(result.dataModelsText).toContain('- **orders**:')
      expect(result.dataModelsText).toContain('user_id INT (FK)')
      expect(result.endpointsText).toContain('GET /api/users')
      expect(result.endpointsText).toContain('POST /api/orders')
      expect(result.features.length).toBe(2)
      expect(result.features[0]?.name).toBe('Manajemen Users')
    })
  })

  describe('parsePrismaSchema', () => {
    it('extracts Prisma models, fields, and directives', () => {
      const prisma = `
        model Account {
          id        String   @id @default(uuid())
          userId    String
          balance   Float
          createdAt DateTime @default(now())
        }
      `
      const result = parsePrismaSchema(prisma)
      expect(result.tables).toEqual(['account'])
      expect(result.dataModelsText).toContain('- **account**: id String (PK), userId String (FK), balance Float, createdAt DateTime')
      expect(result.endpointsText).toContain('GET /api/accounts')
      expect(result.features[0]?.name).toBe('Modul Account')
    })
  })

  describe('parseOpenApiPaths', () => {
    it('parses paths and HTTP methods with summaries', () => {
      const yaml = `
        openapi: 3.0.0
        paths:
          /api/v1/auth/login:
            post:
              summary: User login authentication
          /api/v1/products:
            get:
              summary: List all active products
            post:
              summary: Create new catalog product
      `
      const result = parseOpenApiPaths(yaml)
      expect(result.detectedEndpointsCount).toBe(3)
      expect(result.endpointsText).toContain('POST /api/v1/auth/login -> User login authentication')
      expect(result.endpointsText).toContain('GET /api/v1/products -> List all active products')
      expect(result.endpointsText).toContain('POST /api/v1/products -> Create new catalog product')
    })
  })

  describe('reverseEngineerToBlueprint', () => {
    it('converts SQL DDL into full 13-section PrdModel', () => {
      const sql = `
        CREATE TABLE products (
          id INT PRIMARY KEY,
          title VARCHAR(100),
          price INT
        );
      `
      const res = reverseEngineerToBlueprint(sql, 'sql')
      expect(res.format).toBe('sql')
      expect(res.detectedTablesCount).toBe(1)
      expect(res.model.title).toContain('PRODUCTS')
      expect(res.model.data_models).toContain('products')
      expect(res.model.api_contract).toContain('/api/products')
      expect(res.model.features?.length).toBeGreaterThanOrEqual(1)
      expect(res.model.stack).toContain('PostgreSQL')
    })

    it('handles empty input gracefully', () => {
      const res = reverseEngineerToBlueprint('', 'auto')
      expect(res.format).toBe('unknown')
      expect(res.detectedTablesCount).toBe(0)
    })
  })
})
