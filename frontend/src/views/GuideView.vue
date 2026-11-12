<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Check,
  ArrowRight,
  FileText,
  Cpu,
  Terminal,
  Database,
  Layers,
  Sparkles,
  Bot,
  Globe,
  BookOpen,
  RotateCcw,
  Flame,
  ShieldCheck,
} from 'lucide-vue-next'

type GuideTab = 'workflow' | 'features' | 'qa-playbook' | 'blueprint'

const activeTab = ref<GuideTab>('workflow')

interface WorkflowStep {
  step: string
  title: string
  tag: string
  summary: string
  actionLabel: string
  actionRoute?: string
  checklist: string[]
  codeSnippet?: string
}

const workflowSteps: WorkflowStep[] = [
  {
    step: '01',
    title: 'Definisikan Spesifikasi di Blueprint Studio',
    tag: 'Perencanaan Ide',
    summary:
      'Buka menu Blueprint Studio untuk menyusun cetak biru produk. Gunakan Mode Sederhana jika fokus pada kebutuhan produk inti (Overview hingga Metrics), atau beralih ke Mode Lengkap untuk melengkapi 13 seksi arsitektur teknis lengkap (Tech Stack, Data Models, API Contract, NFR, Non-Goals, dan Constraints).',
    actionLabel: 'Buka Blueprint Studio',
    actionRoute: '/prd-studio',
    checklist: [
      'Gunakan Preset (misal B2B SaaS, Micro-SaaS) untuk inspirasi cepat.',
      'Gunakan tombol AI Copilot (✨) pada tiap seksi untuk auto-draft atau memperjelas kebutuhan.',
      'Tulis Data Models dengan format standar: - table_name: id (PK), user_id (FK), name (VARCHAR)...',
      'Tulis API Contract dengan format: METHOD /path -> Deskripsi.',
    ],
    codeSnippet: `// Contoh Format Section 08 (Data Models)
- **users**: id (PK), email (VARCHAR), password_hash, role, created_at
- **workspaces**: id (PK), owner_id (FK), name, slug (UNIQUE)
- **tasks**: id (PK), workspace_id (FK), title, status (VARCHAR), due_date

// Contoh Format Section 09 (API Contract)
POST /api/auth/register -> Registrasi user baru
POST /api/auth/login -> Otentikasi dan penerbitan JWT
GET /api/workspaces -> Daftar workspace user
POST /api/tasks -> Buat task baru di workspace`,
  },
  {
    step: '02',
    title: 'Validasi Kualitas & Diagram Visual Arsitektur',
    tag: 'Validasi Arsitektur',
    summary:
      'Di panel kanan (Preview Pane), periksa indikator kualitas. Buka tab Architecture untuk melihat Diagram Relasi Database (Mermaid ERD) dan pemetaan endpoint API yang di-generate secara otomatis dan deterministik dari teks PRD Anda.',
    actionLabel: 'Review di Preview Pane',
    checklist: [
      'Cek tab Issues untuk memastikan tidak ada seksi kosong atau inkonsistensi arsitektur.',
      'Periksa tab Architecture untuk melihat apakah relasi foreign key antartabel sudah terhubung dengan benar.',
      'Uji coba ekspor dokumen jika ingin membagikan ke stakeholder dalam format Word (.doc) atau PDF.',
    ],
  },
  {
    step: '03',
    title: '1-Click Repo Scaffolding (setup.bat / setup.sh)',
    tag: 'Template Proyek',
    summary:
      'Klik tombol "Scaffold" (ikon terminal) di header Preview Pane. Pilih salah satu dari 10 target framework modern (Go, Python/FastAPI, Rust/Axum, Node/Express, Laravel 11/Blade, Next.js, Firebase, Supabase, Vue 3, atau React 19). Unduh script setup.bat (Windows) atau setup.sh (Linux/macOS).',
    actionLabel: 'Pilih Framework & Unduh Script',
    checklist: [
      'Pilih format: setup.bat untuk pengguna Windows, atau setup.sh untuk Linux/Mac.',
      'Script ini berisi seluruh arsitektur proyek, aturan AI (AGENTS.md, .cursorrules), skema database (schema.sql), spesifikasi REST API (openapi.yaml), test suite otomatis (tests/api.http), dan runner (dev.bat / Makefile).',
    ],
  },
  {
    step: '04',
    title: 'Jalankan Setup Script di Komputer',
    tag: 'Inisialisasi Folder',
    summary:
      'Buat folder baru kosong di laptop Anda, masukkan file setup.bat (atau setup.sh), lalu klik 2x atau jalankan lewat terminal. Dalam 2 detik, seluruh struktur proyek siap pakai langsung terbentuk!',
    actionLabel: 'Double-Click setup.bat',
    checklist: [
      'Script memeriksa runtime (Git, Node.js, Go/Python/Cargo).',
      'Membuat direktori backend, frontend, docs, dan tests secara otomatis.',
      'Menulis semua file arsitektur tanpa bug karakter menggunakan Base64 decoding.',
      'Menginisialisasi Git repository dan membuat commit arsitektur pertama.',
    ],
    codeSnippet: `:: Cara Menjalankan di Windows (Command Prompt / PowerShell)
cd C:\\Projects\\my-new-app
setup.bat

# Cara Menjalankan di Linux / macOS (Terminal)
chmod +x setup.sh
./setup.sh`,
  },
  {
    step: '05',
    title: 'Nyalakan Database Lokal dengan 1 Perintah (dev up)',
    tag: 'Database Lokal',
    summary:
      'Anda tidak perlu pusing menginstall PostgreSQL secara manual di Windows. Cukup ketik perintah satu kata di terminal folder proyek Anda untuk menyalakan database terisolasi beserta web database browser.',
    actionLabel: 'Ketik: dev up',
    checklist: [
      'Ketik "dev up" di terminal proyek Anda (atau "make up" di Linux/Mac).',
      'PostgreSQL 16 otomatis menyala dan meng-import tabel dari schema.sql.',
      'Adminer Web UI otomatis aktif di http://localhost:8080 (buka lewat browser untuk melihat tabel & data).',
      'Jika laptop Anda belum ada Docker: Cukup gunakan mode SQLite lokal tanpa perlu install apapun!',
    ],
    codeSnippet: `:: Shortcut Terminal dev.bat (Windows)
dev up       :: Menyalakan PostgreSQL 16 + Adminer Web UI di Docker
dev down     :: Mematikan container database
dev reset    :: Mengosongkan database & mengulang import schema.sql dari nol
dev test     :: Menjalankan automated test suite api.http`,
  },
  {
    step: '06',
    title: 'Automated Quality Assurance (QC) dengan api.http',
    tag: 'Pengujian API (QA)',
    summary:
      'Buka folder proyek Anda di VS Code atau Cursor. Buka file tests/api.http. Pasang ekstensi gratis "REST Client". Anda bisa langsung menjalankan seluruh skenario pengujian API tanpa perlu membuka Postman yang berat!',
    actionLabel: 'Buka tests/api.http',
    checklist: [
      'Klik tombol "Send Request" di atas tiap endpoint untuk melihat respon JSON dari backend.',
      'Mendukung Chained Token: Login otomatis menangkap JWT token dan memakainya di request selanjutnya.',
      'Mencakup Smoke Test, Negative Case (password lemah), Security Case (akses tanpa token), dan Boundary Test (404 Not Found).',
      'Pelajari dokumen docs/QA_TEST_PLAN.md untuk panduan pengujian standar industri ISTQB & verifikasi SQL.',
    ],
    codeSnippet: `### Contoh Request di tests/api.http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{ "email": "qa_tester@example.com", "password": "Password123!" }

> {%
  client.test("Login sukses dan menghasilkan token", function() {
    client.assert(response.status === 200, "Status bukan 200");
    client.global.set("authToken", response.body.token);
  });
%}`,
  },
  {
    step: '07',
    title: 'Coding dengan AI Coding Agents (Anti-Halusinasi)',
    tag: 'Coding Bersama AI',
    summary:
      'Gunakan Antigravity, Cursor, atau Claude Code untuk mulai coding. Karena file AGENTS.md dan .cursorrules sudah tertanam di root proyek, AI akan mematuhi batas arsitektur, skema database, dan rute API yang Anda buat di PRD tanpa menciptakan bug halusinasi.',
    actionLabel: 'Buka Cursor / Antigravity',
    checklist: [
      'Buka proyek di Cursor (Ctrl+L / Cmd+K) atau Antigravity AI.',
      'AI otomatis membaca AGENTS.md dan .cursorrules sebagai instruksi utama.',
      'Minta AI mengimplementasikan endpoint atau komponen sesuai spesifikasi di README.md dan openapi.yaml.',
    ],
  },
]

