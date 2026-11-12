import { describe, it, expect } from 'vitest'
import {
  parseEndpoints,
  generateMockPayload,
  generateMockServerJs,
  generateMswHandlersTs,
} from '../mockApiEngine'
import { createBlankModel } from '../sections'

describe('mockApiEngine', () => {
  it('parses structured API contract lines into endpoints', () => {
    const contract = `
      GET /api/v1/users -> List all registered users
      GET /api/v1/users/:id -> User profile detail
      POST /api/v1/users -> Register new user
      DELETE /api/v1/users/:id -> Terminate account
    `
    const endpoints = parseEndpoints(contract)
    expect(endpoints).toHaveLength(4)
    expect(endpoints[0]?.method).toBe('GET')
    expect(endpoints[0]?.path).toBe('/api/v1/users')
    expect(endpoints[0]?.isCollection).toBe(true)
    expect(endpoints[1]?.isCollection).toBe(false)
    expect(endpoints[2]?.method).toBe('POST')
    expect(endpoints[3]?.method).toBe('DELETE')
  })

  it('generates realistic mock data payloads for collections and detail', () => {
    const listEp = {
      id: 'ep-1',
      method: 'GET' as const,
      path: '/api/v1/users',
      description: 'Users list',
      resource: 'users',
      isCollection: true,
    }
    const listPayload = generateMockPayload(listEp)
    expect(Array.isArray(listPayload)).toBe(true)
    const listArr = listPayload as Record<string, unknown>[]
    expect(listArr.length).toBe(3)
    expect(String(listArr[0]?.email)).toContain('@example.com')

    const postEp = {
      id: 'ep-2',
      method: 'POST' as const,
      path: '/api/v1/users',
      description: 'Create user',
      resource: 'users',
      isCollection: false,
    }
    const postPayload = generateMockPayload(postEp) as Record<string, unknown>
    expect(postPayload.success).toBe(true)
    expect(postPayload.id).toBeDefined()
  })

  it('generates runnable Express mock server code', () => {
    const model = createBlankModel('SaaS Billing', 'SaaS Web App')
    model.api_contract = 'GET /api/v1/invoices -> List invoices\nPOST /api/v1/invoices -> Create invoice'

    const serverCode = generateMockServerJs(model)
    expect(serverCode).toContain("require('express')")
    expect(serverCode).toContain("app.get('/api/v1/invoices'")
    expect(serverCode).toContain("app.post('/api/v1/invoices'")
    expect(serverCode).toContain('app.listen(PORT')
  })

  it('generates MSW (Mock Service Worker) TypeScript handlers', () => {
    const model = createBlankModel('E-Commerce Core', 'SaaS Web App')
    model.api_contract = 'GET /api/v1/products -> Products catalog'

    const mswCode = generateMswHandlersTs(model)
    expect(mswCode).toContain("import { http, HttpResponse } from 'msw'")
    expect(mswCode).toContain("http.get('/api/v1/products'")
    expect(mswCode).toContain('export const handlers = [')
  })
})
