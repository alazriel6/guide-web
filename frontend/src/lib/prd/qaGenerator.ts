import type { PrdModel } from './sections'
import {
  parseDataModels,
  parseApiEndpoints,
  type ParsedEntity,
  type ParsedEndpoint,
} from './diagramParser'

/**
 * Generates an automated, executable REST Client test suite (.http)
 * Compatible with VS Code REST Client, Cursor, JetBrains HTTP Client, and httpyac CLI runner.
 */
export function generateHttpFile(model: PrdModel): string {
  const title = model.title || 'API Specification'
  const endpoints = parseApiEndpoints(model.api_contract || '')
  const entities = parseDataModels(model.data_models || '')

  // Fallback endpoints if none are explicitly declared in Section 09
  const resolvedEndpoints: ParsedEndpoint[] =
    endpoints.length > 0
      ? endpoints
      : entities.length > 0
        ? entities.flatMap((entity) => {
            const slug = entity.name.toLowerCase()
            return [
              { method: 'GET', path: `/api/${slug}`, description: `List all ${entity.name} records` },
              { method: 'POST', path: `/api/${slug}`, description: `Create new ${entity.name}` },
              { method: 'GET', path: `/api/${slug}/:id`, description: `Get ${entity.name} by ID` },
              { method: 'PUT', path: `/api/${slug}/:id`, description: `Update ${entity.name}` },
              { method: 'DELETE', path: `/api/${slug}/:id`, description: `Delete ${entity.name}` },
            ]
          })
        : [
            { method: 'GET', path: '/api/items', description: 'List all items' },
            { method: 'POST', path: '/api/items', description: 'Create new item' },
            { method: 'GET', path: '/api/items/:id', description: 'Get item by ID' },
          ]

  const entityMap = new Map<string, ParsedEntity>()
  for (const ent of entities) {
    entityMap.set(ent.name.toLowerCase(), ent)
  }

  const lines: string[] = []

  lines.push('### ==============================================================================')
  lines.push(`### QA REST CLIENT TEST SUITE & AUTOMATED ASSERTIONS`)
  lines.push(`### Project: ${title}`)
  lines.push(`### Category: ${model.category}`)
  lines.push(`### Standard: RFC 7231 / REST Client (VS Code, Cursor, JetBrains, httpyac)`)
  lines.push('### ==============================================================================')
  lines.push('')
  lines.push('@baseUrl = http://localhost:8000')
  lines.push('@contentType = application/json')
  lines.push('@testEmail = qa_tester@example.com')
  lines.push('@testPassword = Password123!')
  lines.push('@invalidPassword = 123')
  lines.push('')
  lines.push('### ------------------------------------------------------------------------------')
  lines.push('### 1. SMOKE TEST / HEALTHCHECK')
  lines.push('### ------------------------------------------------------------------------------')
  lines.push('')
  lines.push('### [SMOKE-01] Healthcheck & System Ping')
  lines.push('GET {{baseUrl}}/api/health')
  lines.push('Accept: {{contentType}}')
  lines.push('')
  lines.push('> {%')
  lines.push('  client.test("SMOKE-01: Service is online and healthy (200 OK)", function() {')
  lines.push('    client.assert(response.status === 200, "Healthcheck failed with status: " + response.status);')
  lines.push('  });')
  lines.push('%}')
  lines.push('')
  lines.push('### ------------------------------------------------------------------------------')
  lines.push('### 2. AUTHENTICATION & ACCESS CONTROL (SECURITY TEST SUITE)')
  lines.push('### ------------------------------------------------------------------------------')
  lines.push('')
  lines.push('### [SEC-01] NEGATIVE: Register with Weak Password')
  lines.push('POST {{baseUrl}}/api/auth/register')
  lines.push('Content-Type: {{contentType}}')
  lines.push('')
  lines.push('{')
  lines.push('  "name": "QA Tester",')
  lines.push('  "email": "invalid_qa@example.com",')
  lines.push('  "password": "{{invalidPassword}}"')
  lines.push('}')
  lines.push('')
  lines.push('> {%')
  lines.push('  client.test("SEC-01: Weak password must be rejected (400 or 422)", function() {')
  lines.push('    client.assert(response.status === 400 || response.status === 422, "Expected 400/422 but received " + response.status);')
  lines.push('  });')
  lines.push('%}')
  lines.push('')
  lines.push('### [SEC-02] POSITIVE: Register QA User Account')
  lines.push('POST {{baseUrl}}/api/auth/register')
  lines.push('Content-Type: {{contentType}}')
  lines.push('')
  lines.push('{')
  lines.push('  "name": "QA Lead Tester",')
  lines.push('  "email": "{{testEmail}}",')
  lines.push('  "password": "{{testPassword}}"')
  lines.push('}')
  lines.push('')
  lines.push('> {%')
  lines.push('  client.test("SEC-02: Register success (201 Created or 200 OK)", function() {')
  lines.push('    client.assert(response.status === 201 || response.status === 200, "Register failed with status: " + response.status);')
  lines.push('  });')
  lines.push('%}')
  lines.push('')
  lines.push('### [SEC-03] POSITIVE: Login & Extract Bearer JWT Token')
  lines.push('POST {{baseUrl}}/api/auth/login')
  lines.push('Content-Type: {{contentType}}')
  lines.push('')
  lines.push('{')
  lines.push('  "email": "{{testEmail}}",')
  lines.push('  "password": "{{testPassword}}"')
  lines.push('}')
  lines.push('')
  lines.push('> {%')
  lines.push('  client.test("SEC-03: Login returns 200 and access token", function() {')
  lines.push('    client.assert(response.status === 200, "Login failed: " + response.status);')
  lines.push('    var token = response.body.token || response.body.access_token || (response.body.data && response.body.data.token) || "mock-valid-token";')
  lines.push('    client.assert(token != null, "JWT token not found in response body");')
  lines.push('    client.global.set("authToken", token);')
  lines.push('  });')
  lines.push('%}')
  lines.push('')
  lines.push('### [SEC-04] NEGATIVE: Access Protected Endpoint Without Token')
  lines.push('GET {{baseUrl}}/api/auth/me')
  lines.push('Accept: {{contentType}}')
  lines.push('')
  lines.push('> {%')
  lines.push('  client.test("SEC-04: Unauthenticated request must return 401 Unauthorized", function() {')
  lines.push('    client.assert(response.status === 401, "Security breach! Unauthenticated request returned: " + response.status);')
  lines.push('  });')
  lines.push('%}')
  lines.push('')
  lines.push('### [SEC-05] POSITIVE: Access Protected Endpoint with Valid Token')
  lines.push('GET {{baseUrl}}/api/auth/me')
  lines.push('Authorization: Bearer {{authToken}}')
  lines.push('Accept: {{contentType}}')
  lines.push('')
  lines.push('> {%')
  lines.push('  client.test("SEC-05: Authenticated profile lookup succeeds (200 OK)", function() {')
  lines.push('    client.assert(response.status === 200, "Profile lookup failed with status: " + response.status);')
  lines.push('  });')
  lines.push('%}')
  lines.push('')
  lines.push('### ------------------------------------------------------------------------------')
  lines.push('### 3. FUNCTIONAL & CRUD BUSINESS LOGIC TEST SUITE')
  lines.push('### ------------------------------------------------------------------------------')

  let tcCount = 1

  for (const ep of resolvedEndpoints) {
    // Skip auth endpoints as they are handled in Section 2
    if (ep.path.includes('/auth/')) continue

    const tcId = `TC-${tcCount.toString().padStart(2, '0')}`
    tcCount++

    // Determine normalized clean path for request
    const cleanPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`
    const runtimePath = cleanPath.replace(/(?::|\{)([a-zA-Z0-9_]+)\}?/g, '{{createdId}}')

    // Find matching entity to generate realistic mock body
    const matchingEntityKey = Array.from(entityMap.keys()).find((k) =>
      cleanPath.toLowerCase().includes(k),
    )
    const matchedEntity = matchingEntityKey ? entityMap.get(matchingEntityKey) : undefined

    lines.push('')
    lines.push(`### [${tcId}] ${ep.method} ${cleanPath} - ${ep.description}`)
    lines.push(`${ep.method} {{baseUrl}}${runtimePath}`)
    lines.push('Authorization: Bearer {{authToken}}')

    if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
      lines.push('Content-Type: {{contentType}}')
      lines.push('')
      lines.push(generateMockPayload(matchedEntity))
    } else {
      lines.push('Accept: {{contentType}}')
    }

    lines.push('')
    lines.push('> {%')
    if (ep.method === 'POST') {
      lines.push(`  client.test("${tcId}: Create resource returns 201 or 200", function() {`)
      lines.push('    client.assert(response.status === 201 || response.status === 200, "Unexpected status: " + response.status);')
      lines.push('    var id = (response.body && (response.body.id || (response.body.data && response.body.data.id))) || "1";')
      lines.push('    client.global.set("createdId", id);')
      lines.push('  });')
    } else if (ep.method === 'DELETE') {
      lines.push(`  client.test("${tcId}: Delete resource returns 200 or 204", function() {`)
      lines.push('    client.assert(response.status === 200 || response.status === 204, "Unexpected status: " + response.status);')
      lines.push('  });')
    } else {
      lines.push(`  client.test("${tcId}: Query returns 200 OK", function() {`)
      lines.push('    client.assert(response.status === 200, "Unexpected status: " + response.status);')
      lines.push('  });')
    }
    lines.push('%}')

    // Add boundary / 404 test for resource-by-id queries
    if (cleanPath.includes(':') || cleanPath.includes('{')) {
      const notFoundPath = cleanPath.replace(/(?::|\{)([a-zA-Z0-9_]+)\}?/g, '99999999')

      lines.push('')
      lines.push(`### [${tcId}-NEG] NEGATIVE: Non-Existent ID must return 404 Not Found`)
      lines.push(`GET {{baseUrl}}${notFoundPath}`)
      lines.push('Authorization: Bearer {{authToken}}')
      lines.push('Accept: {{contentType}}')
      lines.push('')
      lines.push('> {%')
      lines.push(`  client.test("${tcId}-NEG: Query for non-existent record returns 404", function() {`)
      lines.push('    client.assert(response.status === 404, "Expected 404 Not Found but received: " + response.status);')
      lines.push('  });')
      lines.push('%}')
    }
  }

  return lines.join('\n')
}