interface BlueprintStep {
  id: string
  stepNumber: string
  title: string
  category: string
  summary: string
  keyQuestions: string[]
  architecturalOutput: string
  codeChecklist: string[]
}

const blueprintSteps: BlueprintStep[] = [
  {
    id: 'core-loop',
    stepNumber: '01',
    title: 'Core loop validation & state flow',
    category: 'System dynamics',
    summary:
      'Before writing a single component or database table, lock down the atomic state loop: user trigger to API contract to persistence mutation to deterministic UI feedback.',
    keyQuestions: [
      'What is the single primary entity the user creates, mutates, or compiles in under 60 seconds?',
      'Which state lives in PostgreSQL (durable persistence) versus Pinia or localStorage (ephemeral session)?',
      'How does the interface behave when an upstream LLM or external service takes 15 seconds to respond?',
    ],
    architecturalOutput: `[Trigger: User Clicks "Compile & Persist PRD"]
   ├──> 1. Client Validator: Verify non-empty title, category, and markdown synthesis
   ├──> 2. REST Transport: POST /api/v1/prds (JSON payload + content-type application/json)
   ├──> 3. Database Write: INSERT INTO prd_documents RETURNING id, created_at
   └──> 4. UI State Sync: Prepend record to reactive table + trigger toast confirmation`,
    codeChecklist: [
      'Explicit request and response TypeScript interfaces',
      'Idempotent database writes returning auto-incrementing primary key',
      'Optimistic or loading-locked button states with elapsed time indicators',
    ],
  },
  {
    id: 'scope-nongoals',
    stepNumber: '02',
    title: 'Strict scope vs. explicit non-goals',
    category: 'Boundary control',
    summary:
      'Scope creep and ambiguous AI code generation happen when boundaries are left implicit. Every production PRD must declare explicit non-goals and architectural constraints.',
    keyQuestions: [
      'Which features are strictly excluded from v1 to protect core reliability?',
      'Which external dependencies are prohibited (e.g. no unapproved CSS frameworks, no SQLite inside frontend)?',
      'What are the hard latency, security, and CORS boundaries?',
    ],
    architecturalOutput: `IN-SCOPE (v1 Production Release):
- Full PostgreSQL CRUD for PRDs and stack-aware technical prompts
- Hybrid AI routing (local Ollama/LM Studio + cloud BYOK proxy)
- Live split-pane markdown and prompt compiler with .md and .json export

EXPLICIT NON-GOALS (Out of Scope):
- Multi-user OAuth billing subscriptions in v1
- Storing plaintext cloud API keys inside PostgreSQL tables
- Generic decorative styling or third-party UI library bloat`,
    codeChecklist: [
      'Documented non-goals section in every generated PRD',
      'Zero unauthorized npm or Go module bloat',
      'Strict directory boundary isolation between frontend/ and backend/',
    ],
  },
  {
    id: 'schema-design',
    stepNumber: '03',
    title: 'Data schema & REST contract design',
    category: 'Data topology',
    summary:
      'Align struct tags, column types, REST query parameters, and TypeScript interfaces with 1:1 naming parity before implementing views.',
    keyQuestions: [
      'Do all JSON tags (snake_case) match the TypeScript interface properties?',
      'Are high-frequency filter columns (category, role_category, is_preset) indexed?',
      'How are array and JSONB fields scanned and valued safely across drivers?',
    ],
    architecturalOutput: `// Backend Model <-> Frontend TypeScript Interface 1:1 Parity
type PrdDocument struct {
    ID                uint   \`json:"id" gorm:"primaryKey"\`
    Title             string \`json:"title" gorm:"type:varchar(255);not null"\`
    Category          string \`json:"category" gorm:"type:varchar(100);index;not null"\`
    IsPreset          bool   \`json:"is_preset" gorm:"default:false;index"\`
    CompiledMarkdown  string \`json:"compiled_markdown" gorm:"type:text"\`
}`,
    codeChecklist: [
      '1:1 snake_case JSON serialization contract across all tiers',
      'Database migration with idempotent deterministic startup seeder',
      'Parameterized database search and category scopes',
    ],
  },
]

