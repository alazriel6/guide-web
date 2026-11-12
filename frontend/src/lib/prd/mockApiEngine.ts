/**
 * Contract-First Mock API Engine & MSW Exporter
 * Industry standard for zero-dependency parallel frontend/backend development.
 * Parses API contract and data models into realistic in-browser mock responses,
 * standalone Node.js Express mock server, and MSW (Mock Service Worker) handlers.
 */

import type { PrdModel } from './sections'

export interface ParsedEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
  resource: string
  isCollection: boolean
}

/**
 * Extracts structured endpoints from the Section 09 API Contract text
 */
export function parseEndpoints(apiContractText: string): ParsedEndpoint[] {
  if (!apiContractText || !apiContractText.trim()) {
    return [
      {
        id: 'ep-health',
        method: 'GET',
        path: '/api/v1/health',
        description: 'Healthcheck probe',
        resource: 'health',
        isCollection: false,
      },
      {
        id: 'ep-users',
        method: 'GET',
        path: '/api/v1/users',
        description: 'Daftar data pengguna',
        resource: 'users',
        isCollection: true,
      },
    ]
  }

  const lines = apiContractText.split('\n')
  const results: ParsedEndpoint[] = []
  let idx = 0

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-*•]\s+/, '')
    if (!line) continue

    const match = /^(GET|POST|PUT|PATCH|DELETE)\s+([^\s->]+)(?:\s*(?:->|:|-)\s*(.*))?$/i.exec(line)
    if (match && match[1] && match[2]) {
      const method = match[1].toUpperCase() as ParsedEndpoint['method']
      const path = match[2].trim()
      const description = (match[3] || 'RESTful API Endpoint').trim()

      const pathSegments = path.split('/').filter(Boolean)
      const lastSegment = pathSegments[pathSegments.length - 1] || 'resource'
      const isParam = lastSegment.startsWith(':') || lastSegment.startsWith('{')
      const resource = isParam && pathSegments.length > 1
        ? (pathSegments[pathSegments.length - 2] || 'item')
        : lastSegment

      const isCollection = method === 'GET' && !isParam

      results.push({
        id: `ep-${idx++}-${method.toLowerCase()}-${resource}`,
        method,
        path,
        description,
        resource,
        isCollection,
      })
    }
  }

  return results.length > 0
    ? results
    : [
        {
          id: 'ep-fallback-1',
          method: 'GET',
          path: '/api/v1/items',
          description: 'Daftar koleksi item',
          resource: 'items',
          isCollection: true,
        },
      ]
}

/**
 * Generates realistic mock JSON payloads based on resource name and endpoint pattern
 */
