<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Plus,
  Copy,
  Download,
  Trash2,
  Check,
  Wand2,
  Search,
  Save,
  Settings,
  Layers,
  Sparkles,
  FileCode2,
} from 'lucide-vue-next'
import {
  promptApi,
  prdApi,
  compileTechnicalPromptClient,
  type PromptTemplate,
  type PrdDocument,
} from '@/services/api'
import {
  getAgentTarget,
  generateAgentInstructions,
  downloadAgentFile,
  getSpecialistRole,
  generateRoleSkillMd,
  downloadRoleSkillMd,
  type AgentTargetId,
  type AgentTargetDef,
  type SpecialistRole,
} from '@/lib/prd/agentGenerators'
import type { PrdModel } from '@/lib/prd/sections'
import { FALLBACK_PROMPT_PRESETS, FALLBACK_PRD_PRESETS } from '@/services/defaultPresets'
import { generateWithAI } from '@/services/aiService'
import { useAiConfigStore } from '@/stores/aiConfig'
import StatusDot from '@/components/primitives/StatusDot.vue'
import LexiconMatrix from '@/components/prompt/LexiconMatrix.vue'
import { type LexiconChip } from '@/components/prompt/lexiconData'
import AgentTargetSelector from '@/components/prompt/AgentTargetSelector.vue'

const route = useRoute()
const aiStore = useAiConfigStore()

const ROLE_CATEGORIES = ['All', 'Frontend', 'Backend', 'Fullstack', 'Database', 'Desktop', 'DevOps']
const FORM_ROLES = ['Frontend', 'Backend', 'Fullstack', 'Database', 'Desktop', 'DevOps']

const prompts = ref<PromptTemplate[]>([])
const availablePrds = ref<PrdDocument[]>([])
const selectedBridgePrdId = ref<string>('')

const loading = ref(false)
const saving = ref(false)
const backendConnected = ref(true)
const statusToast = ref<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null)

// Filters
const selectedRole = ref('All')
const stackSearch = ref('')
const presetFilter = ref<'all' | 'preset' | 'custom'>('all')

// Safe Delete Confirmation
const confirmDeleteId = ref<number | null>(null)

// Right Pane Mode ('compiled' | 'json' | 'ai-output')
const outputTab = ref<'compiled' | 'json' | 'ai-output'>('compiled')
const copiedNotice = ref(false)

// AI Refinement & Execution State with Elapsed Timer & Cancellation
const aiBusy = ref<'refine' | 'execute' | null>(null)
const aiExecutionOutput = ref('')
const aiElapsedTime = ref(0)
let aiTimerInterval: number | null = null

const startAiTimer = () => {
  aiElapsedTime.value = 0
  if (aiTimerInterval) clearInterval(aiTimerInterval)
  aiTimerInterval = window.setInterval(() => {
    aiElapsedTime.value += 1
  }, 1000)
}

const stopAiTimer = () => {
  if (aiTimerInterval) {
    clearInterval(aiTimerInterval)
    aiTimerInterval = null
  }
}

const cancelAiGeneration = () => {
  stopAiTimer()
  aiBusy.value = null
  showToast('AI operation cancelled.', 'info')
}

const createBlankPrompt = (): PromptTemplate => ({
  id: undefined,
  title: 'New stack-specific engineering prompt',
  role_category: 'Fullstack',
  tech_stack_tags: [
    'Vue 3 <script setup>',
    'strict TypeScript interfaces',
    'Gin HTTP Router',
    'GORM preloading & indexing',
  ],
  is_preset: false,
  system_role:
    'Act as a Principal Full-Stack Software Engineer and UI/UX Architect. Build a production-grade, deterministic implementation following the exact specifications below.',
  technical_constraints: `- Frontend: Vue 3 (<script setup lang="ts">), Strict TypeScript, Vite, Pinia, Axios.
- Backend: Go, Gin HTTP Framework, GORM ORM, PostgreSQL driver.
- UI Aesthetic: High-contrast utilitarian developer workspace (--surface surface, 1px --rule borders, crisp typography).`,
  architecture_rules: `- Maintain strict separation between frontend/ and backend/ directories.
- Ensure 1:1 field parity between Go JSON struct tags and TypeScript interfaces.
- Route external AI calls through a unified backend proxy to prevent browser CORS blocks.`,
  point_by_point_instructions: `1. Inspect existing package.json, go.mod, and .env files before generating code.
2. Build and verify GORM models, database connection, AutoMigrate, and startup seeder.
3. Implement RESTful CRUD handlers and unified AI proxy service.
4. Build Vue 3 TypeScript services, Pinia stores, and interactive split-pane views.
5. Verify zero compilation errors across both 'go build ./...' and 'vue-tsc --build'.`,
  edge_cases_to_handle: `- Handle empty database query results with clear empty-state rows and filter reset triggers.
- Enforce HTTP request timeouts on outbound AI provider calls.
- Prevent accidental deletion via two-step confirmation states.`,
  output_format:
    'Provide complete, production-ready source files with exact module paths, strict typing, and zero placeholders.',
  compiled_prompt: '',
  source_prd_id: null,
})

interface StackTargetPreset {
  id: string
  name: string
  badge: string
  role_category: string
  tech_stack_tags: string[]
  technical_constraints: string
  architecture_rules: string
  execution_steps: string
  output_format: string
}

