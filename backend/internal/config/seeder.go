package config

import (
	"fmt"
	"log"

	"github.com/alazriel6/vue-go-postgres/backend/internal/models"
	"gorm.io/gorm"
)

// CompilePrdMarkdown builds a clean, deterministic Markdown document from a PrdDocument's structured fields.
func CompilePrdMarkdown(doc *models.PrdDocument) string {
	targetUsers := doc.TargetUsers
	if targetUsers == "" {
		targetUsers = "- Solo Engineers, Tech Leads, and Product Teams requiring deterministic architecture specs."
	}
	return fmt.Sprintf(`# %s
**Category:** %s | **Preset Template:** %v

---

## 1. Project Overview & Problem Statement
%s

## 2. Target Users & Core Personas
%s

## 3. Core Features & Functional Scope
%s

## 4. Tech Stack & System Architecture
%s

## 5. API Endpoints & Data Models
%s

## 6. Non-Goals, Constraints & Edge Cases
%s
`,
		doc.Title,
		doc.Category,
		doc.IsPreset,
		doc.Overview,
		targetUsers,
		doc.CoreFeatures,
		doc.TechStack,
		doc.ArchitectureSpecs,
		doc.EdgeCases,
	)
}

// CompileTechnicalPrompt builds a structured point-by-point technical prompt from a PromptTemplate.
func CompileTechnicalPrompt(pt *models.PromptTemplate) string {
	tags := "General"
	if len(pt.TechStackTags) > 0 {
		tags = ""
		for i, t := range pt.TechStackTags {
			if i > 0 {
				tags += " | "
			}
			tags += t
		}
	}
	archRules := pt.ArchitectureRules
	if archRules == "" {
		archRules = "- Maintain strict separation of concerns across transport, service, and persistence layers.\n- Ensure deterministic error propagation with typed error envelopes."
	}
	edgeCases := pt.EdgeCasesToHandle
	if edgeCases == "" {
		edgeCases = "- Handle empty states, network timeouts, concurrent write races, and malformed payload inputs gracefully."
	}

	return fmt.Sprintf(`# ROLE & OBJECTIVE
%s

# TARGET ROLE & TECH STACK MATRIX
- **Role Category:** %s
- **Active Stack Lexicon:** %s

# TECH STACK CONSTRAINTS
%s

# ARCHITECTURE RULES
%s

# POINT-BY-POINT EXECUTION INSTRUCTIONS
%s

# EDGE CASES TO HANDLE
%s

# OUTPUT FORMAT SPECIFICATION
%s
`,
		pt.SystemRole,
		pt.RoleCategory,
		tags,
		pt.TechnicalConstraints,
		archRules,
		pt.PointByPointInstructions,
		edgeCases,
		pt.OutputFormat,
	)
}