export function generateMockPayload(endpoint: ParsedEndpoint): Record<string, unknown> | Array<Record<string, unknown>> {
  const res = endpoint.resource.toLowerCase().replace(/[^a-z]/g, '')

  const makeSingleEntity = (idVal: number | string) => {
    if (res.includes('user') || res.includes('member') || res.includes('account')) {
      return {
        id: idVal,
        name: idVal === 1 ? 'John Doe' : idVal === 2 ? 'Jane Smith' : 'Alex Rivera',
        email: `user${idVal}@example.com`,
        role: idVal === 1 ? 'admin' : 'member',
        status: 'active',
        created_at: new Date(Date.now() - 86400000 * Number(idVal)).toISOString(),
      }
    }

    if (res.includes('product') || res.includes('item') || res.includes('catalog')) {
      return {
        id: idVal,
        title: `Enterprise Cloud Product ${idVal}`,
        sku: `SKU-${1000 + Number(idVal)}`,
        price: 49.99 * Number(idVal),
        stock: 120 - Number(idVal) * 15,
        is_published: true,
        created_at: new Date().toISOString(),
      }
    }

    if (res.includes('order') || res.includes('payment') || res.includes('invoice')) {
      return {
        id: `ord-uuid-00${idVal}`,
        user_id: `usr-00${idVal}`,
        total_amount: 150.0 * Number(idVal),
        currency: 'USD',
        status: idVal === 1 ? 'completed' : 'pending',
        items_count: Number(idVal) + 1,
        created_at: new Date().toISOString(),
      }
    }

    // Generic fallback entity
    return {
      id: idVal,
      title: `Sample ${endpoint.resource} #${idVal}`,
      status: 'active',
      description: `Mock data record for ${endpoint.path} generated via BlueprintDev.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  if (endpoint.method === 'GET') {
    if (endpoint.isCollection) {
      return [makeSingleEntity(1), makeSingleEntity(2), makeSingleEntity(3)]
    }
    return makeSingleEntity(1)
  }

  if (endpoint.method === 'POST') {
    return {
      success: true,
      message: `Berhasil membuat data ${endpoint.resource} baru.`,
      id: `gen-${Math.floor(Math.random() * 9000 + 1000)}`,
      data: makeSingleEntity(1),
      created_at: new Date().toISOString(),
    }
  }

  if (endpoint.method === 'PUT' || endpoint.method === 'PATCH') {
    return {
      success: true,
      message: `Perubahan data ${endpoint.resource} berhasil disimpan.`,
      data: makeSingleEntity(1),
      updated_at: new Date().toISOString(),
    }
  }

  if (endpoint.method === 'DELETE') {
    return {
      success: true,
      message: `Data ${endpoint.resource} berhasil dihapus permanen.`,
      deleted_at: new Date().toISOString(),
    }
  }

  return { success: true }
}

/**
 * Generates a standalone Node.js Express mock server (mock-server.js)
 */
export function generateMockServerJs(model: PrdModel): string {
  const endpoints = parseEndpoints(model.api_contract)
  const title = model.title || 'BlueprintDev Mock API'

  const routesCode = endpoints
    .map((ep) => {
      const mock = JSON.stringify(generateMockPayload(ep), null, 2)
      const expressPath = ep.path.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1')
      return `// ${ep.method} ${ep.path} - ${ep.description}
app.${ep.method.toLowerCase()}('${expressPath}', (req, res) => {
  console.log('[MockAPI] ${ep.method} ${ep.path} received');
  res.status(${ep.method === 'POST' ? 201 : 200}).json(${mock});
});`
    })
    .join('\n\n')

  return `/**
 * BlueprintDev Contract-First Mock API Server
 * Project: ${title}
 * Run with Node.js:
 *   npm install express cors
 *   node mock-server.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  next();
});

// Root Healthcheck & Welcome
app.get('/', (req, res) => {
  res.json({
    project: '${title}',
    mock_server: 'BlueprintDev In-Memory Mock Server',
    status: 'online',
    endpoints_count: ${endpoints.length},
  });
});

${routesCode}

app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(\`🚀 Mock Server ready at http://localhost:\${PORT}\`);
  console.log(\`📦 Serving ${endpoints.length} contract endpoints\`);
  console.log('----------------------------------------------------');
});
`
}

/**
 * Generates TypeScript Mock Service Worker (MSW) handlers (handlers.ts)
 */
export function generateMswHandlersTs(model: PrdModel): string {
  const endpoints = parseEndpoints(model.api_contract)
  const title = model.title || 'BlueprintDev'

  const handlersCode = endpoints
    .map((ep) => {
      const mock = JSON.stringify(generateMockPayload(ep), null, 4)
      const mswPath = ep.path.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1')
      return `  // ${ep.method} ${ep.path} (${ep.description})
  http.${ep.method.toLowerCase()}('${mswPath}', () => {
    return HttpResponse.json(${mock}, { status: ${ep.method === 'POST' ? 201 : 200} });
  }),`
    })
    .join('\n\n')

  return `/**
 * Mock Service Worker (MSW) Handlers
 * Project: ${title}
 * Standard Contract-First Mocking for Vitest, Playwright, React, and Vue
 * Install MSW: npm install -D msw
 */

import { http, HttpResponse } from 'msw';

export const handlers = [
${handlersCode}
];
`
}

/**
 * Triggers browser download for mock files
 */
export function downloadMockFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