const STACK_TARGET_PRESETS: StackTargetPreset[] = [
  {
    id: 'go-vue',
    name: 'Go 1.22+ & Vue 3',
    badge: 'Go + Vue 3',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'Go 1.22+',
      'Gin HTTP Router',
      'GORM ORM',
      'PostgreSQL 16',
      'Vue 3 <script setup>',
      'TypeScript 5',
      'Pinia',
      'Tailwind CSS',
    ],
    technical_constraints: `- Backend: Go 1.22+ using Gin HTTP framework with clean package separation (cmd, internal/handler, internal/service, internal/repository).
- Persistence: PostgreSQL 16 with GORM ORM, AutoMigrate, parameterized queries, and connection pool configuration.
- Frontend: Vue 3 Composition API (<script setup lang="ts">) with Pinia state management and Axios HTTP client.
- Strict Type Parity: Disallow implicit "any"; maintain 1:1 typing between Go struct JSON tags and TypeScript DTOs.
- Concurrency: Protect shared in-memory state with sync.RWMutex and respect context.Context cancellation.`,
    architecture_rules: `- Handlers parse and validate HTTP requests; business logic is isolated in Services.
- Repositories encapsulate database transactions and GORM queries.
- Frontend API calls route through centralized Axios client with standard error interceptors.
- Utilitarian developer UI with clean typography, 1px rules, and responsive design.`,
    execution_steps: `1. Verify dependencies in frontend/package.json and backend/go.mod.
2. Implement PostgreSQL database connection and GORM entity models.
3. Implement service layer with transactional business logic.
4. Implement Gin REST endpoints with structured JSON responses.
5. Implement Vue 3 Pinia stores, reactive views, and form validations.
6. Verify zero build, lint, or type-check errors.`,
    output_format:
      'Deliver complete, production-grade Go packages and Vue 3 TypeScript Single File Components with zero placeholders.',
  },
  {
    id: 'nextjs-prisma',
    name: 'Next.js 14 & Prisma',
    badge: 'Next.js 14',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'Next.js 14 (App Router)',
      'TypeScript 5',
      'Prisma ORM',
      'PostgreSQL',
      'Server Actions',
      'Tailwind CSS',
      'Zod Validation',
    ],
    technical_constraints: `- Architecture: Next.js 14 App Router with Server Components for data fetching and Client Components ('use client') for interactivity.
- Mutations: Implement type-safe Server Actions with Zod payload validation.
- Persistence: PostgreSQL with Prisma ORM client singleton; enforce relational indexes and foreign key constraints.
- Typing: Strict TypeScript with no implicit "any"; share Zod schemas between client forms and server actions.
- Caching: Leverage unstable_noStore() for dynamic queries and revalidatePath() upon mutation.`,
    architecture_rules: `- Keep server code strictly in app/actions and lib/services; isolate client state in components.
- Prisma queries must use select to fetch only required fields and prevent over-fetching.
- Error handling: Return discriminated unions { success: true, data } | { success: false, error } from server actions.`,
    execution_steps: `1. Define prisma/schema.prisma with models, relations, and indexes.
2. Create Zod validation schemas in lib/validations.
3. Implement Server Actions with user authorization and database mutation.
4. Build responsive React Server Component layouts and client forms.
5. Verify build with npm run build (next build).`,
    output_format:
      'Deliver complete Next.js 14 App Router files (page.tsx, layout.tsx, actions.ts, schema.prisma) with zero omissions.',
  },
  {
    id: 'fastapi-react',
    name: 'FastAPI & React 18',
    badge: 'FastAPI + React',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'Python 3.12',
      'FastAPI',
      'Pydantic v2',
      'SQLAlchemy 2.0 (Async)',
      'PostgreSQL',
      'React 18',
      'Vite',
      'TypeScript 5',
      'TanStack Query',
    ],
    technical_constraints: `- Backend: Python 3.12 with FastAPI and asynchronous endpoints (async def).
- Persistence: PostgreSQL with SQLAlchemy 2.0 async engine and Alembic migrations.
- Schemas: Pydantic v2 BaseModels with strict validation for request bodies and response models.
- Frontend: React 18 with TypeScript 5, Vite, and TanStack Query (React Query) for server state caching.
- Dependency Injection: Inject database sessions using FastAPI Depends(get_db_session).`,
    architecture_rules: `- Structure: routers/ -> services/ -> crud/ -> models/ -> schemas/.
- Every endpoint must declare response_model with status_code.
- React components must separate UI presentation from TanStack Query hooks.`,
    execution_steps: `1. Define SQLAlchemy 2.0 async declarative models.
2. Implement Pydantic v2 request/response schemas.
3. Implement FastAPI APIRouter endpoints with dependency injection.
4. Implement React TypeScript API client and TanStack Query custom hooks.
5. Build interactive React UI components.
6. Verify with pytest and npm run build.`,
    output_format:
      'Deliver complete Python FastAPI routers/models and React TypeScript components with zero missing logic.',
  },
  {
    id: 'rust-svelte',
    name: 'Rust Axum & SvelteKit',
    badge: 'Rust Axum + Svelte',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'Rust (Latest Stable)',
      'Axum Web Framework',
      'Tokio Async Runtime',
      'SQLx',
      'PostgreSQL / SQLite',
      'SvelteKit 2',
      'TypeScript',
      'Tailwind CSS',
    ],
    technical_constraints: `- Backend: Rust with Axum web framework on Tokio multi-threaded async runtime.
- Persistence: SQLx with compile-time query verification and async connection pool.
- Error Handling: Custom AppError enum implementing IntoResponse with structured JSON errors.
- Frontend: SvelteKit 2 with TypeScript and lightweight reactive rune state ($state, $derived).
- Zero unsafe code blocks; adhere strictly to idiomatic Rust ownership patterns.`,
    architecture_rules: `- Axum handlers extract state via State(AppState) and Path/Json extractors.
- Database access through domain repository traits.
- SvelteKit server routes (+page.server.ts) handle API communication and form actions.`,
    execution_steps: `1. Define SQLx database migrations and domain entity structs.
2. Implement Axum AppState, router, and REST handler functions.
3. Implement custom error handling and CORS middleware.
4. Build SvelteKit load functions and interactive Svelte components.
5. Verify with cargo check and svelte-check.`,
    output_format:
      'Deliver compilable Rust Cargo project source files and SvelteKit route components without placeholders.',
  },
  {
    id: 'spring-angular',
    name: 'Spring Boot 3 & Angular 17',
    badge: 'Spring Boot + Angular',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'Java 21 (LTS)',
      'Spring Boot 3.2',
      'Spring Data JPA',
      'PostgreSQL',
      'Angular 17',
      'TypeScript',
      'RxJS',
      'Jakarta Validation',
    ],
    technical_constraints: `- Backend: Java 21 with Spring Boot 3.2, Spring MVC REST controllers, and Spring Security.
- Persistence: Spring Data JPA with PostgreSQL, Hibernate, and Liquibase/Flyway migrations.
- Validation: Jakarta Bean Validation (@Valid, @NotNull, @Size) with @RestControllerAdvice exception handler.
- Frontend: Angular 17 with standalone components, Signals, and typed ReactiveFormsModule.
- HTTP: Angular HttpClient with interceptors for error handling and JWT authorization headers.`,
    architecture_rules: `- Layered architecture: Controller -> Service (interface + impl) -> Repository -> Entity.
- DTO pattern: Never expose JPA entities directly in HTTP responses; use record DTOs.
- Angular services encapsulate all HTTP operations and expose Signals to components.`,
    execution_steps: `1. Define JPA @Entity classes with table and column mappings.
2. Create Spring Data JpaRepository interfaces.
3. Implement @Service classes with @Transactional business logic.
4. Implement @RestController endpoints with OpenAPI 3 annotations.
5. Implement Angular 17 standalone components and reactive services.
6. Verify with ./mvnw test and ng build.`,
    output_format:
      'Deliver complete Spring Boot Java classes (Entity, Repository, Service, Controller) and Angular TypeScript components.',
  },
  {
    id: 'laravel-blade',
    name: 'Laravel 11 & Blade (PHP 8.3)',
    badge: 'Laravel + Blade',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'PHP 8.3',
      'Laravel 11',
      'Eloquent ORM',
      'Blade Templates',
      'Vite & Tailwind CSS',
      'MySQL / PostgreSQL',
    ],
    technical_constraints: `- Backend: PHP 8.3 with Laravel 11. Follow strict typing (declare(strict_types=1);).
- Database: MySQL / PostgreSQL using Eloquent ORM, database migrations, and seeders.
- Views: Blade templating engine with master layout (@extends('layouts.app'), @yield('content')).
- Assets: Asset bundling using Vite with Tailwind CSS (@vite(['resources/css/app.css', 'resources/js/app.js'])).
- Security: Enforce CSRF protection on all mutating forms with @csrf. Sanitize input with FormRequests.`,
    architecture_rules: `- HTTP routing defined in routes/web.php (views) and routes/api.php (JSON).
- Controllers handle validation and HTTP response; business logic delegated to domain services / actions.
- Eloquent models define $fillable attributes and model relations with eager loading (with()) to prevent N+1 queries.
- Blade views modularized into layouts/, components/, and partials/.`,
    execution_steps: `1. Setup Laravel 11 project via composer create-project.
2. Configure .env database credentials and execute php artisan key:generate.
3. Create Eloquent models and migrations via php artisan make:model -mcr.
4. Build master Blade layout and responsive Tailwind CSS templates.
5. Implement controller actions and route definitions in routes/web.php.
6. Verify locally by running php artisan serve and npm run dev.`,
    output_format:
      'Deliver complete Laravel 11 PHP classes (Models, Controllers, Requests) and Blade template files (*.blade.php) with zero missing logic.',
  },
]

