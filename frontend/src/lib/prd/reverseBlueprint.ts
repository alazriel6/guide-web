/**
 * Reverse Blueprint Engine
 * Parses existing code, schemas, and specifications into a structured BlueprintDev PrdModel.
 * Supported formats:
 * - SQL DDL (PostgreSQL, MySQL, SQLite)
 * - Prisma Schema (schema.prisma)
 * - OpenAPI 3.x / Swagger (YAML or JSON)
 * - Docker Compose (docker-compose.yml)
 */

import type { PrdModel, FeatureItem } from './sections'

export type ReverseSourceFormat = 'sql' | 'prisma' | 'openapi' | 'docker' | 'auto'

export interface ReverseParseResult {
  format: 'sql' | 'prisma' | 'openapi' | 'docker' | 'unknown'
  model: Partial<PrdModel>
  detectedTablesCount: number
  detectedEndpointsCount: number
  summary: string
}

/**
 * Detect format from content
 */
export function detectSourceFormat(content: string): ReverseSourceFormat {
  const lower = content.toLowerCase().trim()
  if (lower.includes('create table') || (lower.includes('varchar') && lower.includes('primary key'))) {
    return 'sql'
  }
  if (lower.includes('datasource db') || lower.includes('generator client') || lower.includes('model ')) {
    return 'prisma'
  }
  if (lower.includes('openapi:') || lower.includes('swagger:') || (lower.includes('"paths":') && lower.includes('"openapi"'))) {
    return 'openapi'
  }
  if (lower.includes('services:') && (lower.includes('image:') || lower.includes('build:'))) {
    return 'docker'
  }
  return 'sql' // fallback
}

/**
 * Parse SQL DDL to extract tables, columns, PK, and FK
 */
export function parseSqlDdl(sql: string): {
  dataModelsText: string
  tables: string[]
  endpointsText: string
  features: FeatureItem[]
} {
  const tables: string[] = []
  const modelLines: string[] = []
  const endpointLines: string[] = []
  const features: FeatureItem[] = []

  // Clean SQL comments
  const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  // Regex to match CREATE TABLE statements
  const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\);/gi
  let match: RegExpExecArray | null

  while ((match = tableRegex.exec(cleanSql)) !== null) {
    const rawTableName = match[1]
    if (!rawTableName) continue
    const tableName = rawTableName.toLowerCase()
    const body = match[2] || ''
    tables.push(tableName)

    const fields: string[] = []
    const lines = body.split(',')

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      const lowerLine = line.toLowerCase()

      // Skip table-level constraints if already processed
      if (lowerLine.startsWith('primary key') || lowerLine.startsWith('foreign key') || lowerLine.startsWith('constraint')) {
        continue
      }

      // Column definition: [name] [type] [constraints...]
      const colParts = line.split(/\s+/)
      const colName = (colParts[0] || '').replace(/["`]/g, '')
      const colType = (colParts[1] || 'VARCHAR').toUpperCase()
      if (!colName || colName.toUpperCase() === 'CONSTRAINT') continue

      let modifier = ''
      if (lowerLine.includes('primary key')) modifier = ' (PK)'
      else if (lowerLine.includes('references') || colName.endsWith('_id')) modifier = ' (FK)'
      else if (lowerLine.includes('unique')) modifier = ' (UNIQUE)'

      fields.push(`${colName} ${colType}${modifier}`)
    }

    if (fields.length > 0) {
      modelLines.push(`- **${tableName}**: ${fields.join(', ')}`)
    } else {
      modelLines.push(`- **${tableName}**: id (PK), created_at TIMESTAMP`)
    }

    // Auto-generate standard CRUD REST endpoints for each detected table
    const resource = tableName.endsWith('s') ? tableName : `${tableName}s`
    endpointLines.push(`GET /api/${resource} -> Ambil daftar data ${tableName}`)
    endpointLines.push(`GET /api/${resource}/:id -> Detail spesifik ${tableName}`)
    endpointLines.push(`POST /api/${resource} -> Tambah data ${tableName} baru`)
    endpointLines.push(`PUT /api/${resource}/:id -> Perbarui data ${tableName}`)
    endpointLines.push(`DELETE /api/${resource}/:id -> Hapus data ${tableName}`)

    // Create feature representation
    features.push({
      name: `Manajemen ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`,
      description: `Modul pengelolaan data ${tableName} lengkap dengan validasi dan otentikasi.`,
      priority: features.length === 0 ? 'mvp' : 'later',
    })
  }

  return {
    dataModelsText: modelLines.join('\n'),
    tables,
    endpointsText: endpointLines.join('\n'),
    features,
  }
}