const activeStepId = ref<string>('core-loop')
const activeStep = ref<BlueprintStep>(blueprintSteps[0]!)

const selectStep = (step: BlueprintStep) => {
  activeStepId.value = step.id
  activeStep.value = step
}
</script>

<template>
  <div class="guide-page">
    <!-- Top Hero Header -->
    <header class="guide-header">
      <div class="eyebrow font-mono">
        PANDUAN LENGKAP PENGGUNA
      </div>
      <h1 class="page-title font-serif">
        Panduan Penggunaan BlueprintDev
      </h1>
      <p class="page-desc">
        BlueprintDev membantu Anda mengubah ide produk menjadi dokumen spesifikasi lengkap, template proyek siap pakai, dan pengujian otomatis tanpa kerumitan teknis.
      </p>

      <!-- Navigation Tabs -->
      <div class="guide-tabs-bar">
        <button
          type="button"
          class="guide-tab-btn"
          :class="{ active: activeTab === 'workflow' }"
          @click="activeTab = 'workflow'"
        >
          <Sparkles :size="14" />
          <span>Alur Kerja 7 Langkah</span>
        </button>

        <button
          type="button"
          class="guide-tab-btn"
          :class="{ active: activeTab === 'features' }"
          @click="activeTab = 'features'"
        >
          <Layers :size="14" />
          <span>Fitur Utama</span>
        </button>

        <button
          type="button"
          class="guide-tab-btn"
          :class="{ active: activeTab === 'qa-playbook' }"
          @click="activeTab = 'qa-playbook'"
        >
          <Terminal :size="14" />
          <span>Panduan Pengujian (QA)</span>
        </button>

        <button
          type="button"
          class="guide-tab-btn"
          :class="{ active: activeTab === 'blueprint' }"
          @click="activeTab = 'blueprint'"
        >
          <BookOpen :size="14" />
          <span>Prinsip Arsitektur</span>
        </button>
      </div>
    </header>

    <!-- TAB 1: MASTER WORKFLOW -->
    <section v-if="activeTab === 'workflow'" class="tab-content-section">
      <div class="section-meta">
        <span class="sub-label font-mono">Alur Kerja Praktis</span>
        <h2 class="sub-title font-serif">
          Dari Ide hingga Aplikasi Siap Pakai
        </h2>
        <p class="sub-desc">
          Ikuti 7 langkah ini setiap kali Anda ingin membangun aplikasi atau backend baru secara terstruktur:
        </p>
      </div>

      <div class="workflow-journey">
        <div
          v-for="(item, idx) in workflowSteps"
          :key="idx"
          class="workflow-card"
        >
          <div class="workflow-card-sidebar">
            <span class="wf-number font-serif">{{ item.step }}</span>
            <span class="wf-line"></span>
          </div>

          <div class="workflow-card-main">
            <div class="wf-header">
              <span class="wf-tag font-mono">{{ item.tag }}</span>
              <h3 class="wf-title font-serif">{{ item.title }}</h3>
            </div>

            <p class="wf-summary">{{ item.summary }}</p>

            <!-- Action Checklist -->
            <div class="wf-checklist-box">
              <span class="wf-check-label font-mono">LANGKAH OPERASIONAL:</span>
              <ul class="wf-check-items">
                <li v-for="(check, cIdx) in item.checklist" :key="cIdx" class="wf-check-item">
                  <Check :size="13" class="text-ok" />
                  <span>{{ check }}</span>
                </li>
              </ul>
            </div>

            <!-- Code Snippet (if available) -->
            <div v-if="item.codeSnippet" class="wf-code-box">
              <pre class="font-mono"><code>{{ item.codeSnippet }}</code></pre>
            </div>

            <!-- Action Link Button -->
            <div v-if="item.actionRoute" class="wf-footer-action">
              <RouterLink :to="item.actionRoute" class="btn-secondary btn-sm font-mono">
                <span>{{ item.actionLabel }}</span>
                <ArrowRight :size="12" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 2: FEATURES & MODULES -->
    <section v-else-if="activeTab === 'features'" class="tab-content-section">
      <div class="section-meta">
        <span class="sub-label font-mono">Modul &amp; Tool Capabilities</span>
        <h2 class="sub-title font-serif">
          Penjelasan Fitur Utama di BlueprintDev
        </h2>
      </div>

      <div class="features-grid">
        <!-- Feature 1: Blueprint Studio -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <FileText :size="20" />
          </div>
          <h3 class="feat-title font-serif">Blueprint Studio Editor (13 Seksi)</h3>
          <p class="feat-desc">
            Editor split-pane untuk menulis spesifikasi produk dan teknis. Dilengkapi mode <strong>Sederhana</strong> (fokus produk bagi non-teknikal) dan mode <strong>Lengkap</strong> (13 seksi lengkap mencakup arsitektur teknis).
          </p>
          <ul class="feat-list font-mono">
            <li>• Auto-linting indikator kualitas real-time</li>
            <li>• AI Copilot Drafting pada tiap seksi</li>
            <li>• Ekspor ke Markdown (.md), Word (.doc), &amp; PDF</li>
          </ul>
        </div>

        <!-- Feature 2: Visual Architecture -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Database :size="20" />
          </div>
          <h3 class="feat-title font-serif">Visual Architecture Engine</h3>
          <p class="feat-desc">
            Parser deterministik yang membaca teks tabel database di Seksi 08 dan rute API di Seksi 09, lalu otomatis merender <strong>Diagram Relasi Entitas (Mermaid ERD)</strong> interaktif dan rute endpoints.
          </p>
          <ul class="feat-list font-mono">
            <li>• Deteksi Primary Key (PK) &amp; Foreign Key (FK)</li>
            <li>• Relasi one-to-many otomatis</li>
            <li>• Preview kode Mermaid siap copy-paste</li>
          </ul>
        </div>

        <!-- Feature 3: AI Directives Exporter -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Bot :size="20" />
          </div>
          <h3 class="feat-title font-serif">AI Agent Directives Generator</h3>
          <p class="feat-desc">
            Menerjemahkan seluruh isi PRD menjadi file aturan instruksi yang dipatuhi oleh AI Coding Assistants modern agar tidak keluar jalur arsitektur saat coding.
          </p>
          <ul class="feat-list font-mono">
            <li>• AGENTS.md (Antigravity &amp; CLI directives)</li>
            <li>• .cursorrules (Cursor IDE Agent rules)</li>
            <li>• .github/copilot-instructions.md (GitHub Copilot)</li>
          </ul>
        </div>

        <!-- Feature 4: 1-Click Scaffolder -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Terminal :size="20" />
          </div>
          <h3 class="feat-title font-serif">1-Click Scaffolder (setup.bat / .sh)</h3>
          <p class="feat-desc">
            Menghasilkan executable batch script untuk Windows dan shell script untuk Linux/macOS yang menginjeksi seluruh folder arsitektur, spesifikasi, dan menginisialisasi Git repository.
          </p>
          <ul class="feat-list font-mono">
            <li>• 9 Target Framework (Go, Python, Rust, Node, Next.js, dll)</li>
            <li>• Base64 encoding anti-bug escaping Windows</li>
            <li>• Auto-git commit arsitektural pertama</li>
          </ul>
        </div>

        <!-- Feature 5: API Specification -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Globe :size="20" />
          </div>
          <h3 class="feat-title font-serif">OpenAPI 3.1 &amp; Postman v2.1</h3>
          <p class="feat-desc">
            Secara otomatis menghasilkan dokumen spesifikasi REST API standar OpenAPI 3.1 YAML dan Postman Collection yang siap di-import ke Postman / Bruno / Insomnia.
          </p>
          <ul class="feat-list font-mono">
            <li>• 1-Click Download openapi.yaml</li>
            <li>• 1-Click Download postman.json</li>
            <li>• Dokumentasi schema request &amp; response lengkap</li>
          </ul>
        </div>

        <!-- Feature 6: Prompt Compiler -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Cpu :size="20" />
          </div>
          <h3 class="feat-title font-serif">Prompt Compiler Engine</h3>
          <p class="feat-desc">
            Menyusun prompt teknis tingkat Senior/Principal Developer dengan menyuntikkan lexicon teknis khusus stack pilihan, guardrails negatif, dan format output yang ketat.
          </p>
          <ul class="feat-list font-mono">
            <li>• Pilihan persona Principal vs Staff Engineer</li>
            <li>• Negative guardrails (anti dependency liar)</li>
            <li>• Ekspor ke format Prompt .md dan .json</li>
          </ul>
        </div>

        <!-- Feature 7: Reverse Blueprint Engine -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <RotateCcw :size="20" />
          </div>
          <h3 class="feat-title font-serif">Reverse Blueprint Engine</h3>
          <p class="feat-desc">
            Impor skema database SQL DDL, Prisma schema, OpenAPI YAML/JSON, atau Docker Compose untuk diubah secara otomatis menjadi 13 seksi Blueprint arsitektural lengkap.
          </p>
          <ul class="feat-list font-mono">
            <li>• Ekstraksi tabel database relasional (PK &amp; FK)</li>
            <li>• Auto-generate rute RESTful CRUD API Contract</li>
            <li>• 1-Click integrasi ke Blueprint Studio</li>
          </ul>
        </div>

        <!-- Feature 8: Specialist SKILL.md Generator -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <ShieldCheck :size="20" />
          </div>
          <h3 class="feat-title font-serif">Specialist SKILL.md Generator</h3>
          <p class="feat-desc">
            Generator instruksi berstandar Agent Skill resmi (YAML frontmatter) yang dirancang khusus untuk 5 peran spesialis tim rekayasa software.
          </p>
          <ul class="feat-list font-mono">
            <li>• Frontend (FE) &amp; Backend (BE) Architect</li>
            <li>• QA &amp; Test Automation Specialist</li>
            <li>• DevOps &amp; SRE Cloud Engineer</li>
            <li>• Principal Fullstack Architect</li>
          </ul>
        </div>

        <!-- Feature 9: Grill My Architecture -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Flame :size="20" />
          </div>
          <h3 class="feat-title font-serif">Grill My Architecture Stress-Tester</h3>
          <p class="feat-desc">
            Mesin simulasi beban tinggi (50.000+ RPS) yang mendeteksi bottleneck konkurensi, database locking, SPOF, dan kerentanan keamanan dengan skor ketahanan dan 1-click auto-hardening.
          </p>
          <ul class="feat-list font-mono">
            <li>• Resiliency Index 0-100 &amp; Predikat Grade</li>
            <li>• Identifikasi Thundering Herd &amp; Unbounded Query</li>
            <li>• 1-Click "Terapkan Solusi ke Blueprint"</li>
          </ul>
        </div>

        <!-- Feature 10: Contract-First Mock API & MSW -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <Zap :size="20" />
          </div>
          <h3 class="feat-title font-serif">Contract-First Mock API &amp; MSW</h3>
          <p class="feat-desc">
            Simulator endpoint API interaktif langsung di browser dan generator server Express lokal (mock-server.js) serta handler MSW (Mock Service Worker) untuk mempercepat kerja paralel Frontend dan Backend.
          </p>
          <ul class="feat-list font-mono">
            <li>• In-browser endpoint testing dengan fake payload</li>
            <li>• 1-Click Export mock-server.js (Node.js)</li>
            <li>• 1-Click Export handlers.ts (MSW untuk Vitest/React/Vue)</li>
          </ul>
        </div>

        <!-- Feature 11: Architecture Decision Records (ADR) -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <FileText :size="20" />
          </div>
          <h3 class="feat-title font-serif">Architecture Decision Records (ADR)</h3>
          <p class="feat-desc">
            Otomatis menyusun rangkaian dokumen ADR berstandar resmi MADR / Michael Nygard yang mendokumentasikan alasan pemilihan stack, database, otentikasi, dan caching beserta trade-offs.
          </p>
          <ul class="feat-list font-mono">
            <li>• Standar tata kelola arsitektur Google &amp; Spotify</li>
            <li>• Dokumen Context, Decision, Positif &amp; Negatif trade-offs</li>
            <li>• Siap diintegrasikan ke direktori docs/adr/*.md</li>
          </ul>
        </div>

        <!-- Feature 12: Production Readiness Review (PRR Gate) -->
        <div class="feature-card">
          <div class="feat-icon-box">
            <ShieldCheck :size="20" />
          </div>
          <h3 class="feat-title font-serif">Production Readiness Review (PRR Gate)</h3>
          <p class="feat-desc">
            Audit SRE berbasis 4 pilar (Keamanan, Keandalan DR, Observabilitas, dan Performa Database) sebelum Go-Live dengan otorisasi peluncuran dan dokumen sign-off resmi.
          </p>
          <ul class="feat-list font-mono">
            <li>• Standar kesiapan produksi Google SRE</li>
            <li>• Skor Kesiapan 0-100 &amp; Status Ready/Blocked</li>
            <li>• 1-Click Export PRODUCTION_READINESS_REVIEW.md</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- TAB 3: QA & DEV RUNNER PLAYBOOK -->
    <section v-else-if="activeTab === 'qa-playbook'" class="tab-content-section">
      <div class="section-meta">
        <span class="sub-label font-mono">Quality Assurance &amp; Terminal Workflow</span>
        <h2 class="sub-title font-serif">
          Panduan Praktis Quality Assurance &amp; Dev Runner
        </h2>
        <p class="sub-desc">
          Cara mudah menguji aplikasi secara mandiri (Self-QC) dan mengontrol lingkungan database lokal dengan 1 perintah:
        </p>
      </div>

      <div class="qa-grid">
        <!-- QA Card: tests/api.http -->
        <div class="qa-card">
          <div class="qa-card-header">
            <span class="qa-badge font-mono">IN-EDITOR API TESTER</span>
            <h3 class="qa-title font-serif">Cara Menggunakan tests/api.http</h3>
          </div>
          <p class="qa-text">
            File <code>tests/api.http</code> adalah pengujian API otomatis pengganti Postman yang sangat ringan dan dijalankan langsung dari dalam editor VS Code atau Cursor.
          </p>
          <ol class="qa-steps">
            <li>Di VS Code / Cursor, buka tab Extensions (Ctrl+Shift+X) lalu pasang ekstensi <strong>REST Client</strong> (oleh Huachao Mao).</li>
            <li>Buka file <code>tests/api.http</code> di folder proyek Anda.</li>
            <li>Di atas setiap request (misal <code>POST /api/auth/login</code>), akan muncul teks kecil <strong>Send Request</strong>.</li>
            <li>Klik <strong>Send Request</strong>. Panel sebelah kanan akan langsung menampilkan response JSON dari backend dan checklist assertions hijau/merah.</li>
            <li><strong>Chained Token:</strong> Saat Anda menjalankan request login, token JWT otomatis disimpan ke variabel <code v-pre>{{authToken}}</code> dan otomatis dipakai di request selanjutnya tanpa copy-paste manual!</li>
          </ol>
        </div>

        <!-- QA Card: docs/QA_TEST_PLAN.md -->
        <div class="qa-card">
          <div class="qa-card-header">
            <span class="qa-badge font-mono">MASTER TEST PLAN</span>
            <h3 class="qa-title font-serif">Cara Menggunakan docs/QA_TEST_PLAN.md</h3>
          </div>
          <p class="qa-text">
            Dokumen rencana pengujian mutu berstandar industri <strong>ISTQB / IEEE 829</strong> yang menyajikan:
          </p>
          <ul class="qa-checklist">
            <li><strong>Tabel Master Test Cases:</strong> Mencakup pengujian Happy Path, Boundary Value Analysis (BVA), dan Negative Security untuk setiap fitur PRD Anda.</li>
            <li><strong>Database Validation Ledger:</strong> Kumpulan query SQL untuk memverifikasi apakah password user benar-benar ter-hash, foreign key tidak ada yang yatim (orphan records), dan status order konsisten di database.</li>
            <li><strong>Template Bug Report:</strong> Format standar laporan bug (Severity, Steps to Reproduce, Expected vs Actual) untuk Jira atau GitHub Issues.</li>
            <li><strong>UAT Sign-off Matrix:</strong> Lembar persetujuan klien sebelum aplikasi siap di-deploy ke production.</li>
          </ul>
        </div>

        <!-- Dev Runner Card: dev.bat & Makefile -->
        <div class="qa-card full-width">
          <div class="qa-card-header">
            <span class="qa-badge font-mono">1-COMMAND DEV RUNNER</span>
            <h3 class="qa-title font-serif">Daftar Perintah Cepat dev.bat (Windows) &amp; Makefile (Linux/Mac)</h3>
          </div>
          <p class="qa-text">
            Lupakan perintah terminal yang panjang dan membingungkan. Gunakan shortcut ini di terminal proyek:
          </p>
          <div class="command-table-box">
            <table class="command-table font-mono">
              <thead>
                <tr>
                  <th>Windows CMD</th>
                  <th>Linux / macOS</th>
                  <th>Fungsi Perintah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="cmd-code">dev up</td>
                  <td class="cmd-code">make up</td>
                  <td>Menyalakan database PostgreSQL 16 &amp; Adminer Web UI di Docker</td>
                </tr>
                <tr>
                  <td class="cmd-code">dev down</td>
                  <td class="cmd-code">make down</td>
                  <td>Mematikan container database Docker untuk menghemat memori laptop</td>
                </tr>
                <tr>
                  <td class="cmd-code">dev test</td>
                  <td class="cmd-code">make test</td>
                  <td>Menjalankan seluruh skenario tes API otomatis di tests/api.http</td>
                </tr>
                <tr>
                  <td class="cmd-code">dev reset</td>
                  <td class="cmd-code">make reset</td>
                  <td>Membersihkan volume database dan mengulang import schema.sql dari nol</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="tip-box font-mono">
            💡 <strong>Akses Database Viewer di Browser:</strong> Buka <code>http://localhost:8080</code>. Sistem: PostgreSQL, Server: postgres, User: devuser, Pass: devpassword. Anda bisa melihat isi tabel database tanpa install aplikasi berat seperti DBeaver atau pgAdmin!
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: BLUEPRINT THEORY & ANATOMY -->
    <section v-else-if="activeTab === 'blueprint'" class="tab-content-section">
      <div class="section-meta">
        <span class="sub-label font-mono">Pillar methodology</span>
        <h2 class="sub-title font-serif">
          The Three Pillars of a Production Blueprint
        </h2>
        <p class="sub-desc">
          Dokumen PRD bukan sekadar catatan ide, melainkan kontrak arsitektur yang memberikan batasan deterministik bagi AI coding agent dan tim engineer:
        </p>
      </div>

      <!-- Pillar Navigation Strip -->
      <div class="pillar-nav-grid">
        <button
          v-for="step in blueprintSteps"
          :key="step.id"
          type="button"
          class="pillar-nav-btn"
          :class="{ active: activeStepId === step.id }"
          @click="selectStep(step)"
        >
          <div class="btn-top">
            <span class="step-num font-serif">{{ step.stepNumber }}</span>
            <span class="step-cat font-mono">{{ step.category }}</span>
          </div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-summary">{{ step.summary }}</p>
        </button>
      </div>

      <!-- Active Pillar Detailed View (8/4 Asymmetric Grid) -->
      <div class="pillar-detail-card">
        <!-- Left: Questions & Checklist -->
        <div class="detail-left">
          <div class="detail-header">
            <span class="large-num font-serif">{{ activeStep.stepNumber }}</span>
            <div>
              <span class="cat-tag font-mono">{{ activeStep.category }}</span>
              <h3 class="active-title font-serif">{{ activeStep.title }}</h3>
            </div>
          </div>

          <p class="summary-text">{{ activeStep.summary }}</p>

          <!-- Key Questions -->
          <div class="list-block">
            <h4 class="list-title">Critical questions to answer in the specification</h4>
            <ul class="clean-list">
              <li
                v-for="(q, i) in activeStep.keyQuestions"
                :key="i"
                class="list-item"
              >
                <span class="dash">—</span>
                <span>{{ q }}</span>
              </li>
            </ul>
          </div>

          <!-- Code Verification Checklist -->
          <div class="list-block border-top">
            <h4 class="list-title">Implementation verification checklist</h4>
            <div class="check-list">
              <div
                v-for="(item, i) in activeStep.codeChecklist"
                :key="i"
                class="check-item"
              >
                <Check :size="13" class="check-icon" />
                <span>{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Concrete Architectural Artifact Output -->
        <div class="detail-right">
          <div class="artifact-bar">
            <span class="artifact-title">Contract output artifact</span>
            <span class="artifact-meta font-mono">Deterministic spec</span>
          </div>
          <pre class="code-box font-mono"><code>{{ activeStep.architecturalOutput }}</code></pre>
        </div>
      </div>
    </section>

    <!-- Bottom Workflow CTA Strip -->
    <section class="cta-strip">
      <div>
        <h3 class="cta-heading font-serif">Siap Merancang Aplikasi Web Anda?</h3>
        <p class="cta-sub">
          Buka Blueprint Studio sekarang untuk menyusun spesifikasi, men-generate arsitektur repo, dan mengotomatisasi pengujian QA Anda.
        </p>
      </div>

      <div class="cta-actions">
        <RouterLink to="/prd-studio" class="btn-primary">
          <span>Buka Blueprint Studio</span>
          <ArrowRight :size="14" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.guide-page {
  display: flex;
  flex-direction: column;
  gap: 36px;
  max-width: 1200px;
  margin: 0 auto;
}

.guide-header {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--rule);
}

.eyebrow {
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.page-title {
  font-size: 36px;
  line-height: 1.15;
  color: var(--text);
  margin: 0;
}

.page-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  max-width: 78ch;
  margin: 10px 0 0;
}

/* Tabs Bar */
.guide-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.guide-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--rule);
  background: var(--surface);
  color: var(--text-2);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
}

