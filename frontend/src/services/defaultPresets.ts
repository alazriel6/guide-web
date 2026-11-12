import {
  type PrdDocument,
  type PromptTemplate,
  compilePrdMarkdownClient,
  compileTechnicalPromptClient,
} from './api'

export const FALLBACK_PRD_PRESETS: PrdDocument[] = [
  {
    id: 101,
    title: 'Multi-Tenant B2B Telemetry & Feature Flag SaaS',
    category: 'SaaS Web App',
    is_preset: true,
    overview:
      'Build a low-latency feature flag evaluation and real-time product telemetry platform for engineering organizations. Enables instant percentage rollouts, deterministic user cohort targeting, and sub-50ms SDK config streaming via Server-Sent Events (SSE).',
    target_users:
      '- **Release Engineers & SREs:** Need instant kill-switches and canary rollout rules with zero config drift.\n- **Full-Stack Product Teams:** Need type-safe SDK evaluation and environment-level flag overrides (Dev, Staging, Prod).',
    core_features: `- **Rule Evaluation Engine:** Deterministic SHA-256 user bucketing for percentage rollouts and attribute-based targeting (plan tier, region, org_id).
- **Environment Matrix & Audit Log:** Immutable append-only audit trail recording every flag toggle with diff snapshots and rollback triggers.
- **Real-Time Streaming SDK Endpoint:** SSE endpoint pushing delta updates to connected client SDKs within 50ms of state mutation.
- **RBAC & API Key Management:** Scoped read-only client keys vs. write-enabled server admin keys with rate-limit quotas.`,
    tech_stack: `- **Frontend:** Vue 3 (<script setup lang="ts">), TypeScript 5+, Pinia, Vite, Scoped Obsidian Dark UI
- **Backend:** Go 1.22+, Gin HTTP Router, GORM ORM, In-Memory Read-Through Cache with RWMutex
- **Database:** PostgreSQL 16 (JSONB targeting rules, composite B-Tree indexes on org_id + env_key)`,
    architecture_specs: `### Core Entities
- **organizations**: id (PK), slug (UNIQUE), name, plan_tier, created_at
- **feature_flags**: id (PK), org_id (FK), key (VARCHAR), env (VARCHAR), enabled (BOOL), rollout_pct (INT), targeting_rules (JSONB), version (INT)
- **flag_audit_logs**: id (PK), flag_id (FK), actor_email, previous_state (JSONB), next_state (JSONB), created_at

### Key REST Endpoints
- GET /api/v1/flags?env=production -> Returns evaluated flag manifest
- POST /api/v1/flags -> Creates a new flag definition across environments
- PUT /api/v1/flags/:id/toggle -> Atomic version-checked flag state mutation
- GET /api/v1/stream/flags -> Server-Sent Events stream for live SDK listeners`,
    edge_cases: `- **Non-Goals:** No full session replay video capture; no third-party billing gateway implementation in v1.
- **Concurrent Updates:** Enforce optimistic locking via version column check on PUT /api/v1/flags/:id to prevent lost updates.
- **Database Cold Start / Outage:** Client SDKs and backend evaluator fall back to last-known-good in-memory snapshot.`,
    compiled_markdown: '',
  },
  {
    id: 102,
    title: 'Non-Destructive GPU Audio & Waveform Mastering Studio',
    category: 'Desktop Media App',
    is_preset: true,
    overview:
      'A high-precision desktop-class digital audio mastering and spectral inspection workstation. Designed for 60fps real-time waveform rendering, non-destructive parametric EQ graph manipulation, LUFS loudness metering, and zero-copy local audio buffer processing.',
    target_users:
      '- **Mastering Engineers & Sound Designers:** Require frame-accurate waveform scrubbing, phase correlation metering, and batch stem export.\n- **Podcast & Media Producers:** Need automated loudness normalization (-14 LUFS) with visual spectral peak warnings.',
    core_features: `- **60fps Canvas/WebGL Waveform Viewport:** Multi-resolution peak pyramid cache allowing instant zoom from 2-hour timeline down to individual sample points without UI frame drops.
- **Non-Destructive DSP Chain:** Real-time parametric 8-band EQ, brickwall true-peak limiter, and stereo width imager with A/B bypass comparison.
- **LUFS & True-Peak Loudness Radar:** Continuous EBU R128 integrated, short-term, and momentary loudness calculation with clipping markers.
- **Project Preset & Snapshot Vault:** Save and recall mastering chains and project markers in PostgreSQL.`,
    tech_stack: `- **Frontend UI & Viewport:** Vue 3, TypeScript, HTML5 Canvas 2D / WebGL2 Shader Pipeline, Web Audio API AudioWorklet
- **Backend / Companion API:** Go (Gin) for preset persistence, waveform peak cache indexing, and FFmpeg batch transcoding worker pool
- **Database:** PostgreSQL for cloud-synced mastering presets, DSP chain templates, and render job history`,
    architecture_specs: `### Data Models
- **mastering_presets**: id (PK), name, genre_tag, eq_bands (JSONB), limiter_threshold_db (FLOAT), target_lufs (FLOAT), created_at
- **render_jobs**: id (PK), source_filename, sample_rate (INT), bit_depth (INT), preset_id (FK), status (VARCHAR), peak_db (FLOAT)

### REST & Worker Endpoints
- GET /api/v1/dsp-presets -> List factory and user DSP mastering chains
- POST /api/v1/dsp-presets -> Persist custom parametric EQ & limiter curve
- POST /api/v1/render-jobs -> Enqueue asynchronous batch audio normalization job`,
    edge_cases: `- **Non-Goals:** Multi-track MIDI sequencing or virtual instrument (VSTi) synthesis is out of scope.
- **Memory Ceiling on Large WAV Files:** Never decode multi-gigabyte 96kHz/24-bit WAV files entirely into main-thread JS heap; stream chunked peak mipmaps.
- **Audio Glitches on UI Resize:** Decouple ResizeObserver canvas redraws using requestAnimationFrame.`,
    compiled_markdown: '',
  },
  {
    id: 103,
    title: 'Hybrid Local-First Codebase RAG & AST Eval Workbench',
    category: 'AI Tooling',
    is_preset: true,
    overview:
      'An engineering workbench for evaluating LLM prompts against syntax-aware code chunks, comparing Local Ollama models against Cloud BYOK APIs (Gemini, Claude, OpenAI) with deterministic rubric scoring, latency telemetry, and token cost tracking.',
    target_users:
      '- **AI Systems Engineers:** Building coding assistants and automated PR review pipelines.\n- **Privacy-Conscious Enterprise Developers:** Testing local quantized models (Qwen-2.5-Coder, DeepSeek-Coder) before committing to cloud API spend.',
    core_features: `- **Dual-Mode AI Provider Router:** Seamless switching between local Ollama/LM Studio endpoints and cloud BYOK APIs via a unified proxy contract.
- **Side-by-Side Prompt Diff & Output Arena:** Execute identical system + user prompt payloads across two models simultaneously and inspect diffed markdown/code output.
- **Deterministic Constraint Verifier:** Automated checks verifying output JSON validity, presence of required code blocks, and forbidden token patterns.
- **Versioned Prompt & Eval Catalog:** Full CRUD persistence of prompt templates, system personas, and benchmark runs.`,
    tech_stack: `- **Frontend:** Vue 3 (<script setup lang="ts">), TypeScript, Axios, Custom Diff & Monospace Code Inspector
- **Backend:** Go, Gin Framework, GORM, Unified HTTP AI Proxy with context timeouts and header sanitization
- **Database:** PostgreSQL storing prompt templates, evaluation runs, and latency metrics`,
    architecture_specs: `### Entities
- **prompt_templates**: id (PK), title, role_category, tech_stack_tags (JSONB), system_role, technical_constraints, compiled_prompt
- **eval_runs**: id (PK), prompt_id (FK), provider, model_name, latency_ms (INT), status_code (INT), output_text (TEXT)

### API Contract
- POST /api/v1/ai/generate -> Unified proxy handling Ollama, OpenAI, Anthropic, and Gemini payload transformations
- GET /api/v1/prompts -> Filterable prompt preset repository`,
    edge_cases: `- **Non-Goals:** Do not store raw user cloud API keys in plaintext PostgreSQL tables; keep keys in client localStorage and pass ephemerally.
- **Upstream LLM Timeouts:** Configure a strict 90-second http.Client timeout on the Go proxy and return structured JSON error messages when local Ollama is unreachable.`,
    compiled_markdown: '',
  },
  {
    id: 104,
    title: 'High-Throughput Idempotent Payment Webhook & Ledger Microservice',
    category: 'REST Microservice',
    is_preset: true,
    overview:
      'A mission-critical Go REST microservice that ingests high-volume payment gateway webhooks (Stripe, Adyen, Midtrans), verifies HMAC-SHA256 cryptographic signatures, guarantees exactly-once idempotent processing, and records double-entry ledger entries in PostgreSQL.',
    target_users:
      '- **Backend & FinTech Platform Engineers:** Requiring zero duplicate charges, auditable double-entry balance sheets, and dead-letter queue replayability.',
    core_features: `- **Cryptographic Webhook Ingress:** Raw body HMAC-SHA256 verification with timestamp replay-window protection (rejects events older than 300 seconds).
- **Idempotency Barrier:** Unique constraint on (provider, external_event_id) with atomic PostgreSQL INSERT ... ON CONFLICT DO NOTHING semantics.
- **Double-Entry Ledger Engine:** Every state transition writes balanced debit/credit journal lines inside a serializable GORM database transaction.
- **Dead-Letter Replay API:** Inspect failed webhook payloads and trigger manual or automated exponential-backoff retries.`,
    tech_stack: `- **Backend:** Go 1.22+, Gin Framework, GORM ORM, pgx/v5 connection pool
- **Database:** PostgreSQL with ACID transactions, row-level SELECT FOR UPDATE locking on account balances
- **Observability:** Structured JSON request logging with correlation X-Request-ID headers`,
    architecture_specs: `### Database Schema
- **webhook_events**: id (PK), provider, external_event_id (UNIQUE), payload (JSONB), status (PENDING|PROCESSED|FAILED), error_msg, created_at
- **ledger_accounts**: id (PK), owner_id, currency (CHAR(3)), balance_cents (BIGINT), updated_at
- **ledger_entries**: id (PK), transaction_id (UUID), account_id (FK), direction (DEBIT|CREDIT), amount_cents (BIGINT), created_at

### Endpoints
- POST /api/v1/webhooks/:provider -> High-throughput signature-verified event ingestion
- GET /api/v1/ledger/accounts/:id -> Real-time balance & immutable entry history
- POST /api/v1/webhooks/:id/replay -> Re-execute failed webhook event transaction`,
    edge_cases: `- **Non-Goals:** No end-user checkout UI or credit card PAN storage.
- **Race Conditions on Burst Webhooks:** Database unique index + row locking must prevent double credit when gateways deliver duplicate events within 10ms.`,
    compiled_markdown: '',
  },
].map((doc) => ({
  ...doc,
  compiled_markdown: compilePrdMarkdownClient(doc),
}))

