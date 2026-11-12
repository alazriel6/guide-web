export interface LexiconChip {
  tag: string
  category: string
  constraintLine: string
}

export const LEXICON_MATRIX: LexiconChip[] = [
  {
    tag: 'Vue 3 <script setup>',
    category: 'Frontend',
    constraintLine:
      '- Enforce Vue 3 Composition API (<script setup lang="ts">) with strict reactive typing.',
  },
  {
    tag: 'strict TypeScript interfaces',
    category: 'Frontend',
    constraintLine:
      '- Disallow implicit "any"; declare explicit TypeScript interfaces for all DTO payloads and props.',
  },
  {
    tag: 'DOM reflow optimization',
    category: 'Frontend',
    constraintLine:
      '- Minimize layout thrashing and DOM reflows; isolate high-frequency updates and use computed memoization.',
  },
  {
    tag: '60fps micro-interactions',
    category: 'Frontend',
    constraintLine:
      '- Restrict CSS transitions to GPU-composited properties (transform, opacity) within a <16.6ms frame budget.',
  },
  {
    tag: 'Gin HTTP Router',
    category: 'Backend',
    constraintLine:
      '- Structure RESTful Gin route groups (/api/v1) with explicit JSON binding validation and status codes.',
  },
  {
    tag: 'context cancellation',
    category: 'Backend',
    constraintLine:
      '- Propagate context.Context across all outbound HTTP and DB calls with explicit timeouts.',
  },
  {
    tag: 'Layered Clean Architecture',
    category: 'Backend',
    constraintLine:
      '- Strictly decouple cmd/, internal/handlers, internal/services, internal/models, and internal/config.',
  },
  {
    tag: 'CORS preflight handling',
    category: 'Backend',
    constraintLine:
      '- Handle OPTIONS preflight requests and allow Authorization, Content-Type, and X-API-Key headers.',
  },
  {
    tag: 'GORM preloading & indexing',
    category: 'Database',
    constraintLine:
      '- Add B-Tree indexes on high-cardinality filter columns and prevent N+1 queries via explicit GORM scopes.',
  },
  {
    tag: 'ACID Transactions',
    category: 'Database',
    constraintLine:
      '- Wrap multi-step state mutations inside db.Transaction(func(tx *gorm.DB) error) blocks.',
  },
  {
    tag: 'JSONB / StringSlice Scanner',
    category: 'Database',
    constraintLine:
      '- Implement sql.Scanner and driver.Valuer for slice/JSONB columns to ensure safe PostgreSQL serialization.',
  },
  {
    tag: 'Zero-Allocation Render Loop',
    category: 'Desktop',
    constraintLine:
      '- Reuse pre-allocated typed buffers inside hot render/DSP loops to prevent garbage collection frame stalls.',
  },
  {
    tag: 'OffscreenCanvas / WebGL',
    category: 'Desktop',
    constraintLine:
      '- Decouple heavy waveform or viewport rendering using devicePixelRatio-aware canvas buffers.',
  },
  {
    tag: 'End-to-End Type Safety',
    category: 'Fullstack',
    constraintLine:
      '- Guarantee 1:1 snake_case field parity between Go struct json tags and TypeScript interfaces.',
  },
  {
    tag: 'Idempotent Startup Seeder',
    category: 'Fullstack',
    constraintLine:
      '- Check table row counts on startup and seed deterministic preset records when tables are empty.',
  },
]