.guide-tab-btn:hover {
  border-color: var(--rule-strong);
  color: var(--text);
  background-color: var(--hover);
}

.guide-tab-btn.active {
  background-color: var(--elevated);
  border-color: var(--accent);
  color: var(--text);
}

.tab-content-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-label {
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.06em;
}

.sub-title {
  font-size: 24px;
  color: var(--text);
  margin: 0;
}

.sub-desc {
  font-size: 14px;
  color: var(--text-2);
  margin: 0;
}

/* Tab 1: Workflow Journey */
.workflow-journey {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-card {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 16px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 20px;
  transition: border-color 0.12s ease;
}

.workflow-card:hover {
  border-color: var(--rule-strong);
}

.workflow-card-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wf-number {
  font-size: 28px;
  color: var(--accent);
  line-height: 1;
}

.wf-line {
  flex: 1;
  width: 1px;
  background-color: var(--rule);
  margin-top: 10px;
  margin-bottom: 6px;
}

.workflow-card-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wf-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wf-tag {
  font-size: 11px;
  color: var(--text-3);
  letter-spacing: 0.04em;
}

.wf-title {
  font-size: 19px;
  color: var(--text);
  margin: 0;
}

.wf-summary {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}

.wf-checklist-box {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wf-check-label {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 0.06em;
}

.wf-check-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wf-check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.45;
}

.wf-code-box {
  background-color: #08090a;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 12px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-2);
  overflow-x: auto;
}

.wf-footer-action {
  margin-top: 4px;
}

/* Tab 2: Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feat-icon-box {
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.feat-title {
  font-size: 16px;
  color: var(--text);
  margin: 0;
}

.feat-desc {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
  flex: 1;
}

.feat-list {
  list-style: none;
  padding: 8px 10px;
  margin: 0;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 11px;
  color: var(--text-3);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Tab 3: QA Grid */
.qa-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 860px) {
  .qa-grid {
    grid-template-columns: 1fr;
  }
}