export const FALLBACK_PROMPT_PRESETS: PromptTemplate[] = [
  {
    id: 201,
    title: 'Vue 3 + TypeScript High-Craft Obsidian Workspace UI',
    role_category: 'Frontend',
    tech_stack_tags: [
      'Vue 3 <script setup>',
      'strict TypeScript interfaces',
      'DOM reflow optimization',
      '60fps micro-interactions',
      'Scoped CSS Grid',
    ],
    is_preset: true,
    system_role:
      'Act as a Principal Frontend UI/UX Architect specializing in Vue 3, strict TypeScript, and high-density developer tools (Linear / Raycast / Vercel aesthetic).',
    technical_constraints: `- Use Vue 3 Composition API with <script setup lang="ts"> and zero implicit 'any' types.
- Enforce dark-mode industrial carbon surface hierarchy (--bg-canvas, --bg-surface, --bg-elevated, 1px --border-subtle structural borders).
- Use monospace typography (JetBrains Mono / Fira Code) for all technical identifiers, schemas, and live compilers.`,
    architecture_rules: `- Decouple HTTP transport and AI provider routing into dedicated typed service modules (src/services/api.ts, src/services/aiService.ts).
- Use computed properties for live Markdown/Prompt compilation to avoid redundant string re-computation.`,
    point_by_point_instructions: `1. Define strict TypeScript interfaces matching all backend JSON payloads before writing component templates.
2. Build responsive split-pane workspace layouts where the left pane houses modular form controls and the right pane renders a sticky live code/markdown preview.
3. Implement optimistic UI feedback, loading states, and non-blocking toast notifications for all CRUD and AI generation operations.
4. Provide instant one-click Copy to Clipboard and Export (.md / .json) actions with visual confirmation states.`,
    edge_cases_to_handle: `- Prevent double form submissions while async API or LLM requests are in flight.
- Gracefully handle empty database filter results with actionable Empty State cards and quick-reset filters.`,
    output_format:
      'Return complete, production-ready Vue 3 Single File Components (.vue) and TypeScript service modules with zero placeholders.',
    compiled_prompt: '',
  },
  {
    id: 202,
    title: 'Go + Gin + GORM Clean Architecture REST API & AI Proxy',
    role_category: 'Backend',
    tech_stack_tags: [
      'Go 1.22+',
      'Gin HTTP Router',
      'GORM preloading & indexing',
      'context cancellation',
      'Layered Clean Architecture',
    ],
    is_preset: true,
    system_role:
      'Act as a Staff Backend Go Engineer building high-reliability RESTful APIs with Gin, GORM, and PostgreSQL.',
    technical_constraints: `- Structure code cleanly across cmd/, internal/config, internal/models, internal/services, and internal/handlers.
- Use GORM with PostgreSQL driver, parameterized queries, and explicit column tags.
- Configure http.Client with explicit context timeouts (e.g., 90s) for outbound AI proxy requests.`,
    architecture_rules: `- Never expose raw database panic traces to HTTP clients; return consistent JSON error envelopes.
- Ensure CORS middleware properly handles OPTIONS preflight requests and custom headers (Authorization, Content-Type, X-API-Key).`,
    point_by_point_instructions: `1. Define GORM models with primary keys, B-Tree indexes on filter columns (category, role_category, is_preset), and JSON serialization tags.
2. Implement database connection initialization, AutoMigrate execution, and idempotent startup seeding for empty tables.
3. Implement full CRUD handlers supporting query string filtering (category, search, role_category, stack, is_preset).
4. Build the unified POST /api/v1/ai/generate proxy service supporting Ollama, LM Studio, OpenAI, Anthropic Claude, and Google Gemini.`,
    edge_cases_to_handle: `- Validate path :id parameters and return 404 Not Found when records do not exist.
- Catch upstream AI provider HTTP 4xx/5xx responses and forward human-readable error details to the frontend.`,
    output_format:
      'Provide complete, compilable Go source files organized by package with exact module imports and zero unused variables.',
    compiled_prompt: '',
  },
  {
    id: 203,
    title: 'PostgreSQL Schema Optimization & Zero-Downtime Indexing',
    role_category: 'Database',
    tech_stack_tags: [
      'PostgreSQL 16',
      'GORM AutoMigrate',
      'Composite B-Tree Indexes',
      'JSONB Query Optimization',
      'ACID Transactions',
    ],
    is_preset: true,
    system_role:
      'Act as a Principal Database Reliability Engineer (DBRE) specializing in PostgreSQL 16 performance tuning and GORM schema design.',
    technical_constraints: `- Target PostgreSQL 16 with UTF-8 encoding and UTC timestamps.
- Avoid N+1 query patterns by utilizing GORM Preload or explicit JOIN projections.
- Use indexed filter columns for high-frequency catalog queries.`,
    architecture_rules: `- All state mutations involving multiple tables must execute inside db.Transaction(func(tx *gorm.DB) error { ... }).
- Ensure idempotent seed scripts check record counts before inserting preset fixtures.`,
    point_by_point_instructions: `1. Audit entity structs and add appropriate gorm:"index", gorm:"type:text", and gorm:"not null" annotations.
2. Design composite filter queries using parameterized WHERE clauses (ILIKE for case-insensitive search in PostgreSQL).
3. Provide diagnostic health check queries verifying active database connectivity and table readiness.`,
    edge_cases_to_handle: `- Handle NULL or empty JSON arrays gracefully via custom sql.Scanner and driver.Valuer implementations.
- Prevent SQL injection by strictly binding all search and filter strings as query parameters.`,
    output_format:
      'Deliver annotated Go GORM model structs, migration/seeder routines, and optimized query scopes.',
    compiled_prompt: '',
  },
  {
    id: 204,
    title: 'Full-Stack PRD-to-Code Execution Blueprint Compiler',
    role_category: 'Fullstack',
    tech_stack_tags: [
      'End-to-End Type Safety',
      'RESTful Contract Alignment',
      'Vue 3 + Go Gin',
      'PostgreSQL Persistence',
      'Deterministic Build Verification',
    ],
    is_preset: true,
    system_role:
      'Act as a Principal Full-Stack Architect translating Product Requirements Documents (PRDs) into synchronized Backend (Go/Gin/GORM) and Frontend (Vue 3/TypeScript) implementations.',
    technical_constraints: `- Guarantee 1:1 field name parity between Go JSON struct tags and TypeScript interface properties.
- Maintain strict separation between backend persistence (PostgreSQL) and frontend presentation (Vue 3).`,
    architecture_rules: `- Every feature defined in the PRD Core Features section must map to concrete REST endpoints, database columns, and interactive UI controls.
- Verify both 'go build ./...' and 'vue-tsc --build' pass with zero errors before completion.`,
    point_by_point_instructions: `1. Parse the source PRD Overview, Core Features, Tech Stack, and API Endpoints & Data Models.
2. Implement the Go backend models, seeder fixtures, REST routes, and AI proxy handlers first.
3. Implement the TypeScript API client, state management, and interactive Vue 3 workspace views second.
4. Run full static type-checking and compilation across both stacks.`,
    edge_cases_to_handle: `- Reconcile port mismatches between Vite dev proxy (/api) and VITE_API_BASE_URL environment variables.
- Ensure preset templates can be cloned or customized without corrupting factory defaults.`,
    output_format:
      'Deliver a cohesive, verified full-stack implementation with zero mocked persistence and zero build warnings.',
    compiled_prompt: '',
  },
].map((pt) => ({
  ...pt,
  compiled_prompt: compileTechnicalPromptClient(pt),
}))