/**
 * Parse Prisma Schema
 */
export function parsePrismaSchema(prisma: string): {
  dataModelsText: string
  tables: string[]
  endpointsText: string
  features: FeatureItem[]
} {
  const tables: string[] = []
  const modelLines: string[] = []
  const endpointLines: string[] = []
  const features: FeatureItem[] = []

  const modelRegex = /model\s+([a-zA-Z0-9_]+)\s*\{([\s\S]*?)\}/gi
  let match: RegExpExecArray | null

  while ((match = modelRegex.exec(prisma)) !== null) {
    const rawName = match[1]
    if (!rawName) continue
    const modelName = rawName.toLowerCase()
    const body = match[2] || ''
    tables.push(modelName)

    const fields: string[] = []
    const lines = body.split('\n')

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue

      const parts = line.split(/\s+/)
      const fieldName = parts[0]
      const fieldType = parts[1] || 'String'
      if (!fieldName || !fieldType) continue

      let modifier = ''
      if (line.includes('@id')) modifier = ' (PK)'
      else if (line.includes('@relation') || fieldName.endsWith('Id')) modifier = ' (FK)'
      else if (line.includes('@unique')) modifier = ' (UNIQUE)'

      fields.push(`${fieldName} ${fieldType}${modifier}`)
    }

    if (fields.length > 0) {
      modelLines.push(`- **${modelName}**: ${fields.join(', ')}`)
    }

    const resource = modelName.endsWith('s') ? modelName : `${modelName}s`
    endpointLines.push(`GET /api/${resource} -> Ambil daftar ${modelName}`)
    endpointLines.push(`POST /api/${resource} -> Tambah ${modelName} baru`)
    endpointLines.push(`GET /api/${resource}/:id -> Detail ${modelName}`)

    features.push({
      name: `Modul ${rawName}`,
      description: `Operasi bisnis dan persistensi entitas ${rawName}.`,
      priority: features.length === 0 ? 'mvp' : 'later',
    })
  }

  return {
    dataModelsText: modelLines.join('\n'),
    tables,
    endpointsText: endpointLines.join('\n'),
    features,
  }
}

/**
 * Parse OpenAPI YAML / JSON endpoints
 */
export function parseOpenApiPaths(content: string): {
  endpointsText: string
  detectedEndpointsCount: number
  endpointList: string[]
} {
  const endpointLines: string[] = []
  let count = 0

  // Line-by-line parser checking paths and HTTP methods
  const lines = content.split('\n')
  let currentPath = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || ''
    const trimmed = line.trim()

    // Detect path in YAML
    if (trimmed.startsWith('/') && trimmed.endsWith(':')) {
      currentPath = trimmed.slice(0, -1).trim()
      continue
    }

    // Detect HTTP method under path
    const m = /^(get|post|put|patch|delete):/i.exec(trimmed)
    if (m && currentPath) {
      const method = m[1]!.toUpperCase()
      let summary = 'REST API endpoint'

      // Lookahead for summary:
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = (lines[j] || '').trim()
        if (nextLine.startsWith('summary:')) {
          summary = nextLine.replace('summary:', '').trim().replace(/^['"]|['"]$/g, '')
          break
        }
      }

      endpointLines.push(`${method} ${currentPath} -> ${summary}`)
      count++
    }
  }

  return {
    endpointsText: endpointLines.join('\n'),
    detectedEndpointsCount: count,
    endpointList: endpointLines,
  }
}

/**
 * Main Reverse-Engineering Pipeline:
 * Converts raw source content into BlueprintDev PrdModel
 */