.qa-card {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-card.full-width {
  grid-column: 1 / -1;
}

.qa-card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qa-badge {
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 0.06em;
}

.qa-title {
  font-size: 18px;
  color: var(--text);
  margin: 0;
}

.qa-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}

.qa-steps {
  padding-left: 18px;
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-2);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qa-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-2);
}

.command-table-box {
  overflow-x: auto;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.command-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.command-table th {
  background-color: var(--elevated);
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--text-3);
  font-weight: 500;
}

.command-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--text-2);
}

.command-table tr:last-child td {
  border-bottom: none;
}

.cmd-code {
  color: var(--accent);
  font-weight: 600;
}

.tip-box {
  background-color: var(--elevated);
  border-left: 2px solid var(--accent);
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
  border-radius: 0 var(--radius) var(--radius) 0;
}

/* Tab 4: Blueprint Theory */
.pillar-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 860px) {
  .pillar-nav-grid {
    grid-template-columns: 1fr;
  }
}

.pillar-nav-btn {
  padding: 16px;
  text-align: left;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  cursor: pointer;
  transition: border-color 0.12s ease;
}

.pillar-nav-btn:hover {
  border-color: var(--rule-strong);
}

.pillar-nav-btn.active {
  border-color: var(--accent);
}

.btn-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.step-num {
  font-size: 24px;
  color: var(--accent);
}