const form = ref<PromptTemplate>(createBlankPrompt())

const isStackPresetActive = (preset: StackTargetPreset): boolean => {
  return preset.tech_stack_tags.slice(0, 2).every((tag) => form.value.tech_stack_tags.includes(tag))
}

const applyStackPreset = (preset: StackTargetPreset) => {
  form.value.role_category = preset.role_category
  form.value.tech_stack_tags = [...preset.tech_stack_tags]
  form.value.technical_constraints = preset.technical_constraints
  form.value.architecture_rules = preset.architecture_rules
  form.value.output_format = preset.output_format

  if (
    !form.value.point_by_point_instructions.trim() ||
    form.value.point_by_point_instructions.includes('Execution Sequence:')
  ) {
    form.value.point_by_point_instructions = preset.execution_steps
  }

  showToast(`Applied "${preset.name}" target architecture preset.`, 'ok')
}

const showToast = (text: string, type: 'ok' | 'err' | 'info' = 'ok') => {
  statusToast.value = { text, type }
  setTimeout(() => {
    if (statusToast.value?.text === text) {
      statusToast.value = null
    }
  }, 4000)
}

const activeAgentTarget = ref<AgentTargetId>('antigravity')
const currentAgentDef = computed<AgentTargetDef>(() => getAgentTarget(activeAgentTarget.value))

const agentCategoryMode = ref<'skills' | 'targets'>('skills')
const activeSpecialistRole = ref<SpecialistRole>('fullstack')
const currentRoleDef = computed(() => getSpecialistRole(activeSpecialistRole.value))

const formAsPrdModel = computed<PrdModel>(() => ({
  title: form.value.title || 'Technical Architecture & Code Generation Specification',
  category: form.value.role_category || 'Fullstack',
  is_preset: false,
  overview: form.value.system_role || '',
  problem: '',
  personas: '',
  features: [],
  flows: '',
  metrics: '',
  stack: (form.value.tech_stack_tags || []).map((t) => `- ${t}`).join('\n'),
  data_models: form.value.architecture_rules || '',
  api_contract: '',
  nfr: form.value.technical_constraints || '',
  non_goals: form.value.edge_cases_to_handle || '',
  constraints: form.value.technical_constraints || '',
  open_questions: '',
}))

const liveSkillCompiledOutput = computed(() => {
  return generateRoleSkillMd(activeSpecialistRole.value, formAsPrdModel.value)
})

const liveAgentCompiledOutput = computed(() =>
  generateAgentInstructions(activeAgentTarget.value, form.value),
)

const activeDisplayOutput = computed(() => {
  if (outputTab.value !== 'compiled') return ''
  return agentCategoryMode.value === 'skills'
    ? liveSkillCompiledOutput.value
    : liveAgentCompiledOutput.value
})

const liveCompiledPrompt = computed(() => compileTechnicalPromptClient(form.value))

const liveJsonPreview = computed(() =>
  JSON.stringify(
    {
      ...form.value,
      compiled_prompt: activeDisplayOutput.value,
    },
    null,
    2,
  ),
)

const promptMetrics = computed(() => {
  const text = outputTab.value === 'compiled' ? activeDisplayOutput.value : liveCompiledPrompt.value
  const lines = text.split('\n').length
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const estTokens = Math.round(text.length / 3.8)
  return { lines, words, estTokens }
})

const filteredPrompts = computed(() => {
  return prompts.value.filter((item) => {
    if (selectedRole.value !== 'All' && item.role_category !== selectedRole.value) {
      return false
    }
    if (presetFilter.value === 'preset' && !item.is_preset) {
      return false
    }
    if (presetFilter.value === 'custom' && item.is_preset) {
      return false
    }
    if (stackSearch.value.trim() !== '') {
      const q = stackSearch.value.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchRole = item.system_role.toLowerCase().includes(q)
      const matchTags = (item.tech_stack_tags || []).some((t) => t.toLowerCase().includes(q))
      return matchTitle || matchRole || matchTags
    }
    return true
  })
})

const toggleLexiconChip = (chip: LexiconChip) => {
  const tags = [...(form.value.tech_stack_tags || [])]
  const idx = tags.indexOf(chip.tag)
  if (idx !== -1) {
    tags.splice(idx, 1)
    form.value.tech_stack_tags = tags
    showToast(`Removed lexicon tag "${chip.tag}"`, 'info')
  } else {
    tags.push(chip.tag)
    form.value.tech_stack_tags = tags
    if (!form.value.technical_constraints.includes(chip.constraintLine)) {
      form.value.technical_constraints = form.value.technical_constraints.trim()
        ? `${form.value.technical_constraints.trim()}\n${chip.constraintLine}`
        : chip.constraintLine
    }
    showToast(`Injected "${chip.tag}" + constraint rule into prompt.`, 'ok')
  }
}

const addCustomTag = (tag: string) => {
  const clean = tag.trim()
  if (!clean) return
  if (!form.value.tech_stack_tags.includes(clean)) {
    form.value.tech_stack_tags = [...form.value.tech_stack_tags, clean]
  }
}

const removeTag = (tag: string) => {
  form.value.tech_stack_tags = form.value.tech_stack_tags.filter((t) => t !== tag)
}

const applyPrdBridge = (prd: PrdDocument) => {
  form.value = {
    id: undefined,
    title: `[PRD Execution Prompt] ${prd.title}`,
    role_category: 'Fullstack',
    tech_stack_tags: [
      'Vue 3 <script setup>',
      'strict TypeScript interfaces',
      'Gin HTTP Router',
      'GORM preloading & indexing',
      'context cancellation',
    ],
    is_preset: false,
    system_role: `Act as a Principal Full-Stack Software Engineer and UI/UX Architect. Implement the production application "${prd.title}" (${prd.category}) in strict accordance with the architectural PRD below.\n\nPROJECT OVERVIEW:\n${prd.overview}`,
    technical_constraints: `${prd.tech_stack}\n- Enforce strict TypeScript interfaces and 1:1 Go GORM JSON struct tag parity.\n- Utilitarian developer workspace UI (--surface surface, 1px --rule borders).`,
    architecture_rules: `### Target Personas\n${prd.target_users}\n\n### Database Schema & API Contract\n${prd.architecture_specs}`,
    point_by_point_instructions: `Implement the following core functional modules and features end-to-end:\n${prd.core_features}\n\nExecution Sequence:\n1. Verify existing dependencies in frontend/package.json and backend/go.mod.\n2. Implement PostgreSQL GORM models, AutoMigrate, and startup seeders.\n3. Implement Gin REST controllers and middleware.\n4. Implement Vue 3 TypeScript views, Axios API client, and interactive state.\n5. Verify zero build or type-check errors.`,
    edge_cases_to_handle: prd.edge_cases,
    output_format:
      'Deliver complete, compilable Go backend packages and Vue 3 TypeScript Single File Components with zero placeholders or omitted logic.',
    compiled_prompt: '',
    source_prd_id: prd.id || null,
  }
  outputTab.value = 'compiled'
  showToast(`Compiled PRD "${prd.title}" into a Stack-Specific Technical Prompt.`, 'ok')
}