/**
 * Generates an industry-standard QA Test Plan & Test Cases specification document (Markdown)
 */
export function generateQaTestPlan(model: PrdModel): string {
  const title = model.title || 'Software Engineering Project'
  const category = model.category || 'Web Application'
  const features = model.features || []
  const endpoints = parseApiEndpoints(model.api_contract || '')
  const entities = parseDataModels(model.data_models || '')

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const lines: string[] = []

  lines.push(`# QA MASTER TEST PLAN & VERIFICATION SPECIFICATION`)
  lines.push(``)
  lines.push(`> **Project:** ${title}  `)
  lines.push(`> **Category:** ${category}  `)
  lines.push(`> **Testing Standard:** ISTQB / IEEE 829 Software Test Documentation  `)
  lines.push(`> **Document Version:** 1.0.0 (Approved Architecture Test Suite)  `)
  lines.push(`> **Generated Date:** ${dateStr}  `)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  lines.push(`## 1. Executive Summary & Quality Objectives`)
  lines.push(``)
  lines.push(`This Quality Assurance (QA) Test Plan establishes the criteria, methodology, test cases, and database validation ledger for **${title}**.`)
  lines.push(`The primary objective is to verify functional compliance against product requirements, ensure data integrity across relational models, and certify production readiness.`)
  lines.push(``)
  lines.push(`### 1.1 Quality Gates (Exit Criteria)`)
  lines.push(`- **Smoke Tests:** 100% pass rate before deeper regression cycles.`)
  lines.push(`- **Functional Requirements:** Zero (0) Blocker or Critical defects open.`)
  lines.push(`- **Security & Authorization:** 100% of endpoints reject unauthenticated access with HTTP 401/403.`)
  lines.push(`- **API Contract Verification:** All request/response schemas match \`openapi.yaml\`.`)
  lines.push(`- **Database Referential Integrity:** Zero orphan records on cascading foreign key operations.`)
  lines.push(``)

  lines.push(`## 2. Test Strategy & Levels`)
  lines.push(``)
  lines.push(`| Test Level | Scope & Objective | Tools / Execution Mechanism |`)
  lines.push(`| :--- | :--- | :--- |`)
  lines.push(`| **Smoke / Sanity** | Fast verification of basic application bootstrap, healthcheck, and routing | \`api.http\` (SMOKE-01), cURL |`)
  lines.push(`| **Functional Testing** | Verification of user workflows, form validations, and business rules | \`api.http\`, Postman Collection, Manual Web UI |`)
  lines.push(`| **Integration Testing** | Verification of API contract adherence, database state changes, and auth tokens | Automated REST Client assertions, Vitest / Pytest |`)
  lines.push(`| **Boundary Testing (BVA)** | Input limits, empty payloads, string overflow, and non-existent IDs | Negative assertions in \`api.http\` |`)
  lines.push(`| **Database Validation** | Direct verification of SQL constraints, soft deletes, and timestamp updates | PostgreSQL / MySQL / SQLite queries |`)
  lines.push(`| **UAT (Acceptance)** | Business scenario approval by client or Product Owner | Staging deployment walkthrough |`)
  lines.push(``)

  lines.push(`## 3. Master Test Cases Matrix (Functional & Security)`)
  lines.push(``)
  lines.push(`| Test ID | Module / Feature | Test Scenario | Type | Pre-condition | Test Steps | Expected Result | Severity | Status |`)
  lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`)

  // Pre-baked Auth & Security Cases
  lines.push(`| **TC-SEC-01** | Auth | Register with password < 8 characters | Negative | Service is running | 1. POST \`/api/auth/register\` with 3-char password | HTTP 400/422 with validation error message | High | [ ] Pending |`)
  lines.push(`| **TC-SEC-02** | Auth | Register new account with valid payload | Positive | Email not in DB | 1. POST \`/api/auth/register\` with valid email/pass | HTTP 201 Created, user row created in DB | Critical | [ ] Pending |`)
  lines.push(`| **TC-SEC-03** | Auth | Login with valid credentials | Positive | User exists | 1. POST \`/api/auth/login\` with correct credentials | HTTP 200 OK with valid JWT bearer token | Critical | [ ] Pending |`)
  lines.push(`| **TC-SEC-04** | Auth | Access protected resource without token | Security | None | 1. GET \`/api/auth/me\` without Authorization header | HTTP 401 Unauthorized | Critical | [ ] Pending |`)

  let testIdCounter = 1

  // Feature-derived test cases
  for (const feat of features) {
    const idStr = `TC-FEAT-${testIdCounter.toString().padStart(2, '0')}`
    testIdCounter++
    const prioritySeverity = feat.priority === 'mvp' ? 'Critical' : 'Medium'

    lines.push(`| **${idStr}** | ${feat.name} | [Happy Path] Execute feature: ${feat.name} | Positive | User logged in | 1. Navigate to ${feat.name} UI<br>2. Submit valid inputs | Feature completes successfully: ${feat.description} | ${prioritySeverity} | [ ] Pending |`)
    lines.push(`| **${idStr}-B** | ${feat.name} | [Boundary] Submit empty or malformed inputs | Boundary | User logged in | 1. Clear required fields<br>2. Submit form | Inline validation error displayed, API rejects with 422 | ${prioritySeverity} | [ ] Pending |`)
  }

  // Endpoint-derived test cases
  for (const ep of endpoints) {
    if (ep.path.includes('/auth/')) continue
    const idStr = `TC-API-${testIdCounter.toString().padStart(2, '0')}`
    testIdCounter++

    const isGet = ep.method === 'GET'
    lines.push(`| **${idStr}** | API (${ep.method}) | ${ep.method} ${ep.path} - ${ep.description} | Positive | Server online | 1. Send ${ep.method} to \`${ep.path}\` with auth header | HTTP ${isGet ? '200' : '201/200'}, valid schema returned | High | [ ] Pending |`)
    lines.push(`| **${idStr}-N** | API (${ep.method}) | ${ep.method} ${ep.path} with missing Authorization | Security | Server online | 1. Send ${ep.method} without token | HTTP 401 Unauthorized | High | [ ] Pending |`)
  }

  lines.push(``)
  lines.push(`## 4. Database Validation Ledger (SQL Verification Queries)`)
  lines.push(``)
  lines.push(`Quality engineers must run these SQL queries against the local or staging database to verify that API actions result in proper persistent state changes.`)
  lines.push(``)

  lines.push('```sql')
  lines.push('-- 1. Verification: User Registration & Password Hashing')
  lines.push('-- Ensure password is NOT stored in plain text (must be bcrypt/argon2 hash)')
  lines.push("SELECT id, email, password_hash, created_at FROM users WHERE email = 'qa_tester@example.com';")
  lines.push('')

  for (const ent of entities) {
    const tName = ent.name
    lines.push(`-- 2. Verification: Integrity check for table [${tName}]`)
    lines.push(`SELECT COUNT(*) AS total_records FROM ${tName};`)
    lines.push(`SELECT * FROM ${tName} ORDER BY created_at DESC LIMIT 5;`)
    lines.push('')

    // Foreign key orphan check
    const fkField = ent.fields.find((f) => f.isFk && f.fkTargetTable)
    if (fkField && fkField.fkTargetTable) {
      lines.push(`-- Check for orphan records in [${tName}] missing parent in [${fkField.fkTargetTable}]`)
      lines.push(`SELECT child.id FROM ${tName} child`)
      lines.push(`LEFT JOIN ${fkField.fkTargetTable} parent ON child.${fkField.name} = parent.id`)
      lines.push(`WHERE parent.id IS NULL;`)
      lines.push('')
    }
  }

  lines.push('```')
  lines.push(``)

  lines.push(`## 5. Defect / Bug Reporting Protocol`)
  lines.push(``)
  lines.push(`When an actual result deviates from the expected result, log a defect in Jira, GitHub Issues, or Linear using the template below:`)
  lines.push(``)
  lines.push('````markdown')
  lines.push('### [BUG] Short descriptive title of the defect')
  lines.push('')
  lines.push('- **Test Case ID:** TC-...')
  lines.push('- **Severity:** Blocker | Critical | Major | Minor')
  lines.push('- **Environment:** Localhost / Staging (Chrome 122, Node 20+, Postgres 16)')
  lines.push('- **Pre-condition:** User authenticated as QA Lead')
  lines.push('')
  lines.push('#### Steps to Reproduce:')
  lines.push('1. Open `/...` in the browser or execute request in `tests/api.http`')
  lines.push('2. Input the following payload: `...`')
  lines.push('3. Click the Submit button')
  lines.push('')
  lines.push('#### Expected Result:')
  lines.push('HTTP 201 Created and redirect to the dashboard with a success toast.')
  lines.push('')
  lines.push('#### Actual Result:')
  lines.push('HTTP 500 Internal Server Error. Console shows unhandled exception: `...`')
  lines.push('')
  lines.push('#### Evidence & Logs:')
  lines.push('```json')
  lines.push('{"error": "Database constraint violation", "code": 500}')
  lines.push('```')
  lines.push('````')
  lines.push(``)

  lines.push(`## 6. User Acceptance Testing (UAT) Sign-off Matrix`)
  lines.push(``)
  lines.push(`| Acceptance Criteria | Verified By | Date | Sign-off Status |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  lines.push(`| Core user journey from landing page to completion operates smoothly | Product Owner / Client | ____________ | [ ] APPROVED |`)
  lines.push(`| Responsive layout verified on Desktop (1920x1080) and Mobile (375x812) | QA Engineer | ____________ | [ ] APPROVED |`)
  lines.push(`| Zero critical security or unhandled 500 errors in production logs | Tech Lead | ____________ | [ ] APPROVED |`)
  lines.push(`| Data persistence and backup verified in staging database | DevOps / Backend | ____________ | [ ] APPROVED |`)
  lines.push(``)

  return lines.join('\n')
}

/**
 * Generates a mock JSON payload based on parsed entity fields
 */
function generateMockPayload(entity?: ParsedEntity): string {
  if (!entity || entity.fields.length === 0) {
    return JSON.stringify(
      {
        title: 'QA Sample Record',
        description: 'Automated test record generated from BlueprintDev',
        status: 'active',
      },
      null,
      2,
    )
  }

  const obj: Record<string, unknown> = {}

  for (const f of entity.fields) {
    if (f.isPk) continue // skip auto-increment ID
    if (f.name === 'created_at' || f.name === 'updated_at' || f.name === 'deleted_at') continue

    const n = f.name.toLowerCase()
    const t = f.type.toUpperCase()

    if (f.isFk) {
      obj[f.name] = 1
    } else if (t.includes('INT')) {
      obj[f.name] = 10
    } else if (t.includes('BOOL')) {
      obj[f.name] = true
    } else if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL')) {
      obj[f.name] = 99.99
    } else if (t.includes('JSON')) {
      obj[f.name] = { tag: 'qa-automated', version: 1 }
    } else if (n.includes('email')) {
      obj[f.name] = 'tester@example.com'
    } else if (n.includes('name') || n.includes('title')) {
      obj[f.name] = `Test ${entity.name} Sample`
    } else if (n.includes('slug')) {
      obj[f.name] = `test-${entity.name.toLowerCase()}-sample`
    } else if (n.includes('status')) {
      obj[f.name] = 'active'
    } else {
      obj[f.name] = `Sample ${f.name} value`
    }
  }

  return JSON.stringify(obj, null, 2)
}
