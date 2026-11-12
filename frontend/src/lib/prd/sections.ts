export type SectionGroup = 'product' | 'technical' | 'boundaries'
export type SectionKind = 'text' | 'list'
export type PrdStudioMode = 'simple' | 'advanced'

export interface SectionDef {
  id: string
  order: number
  group: SectionGroup
  title: string // sentence case, used in editor AND preview
  hint: string // 1 line under the title
  placeholder: string // concrete example, not lorem
  kind: SectionKind
  required: boolean // required in mode
  minChars: number
  dependsOn: string[] // section ids sent as context to AI draft
}

export interface FeatureItem {
  name: string
  description: string
  priority: 'mvp' | 'later'
}

export interface PrdModel {
  id?: number
  title: string
  category: string
  is_preset: boolean
  overview: string
  problem: string
  personas: string
  features: FeatureItem[]
  flows: string
  metrics: string
  stack: string
  data_models: string
  api_contract: string
  nfr: string
  non_goals: string
  constraints: string
  open_questions: string
  created_at?: string
  updated_at?: string
}

export const PRD_SECTIONS: readonly SectionDef[] = [
  // Product Group
  {
    id: 'overview',
    order: 1,
    group: 'product',
    title: 'Project overview',
    hint: 'High-level synthesis of what this system does, target impact, and core domain.',
    placeholder:
      'Build an ultra low-latency telemetry and feature flag engine delivering sub-50ms rule evaluation for distributed microservices.',
    kind: 'text',
    required: true,
    minChars: 50,
    dependsOn: [],
  },
  {
    id: 'problem',
    order: 2,
    group: 'product',
    title: 'Problem statement',
    hint: 'The specific pain points, latency bottlenecks, or operational costs solved.',
    placeholder:
      'Engineers currently deploy code directly to toggle features, leading to drift, lack of audit trails, and 45-minute rollback cycles during incidents.',
    kind: 'text',
    required: true,
    minChars: 40,
    dependsOn: ['overview'],
  },
  {
    id: 'personas',
    order: 3,
    group: 'product',
    title: 'Target users & personas',
    hint: 'Specific roles, workflow responsibilities, and user expectations.',
    placeholder:
      '- Release Engineers: Need instant kill-switches and canary rollout rules.\n- Product Managers: Need percentage rollouts without dev assistance.',
    kind: 'text',
    required: true,
    minChars: 40,
    dependsOn: ['overview', 'problem'],
  },
  {
    id: 'features',
    order: 4,
    group: 'product',
    title: 'Core features',
    hint: 'Numbered functional capabilities tagged with MVP or Later priority.',
    placeholder: 'Deterministic SHA-256 user bucketing',
    kind: 'list',
    required: true,
    minChars: 0,
    dependsOn: ['overview', 'problem', 'personas'],
  },
  {
    id: 'flows',
    order: 5,
    group: 'product',
    title: 'Key user flows',
    hint: 'End-to-end user navigation, trigger points, and transactional state changes.',
    placeholder:
      '1. User selects target environment -> 2. Adjusts percentage slider to 25% -> 3. Confirms mutation -> 4. Edge nodes stream SSE config delta.',
    kind: 'text',
    required: false,
    minChars: 30,
    dependsOn: ['personas', 'features'],
  },
  {
    id: 'metrics',
    order: 6,
    group: 'product',
    title: 'Success metrics',
    hint: 'Quantifiable operational goals (latencies, adoption rates, SLO targets).',
    placeholder:
      '- P99 evaluation latency under 5ms.\n- Zero configuration drift across 100% of connected client SDKs.\n- 50% reduction in production incident rollback duration.',
    kind: 'text',
    required: false,
    minChars: 20,
    dependsOn: ['overview', 'features'],
  },

  // Technical Group
  {
    id: 'stack',
    order: 7,
    group: 'technical',
    title: 'Tech stack & architecture',
    hint: 'Languages, frameworks, databases, and deployment primitives.',
    placeholder:
      '- Frontend: Vue 3 (Composition API), TypeScript 5, Pinia\n- Backend: Go 1.22+, Gin HTTP router, GORM\n- Persistence: PostgreSQL 16 with JSONB targeting rules',
    kind: 'text',
    required: true,
    minChars: 30,
    dependsOn: ['features'],
  },
  {
    id: 'data_models',
    order: 8,
    group: 'technical',
    title: 'Data models & schemas',
    hint: 'Entity definitions, primary/foreign keys, indices, and data topologies.',
    placeholder:
      '### organizations\n- id (PK): uuid\n- name: varchar(255)\n\n### feature_flags\n- id (PK): int\n- org_id (FK): uuid\n- key: varchar(100)\n- rollout_pct: int',
    kind: 'text',
    required: true,
    minChars: 30,
    dependsOn: ['features', 'stack'],
  },
  {
    id: 'api_contract',
    order: 9,
    group: 'technical',
    title: 'API contract & endpoints',
    hint: 'HTTP method, route, request parameters, and response status codes.',
    placeholder:
      'POST /api/v1/flags - Create new feature flag\nGET /api/v1/flags/:key - Evaluate flag for current context\nDELETE /api/v1/flags/:key - Delete flag',
    kind: 'text',
    required: true,
    minChars: 30,
    dependsOn: ['data_models', 'stack'],
  },
  {
    id: 'nfr',
    order: 10,
    group: 'technical',
    title: 'Non-functional requirements',
    hint: 'Scalability, security, concurrency, reliability, and latency bounds.',
    placeholder:
      '- 99.99% service availability.\n- Read throughput of 10,000 requests/sec with in-memory caching.\n- Encrypted at rest (AES-256) and TLS 1.3 in transit.',
    kind: 'text',
    required: false,
    minChars: 30,
    dependsOn: ['stack', 'api_contract'],
  },

  // Boundaries Group
  {
    id: 'non_goals',
    order: 11,
    group: 'boundaries',
    title: 'Explicit non-goals',
    hint: 'Features, architectures, and platforms explicitly out of scope for this version.',
    placeholder:
      '- No multi-region active-active database replication in v1.\n- No native mobile SDKs (iOS/Android) in initial release.\n- No self-service billing or credit card checkout.',
    kind: 'text',
    required: true,
    minChars: 30,
    dependsOn: ['overview', 'features'],
  },
  {
    id: 'constraints',
    order: 12,
    group: 'boundaries',
    title: 'Technical constraints',
    hint: 'Hard compliance boundaries, legacy dependencies, and environmental limits.',
    placeholder:
      '- Must run within existing Docker and Kubernetes cluster.\n- Must strictly avoid external npm UI component libraries.\n- Memory footprint capped at 512MB per container instance.',
    kind: 'text',
    required: false,
    minChars: 20,
    dependsOn: ['stack', 'non_goals'],
  },
  {
    id: 'open_questions',
    order: 13,
    group: 'boundaries',
    title: 'Open questions & risks',
    hint: 'Unresolved architectural decisions, third-party dependencies, or risks.',
    placeholder:
      '- Should flag evaluations fall back to cached state or fail closed when disconnected?\n- What is the expected retention window for immutable audit logs?',
    kind: 'text',
    required: false,
    minChars: 20,
    dependsOn: ['overview', 'constraints'],
  },
]

export const SECTION_MAP: Record<string, SectionDef> = Object.fromEntries(
  PRD_SECTIONS.map((s) => [s.id, s]),
)

export function getSectionsForMode(mode: PrdStudioMode): SectionDef[] {
  if (mode === 'simple') {
    return PRD_SECTIONS.filter((s) => s.group === 'product' || s.group === 'boundaries')
  }
  return [...PRD_SECTIONS]
}

export function isSectionRequired(section: SectionDef, mode: PrdStudioMode): boolean {
  if (!section.required) return false
  if (mode === 'simple' && section.group === 'technical') return false
  return true
}

export function createBlankModel(title = '', category = 'SaaS Web App'): PrdModel {
  return {
    title,
    category,
    is_preset: false,
    overview: '',
    problem: '',
    personas: '',
    features: [],
    flows: '',
    metrics: '',
    stack: '',
    data_models: '',
    api_contract: '',
    nfr: '',
    non_goals: '',
    constraints: '',
    open_questions: '',
  }
}