const handleBridgeSelect = () => {
  if (!selectedBridgePrdId.value) return
  const idNum = Number(selectedBridgePrdId.value)
  const found = availablePrds.value.find((p) => p.id === idNum)
  if (found) {
    applyPrdBridge(found)
  }
}

const fetchWorkspaceData = async () => {
  loading.value = true
  try {
    const [promptList, prdList] = await Promise.all([promptApi.list(), prdApi.list()])
    prompts.value = promptList
    availablePrds.value = prdList
    backendConnected.value = true
  } catch {
    backendConnected.value = false
    prompts.value = [...FALLBACK_PROMPT_PRESETS]
    availablePrds.value = [...FALLBACK_PRD_PRESETS]
    showToast(
      'PostgreSQL backend unreachable - loaded built-in Stack Prompt Presets.',
      'info',
    )
  } finally {
    loading.value = false
  }

  const rawDraft = sessionStorage.getItem('bridge_prd_draft')
  if (rawDraft) {
    try {
      const parsed = JSON.parse(rawDraft) as PrdDocument
      sessionStorage.removeItem('bridge_prd_draft')
      if (parsed.id) selectedBridgePrdId.value = String(parsed.id)
      applyPrdBridge(parsed)
      return
    } catch {
      // ignore invalid session draft
    }
  } else if (route.query.prdId) {
    const qId = Number(route.query.prdId)
    const targetPrd = availablePrds.value.find((p) => p.id === qId)
    if (targetPrd) {
      selectedBridgePrdId.value = String(qId)
      applyPrdBridge(targetPrd)
      return
    }
  }

  if (prompts.value.length > 0 && !form.value.id) {
    selectPromptForEdit(prompts.value[0]!)
  }
}

const selectPromptForEdit = (pt: PromptTemplate) => {
  form.value = {
    ...pt,
    tech_stack_tags: [...(pt.tech_stack_tags || [])],
    architecture_rules:
      pt.architecture_rules ||
      '- Maintain strict separation of concerns across transport, service, and persistence layers.',
    edge_cases_to_handle:
      pt.edge_cases_to_handle ||
      '- Handle empty states, network timeouts, and malformed payload inputs gracefully.',
  }
  confirmDeleteId.value = null
}

const startNewPrompt = () => {
  form.value = createBlankPrompt()
  selectedBridgePrdId.value = ''
  confirmDeleteId.value = null
  showToast('Initialized blank Technical Prompt workspace.', 'info')
}

const clonePrompt = (pt: PromptTemplate) => {
  form.value = {
    ...pt,
    id: undefined,
    title: `${pt.title} (Copy)`,
    tech_stack_tags: [...(pt.tech_stack_tags || [])],
    is_preset: false,
  }
  showToast('Cloned prompt preset into custom editable draft.', 'info')
}

const savePrompt = async () => {
  if (!form.value.title.trim()) {
    showToast('Prompt title is required.', 'err')
    return
  }
  saving.value = true
  const payload: PromptTemplate = {
    ...form.value,
    compiled_prompt: liveCompiledPrompt.value,
  }

  try {
    if (form.value.id && backendConnected.value) {
      const updated = await promptApi.update(form.value.id, payload)
      const idx = prompts.value.findIndex((p) => p.id === updated.id)
      if (idx !== -1) prompts.value[idx] = updated
      form.value = { ...updated, tech_stack_tags: [...(updated.tech_stack_tags || [])] }
      showToast(`Updated Prompt #${updated.id} in PostgreSQL.`, 'ok')
    } else if (backendConnected.value) {
      const created = await promptApi.create(payload)
      prompts.value.unshift(created)
      form.value = { ...created, tech_stack_tags: [...(created.tech_stack_tags || [])] }
      showToast(`Saved new Prompt #${created.id} to PostgreSQL.`, 'ok')
    } else {
      if (form.value.id) {
        const idx = prompts.value.findIndex((p) => p.id === form.value.id)
        if (idx !== -1) prompts.value[idx] = { ...payload }
        showToast('Updated prompt in local session.', 'ok')
      } else {
        const created = { ...payload, id: Date.now() }
        prompts.value.unshift(created)
        form.value = { ...created }
        showToast('Saved prompt to local session.', 'ok')
      }
    }
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to save prompt template', 'err')
  } finally {
    saving.value = false
  }
}

const confirmDeletePrompt = async (id?: number) => {
  if (!id) return
  try {
    if (backendConnected.value) {
      await promptApi.remove(id)
    }
    prompts.value = prompts.value.filter((p) => p.id !== id)
    confirmDeleteId.value = null
    if (form.value.id === id) {
      form.value = prompts.value[0]
        ? { ...prompts.value[0], tech_stack_tags: [...(prompts.value[0].tech_stack_tags || [])] }
        : createBlankPrompt()
    }
    showToast(`Deleted Prompt #${id}.`, 'ok')
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to delete prompt', 'err')
  }
}

const refinePromptWithAI = async () => {
  aiBusy.value = 'refine'
  startAiTimer()
  try {
    const res = await generateWithAI({
      systemPrompt:
        'You are a Principal Prompt Engineer for Staff Software Architects. Refine and sharpen the user technical instructions into numbered, unambiguous, production-grade execution steps.',
      userPrompt: `Role Category: ${form.value.role_category}
Active Stack Tags: ${form.value.tech_stack_tags.join(', ')}
Current Instructions:
${form.value.point_by_point_instructions}

Rewrite and expand ONLY the numbered Point-by-Point Execution Instructions so they are deterministic, stack-specific, and verifiable. Keep output strictly to the numbered list without conversational filler.`,
      maxTokens: 1200,
    })
    if (res.content) {
      form.value.point_by_point_instructions = res.content
      showToast(`Refined instructions via ${res.provider.toUpperCase()} (${res.model}).`, 'ok')
    }
  } catch (err) {
    showToast(
      `AI Refine Error (${err instanceof Error ? err.message : 'check AI Settings'}).`,
      'err',
    )
  } finally {
    stopAiTimer()
    aiBusy.value = null
  }
}

type AiOutputMode = 'skill' | 'design' | 'audit'
const aiOutputMode = ref<AiOutputMode>('skill')