export function reverseEngineerToBlueprint(
  rawContent: string,
  preferredFormat: ReverseSourceFormat = 'auto',
): ReverseParseResult {
  const content = rawContent.trim()
  if (!content) {
    return {
      format: 'unknown',
      model: {},
      detectedTablesCount: 0,
      detectedEndpointsCount: 0,
      summary: 'Konten kosong. Silakan tempel kode SQL, Prisma, OpenAPI, atau Docker Compose.',
    }
  }

  const format = preferredFormat === 'auto' ? detectSourceFormat(content) : preferredFormat

  let tablesText = ''
  let endpointsText = ''
  let tables: string[] = []
  let features: FeatureItem[] = []
  let detectedTechStack = ''
  let appTitle = 'Aplikasi Reverse Blueprint'

  if (format === 'sql') {
    const res = parseSqlDdl(content)
    tablesText = res.dataModelsText
    endpointsText = res.endpointsText
    tables = res.tables
    features = res.features
    detectedTechStack = '- Database: PostgreSQL / MySQL relational database\n- Backend: REST API microservice\n- Data Access: SQL DDL migrations with strict referential integrity'
    appTitle = tables.length > 0 ? `Sistem Manajemen ${tables[0] ? tables[0].toUpperCase() : 'Database'}` : 'Sistem Database Relasional'
  } else if (format === 'prisma') {
    const res = parsePrismaSchema(content)
    tablesText = res.dataModelsText
    endpointsText = res.endpointsText
    tables = res.tables
    features = res.features
    detectedTechStack = '- ORM: Prisma Client with typed migrations\n- Database: PostgreSQL / SQLite\n- Backend: Node.js (TypeScript) / Next.js API Routes'
    appTitle = tables.length > 0 ? `Sistem Layanan ${tables[0] ? tables[0].toUpperCase() : 'Prisma'}` : 'Aplikasi Fullstack Prisma'
  } else if (format === 'openapi') {
    const res = parseOpenApiPaths(content)
    endpointsText = res.endpointsText
    detectedTechStack = '- API Standard: OpenAPI 3.1 / Swagger REST API\n- Contract: Strict JSON Schema request/response validation\n- Architecture: Decoupled client-server API architecture'
    appTitle = 'Layanan REST API Terintegrasi'
    features = [
      { name: 'Endpoints Publik', description: 'Rute API RESTful terstruktur', priority: 'mvp' },
      { name: 'Otentikasi & Validasi', description: 'Validasi payload dan keamanan otorisasi', priority: 'mvp' },
    ]
  } else if (format === 'docker') {
    detectedTechStack = '- Containerization: Docker & Docker Compose\n- Multi-service microservice network\n- Environment configuration via .env'
    appTitle = 'Arsitektur Aplikasi Multi-Container'
    features = [
      { name: 'Orkestrasi Container', description: 'Multi-service deployment dengan Docker Compose', priority: 'mvp' },
    ]
  }

  const model: Partial<PrdModel> = {
    title: appTitle,
    category: format === 'openapi' || format === 'sql' ? 'REST Microservice' : 'SaaS Web App',
    overview: `Cetak biru arsitektur yang di-generate otomatis via Reverse Blueprint Engine berdasarkan kode sumber ${format.toUpperCase()}.`,
    problem: `Perlu standarisasi arsitektur, dokumentasi skema database, dan kontrak API untuk codebase yang sudah berjalan.`,
    personas: 'Software Engineer, Tech Lead, Product Architect, QA Specialist',
    features: features.length > 0 ? features : [
      { name: 'Otentikasi & Keamanan', description: 'JWT authentication dan session guard', priority: 'mvp' },
      { name: 'Core CRUD Operations', description: 'Pengelolaan entitas data sesuai skema', priority: 'mvp' },
    ],
    flows: '1. Klien mengirim permintaan HTTP ke API Gateway\n2. Middleware memverifikasi otorisasi token\n3. Controller memproses logika bisnis dan validasi data\n4. Database mengeksekusi query relasional dengan transaksi aman\n5. Klien menerima respons JSON terstandarisasi',
    metrics: 'API p95 latency < 150ms, 99.9% uptime, zero SQL injection vulnerabilities',
    stack: detectedTechStack || '- Modern Web Architecture with strict typing and containerization',
    data_models: tablesText || '- **records**: id (PK), name (VARCHAR), status (VARCHAR), created_at TIMESTAMP',
    api_contract: endpointsText || 'GET /api/v1/health -> Healthcheck endpoint\nGET /api/v1/records -> Daftar data\nPOST /api/v1/records -> Tambah data baru',
    nfr: '- Keamanan: Enkripsi data at-rest & in-transit, parameterized SQL queries\n- Skalabilitas: Stateless API architecture dengan connection pool\n- Logging: Structured JSON logs dengan tracing request ID',
    non_goals: '- Tidak mencakup migrasi legacy data historis di fase 1',
    constraints: '- Wajib menggunakan TypeScript/Go dengan validasi skema ketat\n- Zero unsafe inline SQL queries',
    open_questions: 'Berapa volume data bulanan yang diharapkan untuk perencanaan partisi tabel?',
  }

  const detectedEndpointsCount = endpointsText ? endpointsText.split('\n').filter(Boolean).length : 0

  const resolvedFormat = format === 'auto' ? 'sql' : format

  return {
    format: resolvedFormat,
    model,
    detectedTablesCount: tables.length,
    detectedEndpointsCount,
    summary: `Berhasil reverse-engineer ${resolvedFormat.toUpperCase()}: ${tables.length} tabel database dan ${detectedEndpointsCount} endpoint API terdeteksi.`,
  }
}
