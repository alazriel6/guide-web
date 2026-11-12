import { describe, it, expect } from 'vitest'
import { generateHttpFile, generateQaTestPlan } from '../qaGenerator'
import { createBlankModel, type PrdModel } from '../sections'

const mockModel: PrdModel = {
  ...createBlankModel(),
  title: 'CloudFlow Micro-SaaS',
  category: 'Developer Tools',
  overview: 'Automated CI/CD orchestration engine.',
  problem: 'Developers spend too much time deploying.',
  personas: 'Full-stack developers, DevOps engineers.',
  features: [
    {
      name: 'GitHub Webhook Sync',
      priority: 'mvp',
      description: 'Listens to push events and triggers build pipeline.',
    },
    {
      name: 'Deployment Logs Viewer',
      priority: 'later',
      description: 'Streams terminal output via WebSocket.',
    },
  ],
  flows: 'Developer pushes code -> System receives webhook -> Pipeline triggers.',
  stack: 'Go backend, Vue 3 frontend, PostgreSQL.',
  data_models: `- **organizations**: id (PK), name, slug, created_at
- **deployments**: id (PK), org_id (FK), commit_hash, status, created_at`,
  api_contract: `POST /api/webhooks/github -> Trigger pipeline
GET /api/deployments -> List recent deployments
GET /api/deployments/:id -> Get deployment status
DELETE /api/deployments/:id -> Cancel deployment`,
  metrics: 'P95 latency < 200ms',
}

describe('qaGenerator', () => {
  describe('generateHttpFile', () => {
    it('generates an executable .http file with assertions and auth suite', () => {
      const http = generateHttpFile(mockModel)

      // Header variables
      expect(http).toContain('@baseUrl = http://localhost:8000')
      expect(http).toContain('@contentType = application/json')

      // Smoke test
      expect(http).toContain('### [SMOKE-01] Healthcheck & System Ping')
      expect(http).toContain('client.test("SMOKE-01: Service is online and healthy (200 OK)"')

      // Security suite
      expect(http).toContain('### [SEC-01] NEGATIVE: Register with Weak Password')
      expect(http).toContain('client.assert(response.status === 400 || response.status === 422')
      expect(http).toContain('### [SEC-03] POSITIVE: Login & Extract Bearer JWT Token')
      expect(http).toContain('client.global.set("authToken", token);')
      expect(http).toContain('### [SEC-04] NEGATIVE: Access Protected Endpoint Without Token')
      expect(http).toContain('client.assert(response.status === 401')

      // Functional endpoints
      expect(http).toContain('GET {{baseUrl}}/api/deployments')
      expect(http).toContain('DELETE {{baseUrl}}/api/deployments/{{createdId}}')
      expect(http).toContain('### [TC-03-NEG] NEGATIVE: Non-Existent ID must return 404 Not Found')
    })

    it('synthesizes endpoints from data models if api_contract is empty', () => {
      const modelWithoutEndpoints: PrdModel = {
        ...mockModel,
        api_contract: '',
      }

      const http = generateHttpFile(modelWithoutEndpoints)
      expect(http).toContain('GET {{baseUrl}}/api/organizations')
      expect(http).toContain('POST {{baseUrl}}/api/organizations')
      expect(http).toContain('client.global.set("createdId", id);')
    })
  })

  describe('generateQaTestPlan', () => {
    it('generates a complete ISTQB/IEEE-compliant QA test plan in markdown', () => {
      const plan = generateQaTestPlan(mockModel)

      expect(plan).toContain('# QA MASTER TEST PLAN & VERIFICATION SPECIFICATION')
      expect(plan).toContain('CloudFlow Micro-SaaS')
      expect(plan).toContain('## 1. Executive Summary & Quality Objectives')
      expect(plan).toContain('## 2. Test Strategy & Levels')
      expect(plan).toContain('## 3. Master Test Cases Matrix')

      // Pre-baked and derived test cases
      expect(plan).toContain('TC-SEC-01')
      expect(plan).toContain('TC-FEAT-01')
      expect(plan).toContain('GitHub Webhook Sync')

      // Database validation ledger
      expect(plan).toContain('## 4. Database Validation Ledger (SQL Verification Queries)')
      expect(plan).toContain('SELECT COUNT(*) AS total_records FROM organizations;')
      expect(plan).toContain('WHERE parent.id IS NULL;')

      // Defect template & UAT matrix
      expect(plan).toContain('## 5. Defect / Bug Reporting Protocol')
      expect(plan).toContain('## 6. User Acceptance Testing (UAT) Sign-off Matrix')
    })
  })
})