const synthesizeDocumentWithAI = async (mode: AiOutputMode = 'skill') => {
  aiOutputMode.value = mode
  aiBusy.value = 'execute'
  startAiTimer()
  outputTab.value = 'ai-output'
  const modeLabel =
    mode === 'skill'
      ? 'Dokumen SKILL.md Resmi'
      : mode === 'design'
        ? 'Dokumen Desain Arsitektur Sistem (.md)'
        : 'Audit & Review Kesiapan Prompt (.md)'

  aiExecutionOutput.value = `// Merapikan spesifikasi teknis menjadi ${modeLabel}...\n// Mesin AI: ${aiStore.activeProvider.toUpperCase()} (${aiStore.activeModel})\n// Estimasi proses: 15–30 detik (Format Markdown murni, tanpa kode aplikasi dummy)...\n`

  try {
    const rawCompiled = activeDisplayOutput.value || liveAgentCompiledOutput.value

    let modeDirective = ''
    if (mode === 'skill') {
      modeDirective = `
---
[DIRECTIVE RESMI: SINTESIS FILE SKILL.MD SPESIALIS (MARKDOWN MURNI)]
Tugas Anda adalah merapikan seluruh batasan teknis, aturan arsitektur, dan alur eksekusi di atas menjadi satu file SKILL.md resmi standar industri yang siap diinjeksikan ke AI Agent.

FORMAT STRUKTUR WAJIB (MARKDOWN):
---
name: ${currentRoleDef.value.skillName || 'software-architect'}
description: Panduan arsitektur dan batasan teknis deterministik untuk ${form.value.title}.
---

# ${currentRoleDef.value.name || 'Software Architect'} Specialist Skill

## 1. Context & Operational Scope
Jelaskan peran spesialis dan batasan tanggung jawab secara terukur.

## 2. Strict Technical Constraints (Non-Negotiables)
Daftar batasan teknologi yang TIDAK BOLEH dilanggar, versi library, konfigurasi keamanan, dan larangan anti-pattern.

## 3. Architecture & Design Decisions
Aturan decoupling antarlayer, pola integrasi database, kontrak API, dan manajemen state.

## 4. Deterministic Step-by-Step Execution Workflow
Urutan langkah implementasi dari inspeksi dependency hingga verifikasi build.

## 5. Failure Modes, Edge Cases & Verification Criteria
Pengecekan kualitas kritis sebelum code dinyatakan production-ready.

ATURAN PALING PENTING:
- DILARANG MENULIS KODE IMPLEMENTASI APLIKASI MENTAH (JANGAN MEMBUAT COMPONENT ATAU SOURCE CODE DUMMY).
- Fokus murni pada pedoman arsitektur, standar teknis, dan kontrak rekayasa perangkat lunak format Markdown (.md).`
    } else if (mode === 'design') {
      modeDirective = `
---
[DIRECTIVE RESMI: SINTESIS DOKUMEN DESAIN SISTEM & ARSITEKTUR (.MD)]
Tugas Anda adalah merumuskan spesifikasi di atas menjadi DOKUMEN DESAIN ARSITEKTUR LENGKAP (ARCHITECTURE.md / SYSTEM_DESIGN.md).

FORMAT STRUKTUR WAJIB (MARKDOWN):
# System Architecture & Technical Design: ${form.value.title}

## 1. Executive Summary & System Boundaries
Deskripsi ringkas sistem, tujuan operasional, dan batasan ruang lingkup.

## 2. Technology Stack & Architectural Decisions
Komponen teknologi yang dipilih, alasan arsitektural, dan analisis trade-offs.

## 3. Component Contracts & Data Flow
Interaksi antarkomponen (Frontend, Backend, Persistence/Cache), kontrak API, dan jaminan integritas data.

## 4. Non-Functional Requirements (NFR) & Security Hardening
Target performa (P99 latency), throughput, autentikasi/otorisasi, mitigasi kerentanan, dan isolasi lingkungan.

## 5. Quality Assurance & Production Readiness Checklist
Kriteria kelulusan teknis, observabilitas (logging/metrics), dan mitigasi risiko kegagalan.

ATURAN PALING PENTING:
- DILARANG MENULIS KODE APLIKASI MENTAH (JANGAN MEMBUAT SOURCE CODE / SNIPPETS PANJANG).
- Berikan dokumen markdown arsitektur yang komprehensif, terstruktur, padat, dan profesional.`
    } else {
      modeDirective = `
---
[DIRECTIVE RESMI: AUDIT KUALITAS & KESIAPAN PROMPT ARSITEKTUR (.MD)]
Evaluasi prompt arsitektur di atas dari kacamata Staff Software Architect & Lead Prompt Engineer:
1. **Analisis Kelengkapan & Determinisme**: Apakah ada instruksi yang masih ambigu atau memungkinkan AI berhalusinasi?
2. **Celah Arsitektur (Blindspots)**: Bagian keamanan, edge case, atau skalabilitas apa yang terlewat?
3. **Rekomendasi Revisi Markdown**: Tuliskan ringkasan aturan yang sudah dirapikan dan disempurnakan.

ATURAN PALING PENTING:
- Format hasil dalam Markdown (.md) yang rapi dan terstruktur.
- Dilarang membuat kode aplikasi dummy.`
    }

    const res = await generateWithAI({
      systemPrompt:
        'You are a Principal Software Architect and Lead AI Systems Engineer. Produce authoritative, deterministic, production-grade Markdown documents (.md) without generic conversational filler or dummy implementation code.',
      userPrompt: `${rawCompiled}\n\n${modeDirective}`,
      maxTokens: 1800,
    })

    aiExecutionOutput.value = res.content
    showToast(`Berhasil merapikan dokumen via ${res.provider.toUpperCase()} (${res.model}).`, 'ok')
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : 'Gagal menghubungi AI provider'
    if (rawMsg.toLowerCase().includes('timeout')) {
      const currentTimeout = aiStore.state.timeoutSeconds || 300
      aiExecutionOutput.value = `[AI PROVIDER TIMEOUT ERROR]\nInferensi melebihi batas waktu (${currentTimeout} detik).\n\nModel lokal Anda (${aiStore.activeModel}) membutuhkan waktu lebih lama untuk menghasilkan dokumen ini. Anda dapat menaikkan nilai 'Request Timeout' (misal: 600 detik) di Pengaturan Mesin AI.`
    } else {
      aiExecutionOutput.value = `[AI PROVIDER ERROR]\n${rawMsg}\n\nPastikan Local LM Studio / Ollama aktif atau Cloud API Key telah dikonfigurasi di Pengaturan Mesin AI.`
    }
  } finally {
    stopAiTimer()
    aiBusy.value = null
  }
}