// SeedDatabase populates initial PRD Presets and Technical Prompt Presets if tables are empty.
func SeedDatabase(db *gorm.DB) error {
	var prdCount int64
	if err := db.Model(&models.PrdDocument{}).Count(&prdCount).Error; err != nil {
		return err
	}

	if prdCount == 0 {
		log.Println("[SEED] Seeding initial PRD Presets...")
		prdPresets := []models.PrdDocument{
			{
				Title:       "Multi-Tenant B2B Telemetry & Feature Flag SaaS",
				Category:    "SaaS Web App",
				IsPreset:    true,
				Overview:    "Build a low-latency feature flag evaluation and real-time product telemetry platform for engineering organizations. Enables instant percentage rollouts, deterministic user cohort targeting, and sub-50ms SDK config streaming via Server-Sent Events (SSE).",
				TargetUsers: "- **Release Engineers & SREs:** Need instant kill-switches and canary rollout rules with zero config drift.\n- **Full-Stack Product Teams:** Need type-safe SDK evaluation and environment-level flag overrides (Dev, Staging, Prod).",
				CoreFeatures: `- **Rule Evaluation Engine:** Deterministic SHA-256 user bucketing for percentage rollouts and attribute-based targeting (plan tier, region, org_id).
- **Environment Matrix & Audit Log:** Immutable append-only audit trail recording every flag toggle with diff snapshots and rollback triggers.
- **Real-Time Streaming SDK Endpoint:** SSE endpoint pushing delta updates to connected client SDKs within 50ms of state mutation.
- **RBAC & API Key Management:** Scoped read-only client keys vs. write-enabled server admin keys with rate-limit quotas.`,
				TechStack: `- **Frontend:** Vue 3 (<script setup lang="ts">), TypeScript 5+, Pinia, Vite, Scoped Obsidian Dark UI
- **Backend:** Go 1.22+, Gin HTTP Router, GORM ORM, In-Memory Read-Through Cache with RWMutex
- **Database:** PostgreSQL 16 (JSONB targeting rules, composite B-Tree indexes on org_id + env_key)`,
				ArchitectureSpecs: `### Core Entities
- **organizations**: id (PK), slug (UNIQUE), name, plan_tier, created_at
- **feature_flags**: id (PK), org_id (FK), key (VARCHAR), env (VARCHAR), enabled (BOOL), rollout_pct (INT), targeting_rules (JSONB), version (INT)
- **flag_audit_logs**: id (PK), flag_id (FK), actor_email, previous_state (JSONB), next_state (JSONB), created_at

### Key REST Endpoints
- GET /api/v1/flags?env=production -> Returns evaluated flag manifest
- POST /api/v1/flags -> Creates a new flag definition across environments
- PUT /api/v1/flags/:id/toggle -> Atomic version-checked flag state mutation
- GET /api/v1/stream/flags -> Server-Sent Events stream for live SDK listeners`,
				EdgeCases: `- **Non-Goals:** No full session replay video capture; no third-party billing gateway implementation in v1.
- **Concurrent Updates:** Enforce optimistic locking via version column check on PUT /api/v1/flags/:id to prevent lost updates when two engineers edit targeting rules simultaneously.
- **Database Cold Start / Outage:** Client SDKs and backend evaluator must fall back to last-known-good in-memory snapshot if PostgreSQL experiences transient connection drops.`,
			},
			{
				Title:       "Non-Destructive GPU Audio & Waveform Mastering Studio",
				Category:    "Desktop Media App",
				IsPreset:    true,
				Overview:    "A high-precision desktop-class digital audio mastering and spectral inspection workstation. Designed for 60fps real-time waveform rendering, non-destructive parametric EQ graph manipulation, LUFS loudness metering, and zero-copy local audio buffer processing.",
				TargetUsers: "- **Mastering Engineers & Sound Designers:** Require frame-accurate waveform scrubbing, phase correlation metering, and batch stem export.\n- **Podcast & Media Producers:** Need automated loudness normalization (-14 LUFS) with visual spectral peak warnings.",
				CoreFeatures: `- **60fps Canvas/WebGL Waveform Viewport:** Multi-resolution peak pyramid cache allowing instant zoom from 2-hour timeline down to individual sample points without UI frame drops.
- **Non-Destructive DSP Chain:** Real-time parametric 8-band EQ, brickwall true-peak limiter, and stereo width imager with A/B bypass comparison.
- **LUFS & True-Peak Loudness Radar:** Continuous EBU R128 integrated, short-term, and momentary loudness calculation with clipping markers.
- **Project Preset & Snapshot Vault:** Save and recall mastering chains and project markers in PostgreSQL / local project bundles.`,
				TechStack: `- **Frontend UI & Viewport:** Vue 3, TypeScript, HTML5 Canvas 2D / WebGL2 Shader Pipeline, Web Audio API AudioWorklet
- **Backend / Local Companion API:** Go (Gin) for preset persistence, waveform peak cache indexing, and FFmpeg batch transcoding worker pool
- **Database:** PostgreSQL for cloud-synced mastering presets, DSP chain templates, and render job history`,
				ArchitectureSpecs: `### Data Models
- **mastering_presets**: id (PK), name, genre_tag, eq_bands (JSONB), limiter_threshold_db (FLOAT), target_lufs (FLOAT), created_at
- **render_jobs**: id (PK), source_filename, sample_rate (INT), bit_depth (INT), preset_id (FK), status (VARCHAR), peak_db (FLOAT)

### REST & Worker Endpoints
- GET /api/v1/dsp-presets -> List factory and user DSP mastering chains
- POST /api/v1/dsp-presets -> Persist custom parametric EQ & limiter curve
- POST /api/v1/render-jobs -> Enqueue asynchronous batch audio normalization job`,
				EdgeCases: `- **Non-Goals:** Multi-track MIDI sequencing or virtual instrument (VSTi) synthesis is out of scope.
- **Memory Ceiling on Large WAV Files:** Never decode multi-gigabyte 96kHz/24-bit WAV files entirely into main-thread JS heap; stream chunked peak mipmaps.
- **Audio Glitches on UI Resize:** Decouple ResizeObserver canvas redraws using requestAnimationFrame and offscreen buffer blitting.`,
			},
			{
				Title:       "Hybrid Local-First Codebase RAG & AST Eval Workbench",
				Category:    "AI Tooling",
				IsPreset:    true,
				Overview:    "An engineering workbench for evaluating LLM prompts against syntax-aware code chunks, comparing Local Ollama models against Cloud BYOK APIs (Gemini, Claude, OpenAI) with deterministic rubric scoring, latency telemetry, and token cost tracking.",
				TargetUsers: "- **AI Systems Engineers:** Building coding assistants and automated PR review pipelines.\n- **Privacy-Conscious Enterprise Developers:** Testing local quantized models (Qwen-2.5-Coder, DeepSeek-Coder) before committing to cloud API spend.",
				CoreFeatures: `- **Dual-Mode AI Provider Router:** Seamless switching between local Ollama/LM Studio endpoints and cloud BYOK APIs via a unified proxy contract.
- **Side-by-Side Prompt Diff & Output Arena:** Execute identical system + user prompt payloads across two models simultaneously and inspect diffed markdown/code output.
- **Deterministic Constraint Verifier:** Automated checks verifying output JSON validity, presence of required code blocks, and forbidden token patterns.
- **Versioned Prompt & Eval Catalog:** Full CRUD persistence of prompt templates, system personas, and benchmark runs.`,
				TechStack: `- **Frontend:** Vue 3 (<script setup lang="ts">), TypeScript, Axios, Custom Diff & Monospace Code Inspector
- **Backend:** Go, Gin Framework, GORM, Unified HTTP AI Proxy with context timeouts and header sanitization
- **Database:** PostgreSQL storing prompt templates, evaluation runs, and latency metrics`,
				ArchitectureSpecs: `### Entities
- **prompt_templates**: id (PK), title, role_category, tech_stack_tags (JSONB), system_role, technical_constraints, compiled_prompt
- **eval_runs**: id (PK), prompt_id (FK), provider, model_name, latency_ms (INT), status_code (INT), output_text (TEXT)

### API Contract
- POST /api/v1/ai/generate -> Unified proxy handling Ollama, OpenAI, Anthropic, and Gemini payload transformations
- GET /api/v1/prompts -> Filterable prompt preset repository`,
				EdgeCases: `- **Non-Goals:** Do not store raw user cloud API keys in plaintext PostgreSQL tables; keep keys in client localStorage and pass ephemerally in request payload/headers.
- **Upstream LLM Timeouts:** Configure a strict 60-second http.Client timeout on the Go proxy and return structured JSON error messages when local Ollama is offline or unreachable.`,
			},
			{
				Title:       "High-Throughput Idempotent Payment Webhook & Ledger Microservice",
				Category:    "REST Microservice",
				IsPreset:    true,
				Overview:    "A mission-critical Go REST microservice that ingests high-volume payment gateway webhooks (Stripe, Adyen, Midtrans), verifies HMAC-SHA256 cryptographic signatures, guarantees exactly-once idempotent processing, and records double-entry ledger entries in PostgreSQL.",
				TargetUsers: "- **Backend & FinTech Platform Engineers:** Requiring zero duplicate charges, auditable double-entry balance sheets, and dead-letter queue replayability.",
				CoreFeatures: `- **Cryptographic Webhook Ingress:** Raw body HMAC-SHA256 verification with timestamp replay-window protection (rejects events older than 300 seconds).
- **Idempotency Barrier:** Unique constraint on (provider, external_event_id) with atomic PostgreSQL INSERT ... ON CONFLICT DO NOTHING semantics.
- **Double-Entry Ledger Engine:** Every state transition writes balanced debit/credit journal lines inside a serializable GORM database transaction.
- **Dead-Letter Replay API:** Inspect failed webhook payloads and trigger manual or automated exponential-backoff retries.`,
				TechStack: `- **Backend:** Go 1.22+, Gin Framework, GORM ORM, pgx/v5 connection pool
- **Database:** PostgreSQL with ACID transactions, row-level SELECT FOR UPDATE locking on account balances
- **Observability:** Structured JSON request logging with correlation X-Request-ID headers`,
				ArchitectureSpecs: `### Database Schema
- **webhook_events**: id (PK), provider, external_event_id (UNIQUE), payload (JSONB), status (PENDING|PROCESSED|FAILED), error_msg, created_at
- **ledger_accounts**: id (PK), owner_id, currency (CHAR(3)), balance_cents (BIGINT), updated_at
- **ledger_entries**: id (PK), transaction_id (UUID), account_id (FK), direction (DEBIT|CREDIT), amount_cents (BIGINT), created_at

### Endpoints
- POST /api/v1/webhooks/:provider -> High-throughput signature-verified event ingestion
- GET /api/v1/ledger/accounts/:id -> Real-time balance & immutable entry history
- POST /api/v1/webhooks/:id/replay -> Re-execute failed webhook event transaction`,
				EdgeCases: `- **Non-Goals:** No end-user checkout UI or credit card PAN storage (strictly PCI-DSS out-of-scope token/event processor).
- **Race Conditions on Burst Webhooks:** Payment gateways often deliver payment_intent.succeeded twice within 10ms; database unique index + row locking must prevent double credit.`,
			},
		}

		for i := range prdPresets {
			prdPresets[i].CompiledMarkdown = CompilePrdMarkdown(&prdPresets[i])
		}

		if err := db.Create(&prdPresets).Error; err != nil {
			return fmt.Errorf("failed to seed PRD presets: %w", err)
		}
		log.Printf("[SEED] Inserted %d PRD Presets.", len(prdPresets))
	}

	var promptCount int64
	if err := db.Model(&models.PromptTemplate{}).Count(&promptCount).Error; err != nil {
		return err
	}

	if promptCount == 0 {
		log.Println("[SEED] Seeding initial Stack-Specific Technical Prompt Presets...")
		promptPresets := []models.PromptTemplate{
			{
				Title:        "Vue 3 + TypeScript High-Craft Obsidian Workspace UI",
				RoleCategory: "Frontend",
				TechStackTags: models.StringSlice{
					"Vue 3 <script setup>",
					"strict TypeScript interfaces",
					"DOM reflow optimization",
					"60fps micro-interactions",
					"Scoped CSS Grid",
				},
				IsPreset:   true,
				SystemRole: "Act as a Principal Frontend UI/UX Architect specializing in Vue 3, strict TypeScript, and high-density developer tools (Linear / Raycast / Vercel aesthetic).",
				TechnicalConstraints: `- Use Vue 3 Composition API with <script setup lang="ts"> and zero implicit 'any' types.
- Enforce dark-mode obsidian surface hierarchy (#090d16 canvas, #0f1623 elevated cards, #1e293b 1px structural borders, #38bdf8 / #10b981 semantic accents).
- Use monospace typography (JetBrains Mono / Fira Code) for all technical identifiers, schemas, and live compilers.`,
				ArchitectureRules: `- Decouple HTTP transport and AI provider routing into dedicated typed service modules (src/services/api.ts, src/services/aiService.ts).
- Use computed properties for live Markdown/Prompt compilation to avoid redundant string re-computation on unrelated state changes.`,
				PointByPointInstructions: `1. Define strict TypeScript interfaces matching all backend JSON payloads before writing component templates.
2. Build responsive split-pane workspace layouts where the left pane houses modular form controls and the right pane renders a sticky live code/markdown preview.
3. Implement optimistic UI feedback, loading skeletons, and non-blocking toast notifications for all CRUD and AI generation operations.
4. Provide instant one-click Copy to Clipboard and Export (.md / .json) actions with visual confirmation states.`,
				EdgeCasesToHandle: `- Prevent double form submissions while async API or LLM requests are in flight.
- Gracefully handle empty database filter results with actionable Empty State cards and quick-reset filters.
- Sanitize and safely format multi-line markdown previews without layout overflow.`,
				OutputFormat: "Return complete, production-ready Vue 3 Single File Components (.vue) and TypeScript service modules with zero placeholders or omitted imports.",
			},
			{
				Title:        "Go + Gin + GORM Clean Architecture REST API & AI Proxy",
				RoleCategory: "Backend",
				TechStackTags: models.StringSlice{
					"Go 1.22+",
					"Gin HTTP Router",
					"GORM preloading & indexing",
					"context cancellation",
					"Layered Clean Architecture",
				},
				IsPreset:   true,
				SystemRole: "Act as a Staff Backend Go Engineer building high-reliability RESTful APIs with Gin, GORM, and PostgreSQL.",
				TechnicalConstraints: `- Structure code cleanly across cmd/, internal/config, internal/models, internal/services, and internal/handlers.
- Use GORM with PostgreSQL driver, parameterized queries, and explicit column tags.
- Configure http.Client with explicit context timeouts (e.g., 60s) for outbound AI proxy requests.`,
				ArchitectureRules: `- Never expose raw database panic traces to HTTP clients; return consistent JSON envelopes: {"data": ..., "error": ...}.
- Ensure CORS middleware properly handles OPTIONS preflight requests and custom headers (Authorization, Content-Type).
- Automatically compile server-side Markdown/Prompt fallbacks if client payload omits pre-compiled text.`,
				PointByPointInstructions: `1. Define GORM models with primary keys, B-Tree indexes on filter columns (category, role_category, is_preset), and JSON serialization tags.
2. Implement database connection initialization, AutoMigrate execution, and idempotent startup seeding for empty tables.
3. Implement full CRUD handlers supporting query string filtering (category, search, role_category, stack, is_preset).
4. Build the unified POST /api/v1/ai/generate proxy service supporting Ollama, LM Studio, OpenAI, Anthropic Claude, and Google Gemini.`,
				EdgeCasesToHandle: `- Validate path :id parameters and return 404 Not Found when records do not exist.
- Handle malformed JSON request bodies with 400 Bad Request and clear validation diagnostics.
- Catch upstream AI provider HTTP 4xx/5xx responses and forward human-readable error details to the frontend.`,
				OutputFormat: "Provide complete, compilable Go source files organized by package with exact module imports and zero unused variables.",
			},
			{
				Title:        "PostgreSQL Schema Optimization & Zero-Downtime Indexing",
				RoleCategory: "Database",
				TechStackTags: models.StringSlice{
					"PostgreSQL 16",
					"GORM AutoMigrate",
					"Composite B-Tree Indexes",
					"JSONB Query Optimization",
					"ACID Transactions",
				},
				IsPreset:   true,
				SystemRole: "Act as a Principal Database Reliability Engineer (DBRE) specializing in PostgreSQL 16 performance tuning and GORM schema design.",
				TechnicalConstraints: `- Target PostgreSQL 16 with UTF-8 encoding and UTC timestamps.
- Avoid N+1 query patterns by utilizing GORM Preload or explicit JOIN projections.
- Use indexed filter columns for high-frequency catalog queries.`,
				ArchitectureRules: `- All state mutations involving multiple tables must execute inside db.Transaction(func(tx *gorm.DB) error { ... }).
- Ensure idempotent seed scripts check record counts before inserting preset fixtures.`,
				PointByPointInstructions: `1. Audit entity structs and add appropriate gorm:"index", gorm:"type:text", and gorm:"not null" annotations.
2. Design composite filter queries using parameterized WHERE clauses (ILIKE for case-insensitive search in PostgreSQL).
3. Provide diagnostic health check queries verifying active database connectivity and table readiness.`,
				EdgeCasesToHandle: `- Handle NULL or empty JSON arrays gracefully via custom sql.Scanner and driver.Valuer implementations.
- Prevent SQL injection by strictly binding all search and filter strings as query parameters.`,
				OutputFormat: "Deliver annotated Go GORM model structs, migration/seeder routines, and optimized query scopes.",
			},
			{
				Title:        "Full-Stack PRD-to-Code Execution Blueprint Compiler",
				RoleCategory: "Fullstack",
				TechStackTags: models.StringSlice{
					"End-to-End Type Safety",
					"RESTful Contract Alignment",
					"Vue 3 + Go Gin",
					"PostgreSQL Persistence",
					"Deterministic Build Verification",
				},
				IsPreset:   true,
				SystemRole: "Act as a Principal Full-Stack Architect translating Product Requirements Documents (PRDs) into synchronized Backend (Go/Gin/GORM) and Frontend (Vue 3/TypeScript) implementations.",
				TechnicalConstraints: `- Guarantee 1:1 field name parity between Go JSON struct tags and TypeScript interface properties.
- Maintain strict separation between backend persistence (PostgreSQL) and frontend presentation (Vue 3).`,
				ArchitectureRules: `- Every feature defined in the PRD Core Features section must map to concrete REST endpoints, database columns, and interactive UI controls.
- Verify both 'go build ./...' and 'vue-tsc --build' pass with zero errors before completion.`,
				PointByPointInstructions: `1. Parse the source PRD Overview, Core Features, Tech Stack, and API Endpoints & Data Models.
2. Implement the Go backend models, seeder fixtures, REST routes, and AI proxy handlers first.
3. Implement the TypeScript API client, state management, and interactive Vue 3 workspace views second.
4. Run full static type-checking and compilation across both stacks.`,
				EdgeCasesToHandle: `- Reconcile port mismatches between Vite dev proxy (/api) and VITE_API_BASE_URL environment variables.
- Ensure preset templates can be cloned or customized without corrupting factory defaults if desired, or edited/deleted with explicit confirmation.`,
				OutputFormat: "Deliver a cohesive, verified full-stack implementation with zero mocked persistence and zero build warnings.",
			},
			{
				Title:        "High-Performance Desktop/Canvas Rendering & Worker Pipeline",
				RoleCategory: "Desktop",
				TechStackTags: models.StringSlice{
					"60fps Frame Budget",
					"OffscreenCanvas / WebGL",
					"Zero-Allocation Render Loop",
					"RequestAnimationFrame Scheduling",
					"Memory Pool Reuse",
				},
				IsPreset:   true,
				SystemRole: "Act as a Systems & Graphics Software Engineer building low-latency interactive viewports and desktop-grade media applications.",
				TechnicalConstraints: `- Maintain a strict <16.6ms frame time budget during continuous pan, zoom, and scrub interactions.
- Avoid garbage collection stalls inside hot render loops by pre-allocating typed arrays (Float32Array / Uint8ClampedArray).`,
				ArchitectureRules: `- Offload heavy parsing, diffing, or signal processing to background workers or backend Go routines.
- Synchronize viewport state changes with dirty-flag invalidation rather than reactive deep-watchers.`,
				PointByPointInstructions: `1. Design a double-buffered viewport renderer with devicePixelRatio scaling for crisp Retina/HiDPI output.
2. Implement spatial indexing / level-of-detail (LOD) decimation so only visible viewport primitives are drawn.
3. Expose deterministic keyboard shortcuts and precision numeric scrubbers for power users.`,
				EdgeCasesToHandle: `- Handle window resize and DPI changes cleanly without stretching or blurring canvas buffers.
- Properly dispose event listeners, animation frame handles, and GPU textures on component unmount.`,
				OutputFormat: "Return modular, high-performance rendering classes and lifecycle-safe UI wrapper components.",
			},
		}

		for i := range promptPresets {
			promptPresets[i].CompiledPrompt = CompileTechnicalPrompt(&promptPresets[i])
		}

		if err := db.Create(&promptPresets).Error; err != nil {
			return fmt.Errorf("failed to seed Prompt presets: %w", err)
		}
		log.Printf("[SEED] Inserted %d Technical Prompt Presets.", len(promptPresets))
	}

	return nil
}