.step-cat {
  font-size: 11px;
  color: var(--text-3);
}

.step-title {
  font-size: 15px;
  color: var(--text);
  margin: 0 0 6px;
}

.step-summary {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
  margin: 0;
}

.pillar-detail-card {
  display: grid;
  grid-template-columns: 7fr 5fr;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  overflow: hidden;
}

@media (max-width: 960px) {
  .pillar-detail-card {
    grid-template-columns: 1fr;
  }
}

.detail-left {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.large-num {
  font-size: 40px;
  color: var(--accent);
  line-height: 1;
}

.cat-tag {
  font-size: 11px;
  color: var(--text-3);
  display: block;
}

.active-title {
  font-size: 20px;
  color: var(--text);
  margin: 2px 0 0;
}

.summary-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}

.list-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.border-top {
  padding-top: 16px;
  border-top: 1px solid var(--rule);
}

.list-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  margin: 0;
}

.clean-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
}

.dash {
  color: var(--text-3);
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.check-icon {
  color: var(--accent);
  flex-shrink: 0;
}

.detail-right {
  background-color: var(--elevated);
  border-left: 1px solid var(--rule);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.artifact-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
}

.artifact-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.artifact-meta {
  font-size: 11px;
  color: var(--text-3);
}

.code-box {
  background-color: #08090a;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 14px;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text-2);
  overflow-x: auto;
  margin: 0;
  flex: 1;
}

/* Bottom CTA */
.cta-strip {
  padding: 24px;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.cta-heading {
  font-size: 20px;
  color: var(--text);
  margin: 0;
}

.cta-sub {
  font-size: 13px;
  color: var(--text-3);
  margin: 4px 0 0;
}

.cta-actions {
  flex-shrink: 0;
}
</style>