const handleDownloadAiOutputMd = () => {
  if (!aiExecutionOutput.value) return
  const slug =
    form.value.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'ai-specification'
  const filename = `${slug}-${aiOutputMode.value === 'skill' ? 'SKILL' : aiOutputMode.value === 'design' ? 'ARCHITECTURE' : 'AUDIT'}.md`
  const blob = new Blob([aiExecutionOutput.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  showToast(`Dokumen ${filename} berhasil diunduh.`, 'ok')
}

const copyCompiledPrompt = async () => {
  const content =
    outputTab.value === 'json'
      ? liveJsonPreview.value
      : outputTab.value === 'ai-output'
        ? aiExecutionOutput.value
        : liveAgentCompiledOutput.value
  await navigator.clipboard.writeText(content)
  copiedNotice.value = true
  const targetLabel =
    outputTab.value === 'compiled'
      ? currentAgentDef.value.filename
      : outputTab.value === 'json'
        ? 'JSON'
        : 'AI Output'
  showToast(`Copied ${targetLabel} to clipboard.`, 'ok')
  setTimeout(() => {
    copiedNotice.value = false
  }, 1600)
}

const handleDownloadActiveAgent = () => {
  if (agentCategoryMode.value === 'skills') {
    downloadRoleSkillMd(
      activeSpecialistRole.value,
      liveSkillCompiledOutput.value,
      form.value.title,
    )
    showToast(`Berhasil ekspor ${currentRoleDef.value.filename} (${currentRoleDef.value.shortLabel}).`, 'ok')
  } else {
    downloadAgentFile(
      activeAgentTarget.value,
      liveAgentCompiledOutput.value,
      form.value.title,
    )
    showToast(`Berhasil ekspor ${currentAgentDef.value.filename} untuk ${currentAgentDef.value.name}.`, 'ok')
  }
}

const exportPromptFile = (ext: 'md' | 'json') => {
  const slug =
    form.value.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'technical-prompt'
  const content = ext === 'md' ? activeDisplayOutput.value : liveJsonPreview.value
  const mime = ext === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8'
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  showToast(`Exported ${slug}.${ext}`, 'ok')
}

onMounted(() => {
  fetchWorkspaceData()
})
</script>

<template>
  <div class="prompt-workbench">
    <!-- Toast Notification -->
    <div
      v-if="statusToast"
      class="toast-notification"
    >
      <StatusDot :status="statusToast.type === 'err' ? 'danger' : statusToast.type === 'info' ? 'warn' : 'ok'" />
      <span>{{ statusToast.text }}</span>
    </div>

    <!-- Page Header: Baseline-aligned, one primary button top-right -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">Compiler Prompt</h1>
        <p class="page-desc">
          Ubah spesifikasi PRD menjadi instruksi prompt teknis untuk coding AI.
        </p>
      </div>

      <div class="header-actions">
        <!-- PRD Bridge -->
        <div class="bridge-control">
          <span class="bridge-label">Hubungkan Blueprint:</span>
          <select
            v-model="selectedBridgePrdId"
            class="bridge-select"
            @change="handleBridgeSelect"
          >
            <option value="">Pilih dokumen Blueprint...</option>
            <option v-for="prd in availablePrds" :key="prd.id" :value="String(prd.id)">
              [{{ prd.category }}] {{ prd.title }}
            </option>
          </select>
        </div>

        <button type="button" class="btn-secondary" @click="startNewPrompt">
          <Plus :size="15" :stroke-width="1.5" />
          <span>Prompt Baru</span>
        </button>

        <button type="button" class="btn-primary" :disabled="saving" @click="savePrompt">
          <Save :size="15" :stroke-width="1.5" />
          <span>{{ saving ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Simpan Prompt' }}</span>
        </button>
      </div>
    </header>

    <!-- Workspace Grid: 8/4 Asymmetric Layout starting on same top line -->
    <div class="workspace-grid">
      <!-- Left Column: Compiler Form in One Bordered Container -->
      <section class="compiler-container">
        <!-- Target Architecture Stack Presets Strip -->
        <div class="target-stack-strip">
          <div class="target-stack-header">
            <span class="target-stack-title font-mono">TEMPLATE ARSITEKTUR:</span>
            <span class="target-stack-hint">Pilihan cepat teknologi target untuk instruksi coding AI</span>
          </div>
          <div class="target-stack-chips">
            <button
              v-for="preset in STACK_TARGET_PRESETS"
              :key="preset.id"
              type="button"
              class="stack-preset-chip font-mono"
              :class="{ active: isStackPresetActive(preset) }"
              @click="applyStackPreset(preset)"
            >
              <Layers :size="12" />
              <span>{{ preset.badge }}</span>
            </button>
          </div>
        </div>

        <!-- Preset Switcher Strip -->
        <div class="preset-switcher-strip">
          <div class="role-tabs-row">
            <button
              v-for="role in ROLE_CATEGORIES"
              :key="role"
              type="button"
              class="role-tab"
              :class="{ active: selectedRole === role }"
              @click="selectedRole = role"
            >
              {{ role }}
            </button>
          </div>

          <div class="preset-controls-row">
            <!-- Preset Selection Dropdown -->
            <div class="preset-select-wrap">
              <select
                class="input-base preset-dropdown"
                :value="form.id || form.title"
                @change="(e) => {
                  const val = (e.target as HTMLSelectElement).value
                  const found = prompts.find(p => String(p.id) === val || p.title === val)
                  if (found) selectPromptForEdit(found)
                }"
              >
                <option v-for="item in filteredPrompts" :key="item.id || item.title" :value="item.id || item.title">
                  [{{ item.role_category }}] {{ item.title }} ({{ item.is_preset ? 'preset' : 'kustom' }})
                </option>
              </select>
            </div>

            <!-- Search -->
            <div class="preset-search-wrap">
              <Search :size="13" class="search-icon" />
              <input
                v-model="stackSearch"
                type="search"
                placeholder="Cari template prompt..."
                class="input-base search-input"
              />
            </div>

            <!-- Segmented Filter (All, Preset, Custom) -->
            <div class="segmented-filter">
              <button
                type="button"
                :class="{ active: presetFilter === 'all' }"
                @click="presetFilter = 'all'"
              >
                Semua
              </button>
              <button
                type="button"
                :class="{ active: presetFilter === 'preset' }"
                @click="presetFilter = 'preset'"
              >
                Preset
              </button>
              <button
                type="button"
                :class="{ active: presetFilter === 'custom' }"
                @click="presetFilter = 'custom'"
              >
                Kustom
              </button>
            </div>

            <!-- Quick Clone & Delete Actions -->
            <button
              v-if="form.title"
              type="button"
              class="btn-secondary btn-sm"
              title="Duplikat prompt aktif"
              @click="clonePrompt(form)"
            >
              <Copy :size="12" />
              <span>Duplikat</span>
            </button>

            <template v-if="form.id && !form.is_preset">
              <button
                v-if="confirmDeleteId !== form.id"
                type="button"
                class="btn-secondary btn-sm delete-btn"
                @click="confirmDeleteId = form.id"
              >
                <Trash2 :size="12" />
                <span>Hapus</span>
              </button>
              <div v-else class="confirm-inline">
                <button
                  type="button"
                  class="btn-sm confirm-btn"
                  @click="confirmDeletePrompt(form.id)"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  class="btn-sm cancel-btn"
                  @click="confirmDeleteId = null"
                >
                  Batal
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Form Fields with 1px Rules -->
        <div class="form-body">
          <!-- Title & Role Category Row -->
          <div class="form-section">
            <div class="two-col-row">
              <div class="field-item flex-2">
                <label class="field-label">Judul Template Prompt</label>
                <input
                  v-model="form.title"
                  type="text"
                  class="input-base"
                  placeholder="Contoh: Go + Gin REST API & GORM model"
                />
              </div>

              <div class="field-item flex-1">
                <label class="field-label">Kategori Peran</label>
                <div class="role-preset-row">
                  <select v-model="form.role_category" class="input-base">
                    <option v-for="r in FORM_ROLES" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <label class="checkbox-row">
                    <input v-model="form.is_preset" type="checkbox" />
                    <span>Preset</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Active Tech Stack Tags & Lexicon Constraint Injector -->
            <div class="mt-12">
              <LexiconMatrix
                :selected-tags="form.tech_stack_tags"
                @toggle-chip="toggleLexiconChip"
                @add-custom-tag="addCustomTag"
                @remove-tag="removeTag"
              />
            </div>
          </div>

          <!-- 01 System Persona -->
          <div class="form-section">
            <div class="section-title-row">
              <span class="section-num font-mono">01</span>
              <h2 class="section-heading">Peran &amp; Sasaran Sistem (System Persona)</h2>
            </div>
            <textarea
              v-model="form.system_role"
              rows="3"
              class="input-textarea"
              placeholder="Act as a Principal Software Engineer..."
            ></textarea>
          </div>

          <!-- 02 Tech Stack Constraints -->
          <div class="form-section">
            <div class="section-title-row">
              <span class="section-num font-mono">02</span>
              <h2 class="section-heading">Batasan &amp; Aturan Teknologi</h2>
            </div>
            <textarea
              v-model="form.technical_constraints"
              rows="4"
              class="input-textarea font-mono"
              placeholder="- Strict TypeScript interfaces..."
            ></textarea>
          </div>

          <!-- 03 Architecture Rules -->
          <div class="form-section">
            <div class="section-title-row">
              <span class="section-num font-mono">03</span>
              <h2 class="section-heading">Struktur &amp; Pola Arsitektur</h2>
            </div>
            <textarea
              v-model="form.architecture_rules"
              rows="4"
              class="input-textarea font-mono"
              placeholder="- Layered clean architecture..."
            ></textarea>
          </div>

          <!-- 04 Point-by-Point Instructions with AI Refine -->
          <div class="form-section">
            <div class="section-title-row space-between">
              <div class="inline-flex items-center gap-8">
                <span class="section-num font-mono">04</span>
                <h2 class="section-heading">Langkah Eksekusi Bertahap (Step-by-Step)</h2>
              </div>

              <!-- AI Refine Trigger with Elapsed Timer -->
              <div v-if="aiBusy === 'refine'" class="ai-active-box">
                <span class="ai-timer font-mono">Menyusun ({{ aiElapsedTime }}s)...</span>
                <button
                  type="button"
                  class="btn-tertiary cancel-text"
                  @click="cancelAiGeneration"
                >
                  Batal
                </button>
              </div>
              <button
                v-else
                type="button"
                class="btn-secondary btn-sm"
                :disabled="aiBusy !== null"
                @click="refinePromptWithAI"
              >
                <Wand2 :size="13" />
                <span>Perjelas Langkah (AI)</span>
              </button>
            </div>
            <textarea
              v-model="form.point_by_point_instructions"
              rows="6"
              class="input-textarea font-mono"
              placeholder="1. Inspect workspace dependencies..."
            ></textarea>
          </div>

          <!-- 05 Edge Cases -->
          <div class="form-section">
            <div class="section-title-row">
              <span class="section-num font-mono">05</span>
              <h2 class="section-heading">Penanganan Kasus Khusus (Edge Cases)</h2>
            </div>
            <textarea
              v-model="form.edge_cases_to_handle"
              rows="3"
              class="input-textarea font-mono"
              placeholder="- Context timeouts, empty filter states..."
            ></textarea>
          </div>

          <!-- 06 Output Format -->
          <div class="form-section last">
            <div class="section-title-row">
              <span class="section-num font-mono">06</span>
              <h2 class="section-heading">Format Keluaran Kode</h2>
            </div>
            <textarea
              v-model="form.output_format"
              rows="2"
              class="input-textarea"
              placeholder="Return complete, compilable source files..."
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Right Column: Sticky Live Preview & AI Test Arena -->
      <aside class="preview-container">
        <!-- Preview Tab Bar & Action Controls -->
        <div class="preview-header">
          <div class="tab-list">
            <button
              type="button"
              class="tab-item"
              :class="{ active: outputTab === 'compiled' }"
              @click="outputTab = 'compiled'"
            >
              Aturan Agent
            </button>
            <button
              type="button"
              class="tab-item"
              :class="{ active: outputTab === 'json' }"
              @click="outputTab = 'json'"
            >
              JSON
            </button>
            <button
              type="button"
              class="tab-item"
              :class="{ active: outputTab === 'ai-output' }"
              @click="outputTab = 'ai-output'"
            >
              Hasil AI
            </button>
          </div>

          <div class="preview-actions">
            <!-- Run Prompt Action with Elapsed Timer & Cancel -->
            <div v-if="aiBusy === 'execute'" class="ai-active-box">
              <span class="ai-timer font-mono">{{ aiElapsedTime }}s</span>
              <button
                type="button"
                class="btn-tertiary cancel-text"
                @click="cancelAiGeneration"
              >
                Batal
              </button>
            </div>

            <div v-else class="ai-btn-group">
              <button
                type="button"
                class="btn-primary btn-sm"
                :disabled="aiBusy !== null"
                title="Rapikan spesifikasi teknis menjadi berkas SKILL.md resmi berformat Markdown"
                @click="synthesizeDocumentWithAI('skill')"
              >
                <Sparkles :size="12" />
                <span>Rapikan ke SKILL.md</span>
              </button>

              <button
                type="button"
                class="btn-secondary btn-sm"
                :disabled="aiBusy !== null"
                title="Sintesis Dokumen Desain Arsitektur Sistem (.md)"
                @click="synthesizeDocumentWithAI('design')"
              >
                <FileCode2 :size="12" />
                <span>Desain .md</span>
              </button>
            </div>

            <button
              type="button"
              class="btn-secondary btn-sm"
              :title="`Salin ${outputTab === 'compiled' ? currentAgentDef.filename : outputTab === 'ai-output' ? 'Dokumen AI (.md)' : 'JSON'}`"
              @click="copyCompiledPrompt"
            >
              <Check v-if="copiedNotice" :size="12" />
              <Copy v-else :size="12" />
              <span>{{ copiedNotice ? 'Tersalin' : 'Salin' }}</span>
            </button>

            <!-- Download Button: adapts depending on active tab -->
            <button
              v-if="outputTab === 'compiled'"
              type="button"
              class="btn-secondary btn-sm highlight-download"
              :title="agentCategoryMode === 'skills' ? `Unduh ${currentRoleDef.filename} untuk ${currentRoleDef.name}` : `Unduh ${currentAgentDef.filename} untuk ${currentAgentDef.name}`"
              @click="handleDownloadActiveAgent"
            >
              <Download :size="12" />
              <span class="font-mono">{{ agentCategoryMode === 'skills' ? currentRoleDef.filename : currentAgentDef.filename }}</span>
            </button>

            <button
              v-else-if="outputTab === 'ai-output'"
              type="button"
              class="btn-secondary btn-sm highlight-download"
              title="Unduh dokumen hasil AI sebagai file .md"
              @click="handleDownloadAiOutputMd"
            >
              <Download :size="12" />
              <span class="font-mono">Unduh .md</span>
            </button>

            <button
              v-else
              type="button"
              class="btn-secondary btn-sm"
              title="Ekspor file JSON"
              @click="exportPromptFile('json')"
            >
              .json
            </button>
          </div>
        </div>

        <!-- Target Agent Switcher Strip (Visible on compiled tab) -->
        <AgentTargetSelector
          v-if="outputTab === 'compiled'"
          :category-mode="agentCategoryMode"
          :active-specialist-role="activeSpecialistRole"
          :active-agent-target="activeAgentTarget"
          :current-role-def="currentRoleDef"
          :current-agent-def="currentAgentDef"
          @update:category-mode="agentCategoryMode = $event"
          @update:active-specialist-role="activeSpecialistRole = $event"
          @update:active-agent-target="activeAgentTarget = $event"
        />

        <!-- Metrics Strip -->
        <div class="metrics-strip font-mono">
          <span>{{ promptMetrics.lines }} baris</span>
          <span>{{ promptMetrics.words }} kata</span>
          <span>~{{ promptMetrics.estTokens }} token</span>
          <span class="active-agent-badge font-mono">{{ agentCategoryMode === 'skills' ? currentRoleDef.filename : currentAgentDef.filename }}</span>
        </div>

        <!-- Preview Body with Internal Scroll -->
        <div class="preview-scroll-pane">
          <pre
            v-if="outputTab === 'compiled'"
            class="code-block font-mono"
          ><code>{{ activeDisplayOutput }}</code></pre>

          <pre
            v-else-if="outputTab === 'json'"
            class="code-block font-mono"
          ><code>{{ liveJsonPreview }}</code></pre>

          <div v-else class="ai-arena-view">
            <div class="arena-top">
              <div class="arena-meta font-mono">
                <span class="arena-engine-label">Engine: {{ aiStore.statusBadgeText }}</span>
                <span class="arena-mode-badge">{{ aiOutputMode === 'skill' ? 'Target: SKILL.md' : aiOutputMode === 'design' ? 'Target: ARCHITECTURE.md' : 'Target: Audit Review' }}</span>
              </div>
              <div class="arena-controls font-mono">
                <button
                  type="button"
                  class="btn-tertiary config-link"
                  @click="aiStore.openModal"
                >
                  <Settings :size="12" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
            <pre class="code-block font-mono"><code>{{
              aiExecutionOutput ||
              '// Klik tombol "Rapikan ke SKILL.md" atau "Desain .md" di atas untuk menghasilkan dokumen Markdown resmi tanpa kode aplikasi dummy.'
            }}</code></pre>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.prompt-workbench {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text);
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--rule);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-family: var(--font-serif);
  font-size: 40px;
  font-weight: 400;
  line-height: 1.1;
  color: var(--text);
}

.page-desc {
  font-size: 15px;
  line-height: 1.65;
  color: var(--text-2);
  max-width: 64ch;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.bridge-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.bridge-label {
  font-size: 13px;
  color: var(--text-3);
  white-space: nowrap;
}

.bridge-select {
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text);
  max-width: 220px;
  cursor: pointer;
}

.bridge-select option {
  background-color: var(--elevated);
  color: var(--text);
}

/* Workspace Grid: 8/4 Asymmetric Layout */
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(520px, 7fr) minmax(420px, 5fr);
  gap: 24px;
  align-items: start;
}

/* Left Compiler Container */
.compiler-container {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

/* Preset Switcher Strip */
.preset-switcher-strip {
  border-bottom: 1px solid var(--rule);
  background-color: var(--elevated);
}

.role-tabs-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  overflow-x: auto;
  border-bottom: 1px solid var(--rule);
}

.role-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.12s ease;
}

.role-tab:hover {
  color: var(--text);
}

.role-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.preset-controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.preset-select-wrap {
  flex: 2;
  min-width: 200px;
}

.preset-dropdown {
  height: 34px;
  font-size: 13px;
  cursor: pointer;
}

.preset-search-wrap {
  position: relative;
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  height: 34px;
  padding-left: 30px;
  font-size: 13px;
}

.segmented-filter {
  display: inline-flex;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
  background-color: var(--surface);
}

.segmented-filter button {
  height: 32px;
  padding: 0 10px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--rule);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.segmented-filter button:last-child {
  border-right: none;
}

.segmented-filter button:hover {
  color: var(--text);
}

.segmented-filter button.active {
  background-color: var(--hover);
  color: var(--text);
}

.delete-btn {
  color: var(--danger);
  border-color: var(--rule);
}

.delete-btn:hover {
  border-color: var(--danger);
}

.confirm-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.confirm-btn {
  background-color: var(--danger);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0 10px;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background: transparent;
  color: var(--text-3);
  border: none;
  padding: 0 6px;
  height: 32px;
  font-size: 12px;
  cursor: pointer;
}

/* Form Body */
.form-body {
  display: flex;
  flex-direction: column;
}

.form-section {
  padding: 24px;
  border-bottom: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-section.last {
  border-bottom: none;
}

.two-col-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flex-1 {
  flex: 1;
  min-width: 180px;
}

.flex-2 {
  flex: 2;
  min-width: 240px;
}

.mt-12 {
  margin-top: 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-3);
}

.role-preset-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-2);
  white-space: nowrap;
  cursor: pointer;
}

.checkbox-row input {
  accent-color: var(--accent);
}

/* Tags Editor Bar */
.tags-editor-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.stack-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text);
}

.tag-close-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
}

.tag-close-btn:hover {
  color: var(--danger);
}

.add-tag-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 180px;
}

.add-tag-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 12px;
  flex: 1;
}

.add-tag-btn {
  height: 24px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
}

.add-tag-btn:hover {
  color: var(--text);
  border-color: var(--text-3);
}

/* Integrated Lexicon Dock */
.lexicon-dock {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lexicon-dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.lexicon-cat-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
}

.lex-cat-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
}

.lex-cat-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.lexicon-chips-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lex-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;
}

.lex-chip:hover {
  border-color: var(--rule-strong);
  color: var(--text);
}

.lex-chip.active {
  border-color: var(--accent);
  color: var(--accent);
}

.chip-cat {
  color: var(--text-3);
  font-size: 11px;
}

.chip-tag {
  color: inherit;
}

.chip-icon {
  color: inherit;
}

.chip-icon.muted {
  color: var(--text-3);
}

/* Numbered Section Titles */
.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title-row.space-between {
  justify-content: space-between;
}

.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.gap-8 {
  gap: 8px;
}

.section-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-3);
}

.section-heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

/* AI Active Box */
.ai-active-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ai-timer {
  font-size: 12px;
  color: var(--text-3);
}

.cancel-text {
  color: var(--danger);
  font-size: 12px;
}

/* Right Column: Sticky Preview */
.preview-container {
  position: sticky;
  top: 32px;
  max-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--rule);
  background-color: var(--elevated);
  gap: 12px;
  flex-wrap: wrap;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metrics-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--rule);
  font-size: 12px;
  color: var(--text-3);
}

.preview-scroll-pane {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  background-color: var(--elevated);
}

.code-block {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-arena-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.arena-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--rule);
}

.arena-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.arena-mode-badge {
  font-size: 10.5px;
  color: var(--accent);
  background-color: rgba(255, 122, 69, 0.1);
  border: 1px solid rgba(255, 122, 69, 0.25);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.arena-engine-label {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-2);
}

.config-link {
  font-size: 12px;
  color: var(--text-3);
}

.config-link:hover {
  color: var(--text);
}

/* Target Architecture Stack Presets Strip */
.target-stack-strip {
  border-bottom: 1px solid var(--rule);
  padding: 12px 16px;
  background-color: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.target-stack-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.target-stack-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.5px;
}

.target-stack-hint {
  font-size: 12px;
  color: var(--text-3);
}

.target-stack-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stack-preset-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.stack-preset-chip:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.stack-preset-chip.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

/* Agent Target Switcher Strip */
.agent-target-strip {
  border-bottom: 1px solid var(--rule);
  padding: 10px 14px;
  background-color: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-mode-tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}

.agent-mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 10.5px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.12s ease;
}

.agent-mode-tab:hover {
  color: var(--text);
  background-color: var(--hover);
}

.agent-mode-tab.active {
  background-color: var(--elevated);
  border-color: var(--rule-strong);
  color: var(--accent);
}

.agent-role-section,
.agent-target-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-target-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.agent-strip-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  letter-spacing: 0.5px;
}

.agent-target-path {
  font-size: 11px;
  color: var(--accent);
}

.agent-target-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.agent-target-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.agent-target-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.agent-target-btn.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.agent-desc-caption {
  font-size: 11px;
  color: var(--text-3);
  margin: 0;
  line-height: 1.4;
}

.highlight-download {
  border-color: var(--accent-subtle) !important;
  color: var(--accent) !important;
}

.highlight-download:hover {
  border-color: var(--accent) !important;
  background-color: var(--hover) !important;
}

.active-agent-badge {
  color: var(--accent);
  background-color: var(--elevated);
  padding: 1px 6px;
  border-radius: var(--radius);
  border: 1px solid var(--rule);
}

@media (max-width: 1024px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
  .preview-container {
    position: static;
    max-height: 500px;
  }
}
</style>
