<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  ShieldCheck,
  FileText,
  Zap,
  Check,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Play,
  Flame,
  RotateCcw,
  Terminal,
  ArrowRight,
} from 'lucide-vue-next'
import { useBlueprintStore } from '@/stores/blueprintStore'
import {
  evaluateProductionReadiness,
  downloadPrrDocument,
  type PrrReport,
} from '@/lib/prd/prrAudit'
import {
  generateAdrSuite,
  downloadAdrFile,
  type AdrRecord,
} from '@/lib/prd/adrGenerator'
import {
  parseEndpoints,
  generateMockPayload,
  generateMockServerJs,
  generateMswHandlersTs,
  downloadMockFile,
  type ParsedEndpoint,
} from '@/lib/prd/mockApiEngine'
import {
  grillArchitecture,
  applyGrillFixesToModel,
} from '@/lib/prd/grillArchitect'
import ReverseBlueprintModal from '@/components/prd/ReverseBlueprintModal.vue'
import ScaffoldModal from '@/components/prd/ScaffoldModal.vue'

const route = useRoute()
const blueprintStore = useBlueprintStore()
const model = computed(() => blueprintStore.activeModel)

// Active Tab
type OpsTab = 'prr' | 'adr' | 'mock' | 'grill' | 'reverse'
const activeTab = ref<OpsTab>((route.query.tab as OpsTab) || 'prr')

const copiedNotice = ref<string | null>(null)
const toastMessage = ref<string | null>(null)

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = null
    }
  }, 3500)
}

function handleCopyText(text: string, label: string) {
  navigator.clipboard.writeText(text)
  copiedNotice.value = label
  showToast(`Tersalin ke clipboard: ${label}`)
  setTimeout(() => {
    if (copiedNotice.value === label) {
      copiedNotice.value = null
    }
  }, 2000)
}

// -------------------------------------------------------------
// TAB 1: PRODUCTION READINESS REVIEW (PRR)
// -------------------------------------------------------------
const prrReport = computed<PrrReport>(() => evaluateProductionReadiness(model.value))

function handleDownloadPrr() {
  downloadPrrDocument(prrReport.value, model.value)
  showToast('Dokumen PRODUCTION_READINESS_REVIEW.md berhasil diunduh.')
}

// -------------------------------------------------------------
// TAB 2: ARCHITECTURE DECISION RECORDS (ADR)
// -------------------------------------------------------------
const adrList = computed<AdrRecord[]>(() => generateAdrSuite(model.value))
const selectedAdrId = ref<string>('adr-0001')
const activeAdr = computed(() => {
  return adrList.value.find((a) => a.id === selectedAdrId.value) || adrList.value[0]!
})

function handleDownloadActiveAdr() {
  downloadAdrFile(activeAdr.value)
  showToast(`Dokumen ${activeAdr.value.filename} berhasil diunduh.`)
}

// -------------------------------------------------------------
// TAB 3: CONTRACT-FIRST MOCK API SANDBOX
// -------------------------------------------------------------
const endpoints = computed<ParsedEndpoint[]>(() => parseEndpoints(model.value.api_contract))
const selectedEndpointId = ref<string>('')

// Initialize first endpoint if available
if (endpoints.value.length > 0 && endpoints.value[0]) {
  selectedEndpointId.value = endpoints.value[0].id
}

const activeEndpoint = computed<ParsedEndpoint>(() => {
  return endpoints.value.find((e) => e.id === selectedEndpointId.value) || endpoints.value[0]!
})

const activeMockPayload = computed(() => {
  if (!activeEndpoint.value) return {}
  return generateMockPayload(activeEndpoint.value)
})

const mockJsonFormatted = computed(() => {
  return JSON.stringify(activeMockPayload.value, null, 2)
})

const isSimulatingRequest = ref(false)
const lastSimulatedAt = ref<string | null>(null)
const simulatedLatency = ref<number>(64)

function simulateMockCall() {
  isSimulatingRequest.value = true
  simulatedLatency.value = Math.floor(Math.random() * 45 + 35)
  setTimeout(() => {
    isSimulatingRequest.value = false
    lastSimulatedAt.value = new Date().toLocaleTimeString()
    showToast(`200 OK — ${activeEndpoint.value.method} ${activeEndpoint.value.path} (${simulatedLatency.value}ms)`)
  }, simulatedLatency.value)
}

function handleDownloadMockServer() {
  const code = generateMockServerJs(model.value)
  downloadMockFile(code, 'mock-server.js', 'application/javascript')
  showToast('mock-server.js (Express) berhasil diunduh.')
}

function handleDownloadMswHandlers() {
  const code = generateMswHandlersTs(model.value)
  downloadMockFile(code, 'handlers.ts', 'application/typescript')
  showToast('handlers.ts (MSW) berhasil diunduh.')
}

// -------------------------------------------------------------
// TAB 4: GRILL ARCHITECTURE
// -------------------------------------------------------------
const grillReport = computed(() => grillArchitecture(model.value))

function handleApplyGrillSolutions() {
  const updated = applyGrillFixesToModel(model.value, grillReport.value)
  blueprintStore.setActiveModel(updated)
  showToast('Solusi arsitektur berhasil diterapkan ke NFR & Constraints!')
}

// -------------------------------------------------------------
// TAB 5: REVERSE & SCAFFOLD MODALS
// -------------------------------------------------------------
const showReverseModal = ref(false)
const showScaffoldModal = ref(false)

function handleApplyReverseModel(revModel: Partial<import('@/lib/prd/sections').PrdModel>) {
  blueprintStore.setActiveModel({
    ...model.value,
    ...revModel,
  })
  showToast('Berhasil reverse-engineer dan memperbarui Blueprint aktif!')
}
</script>

<template>
  <div class="ops-page">
    <!-- Page Header -->
    <header class="ops-header">
      <div class="header-left">
        <div class="eyebrow font-mono">
          <ShieldCheck :size="13" />
          <span>PRODUCTION OPS &amp; QA WORKBENCH</span>
        </div>
        <h1 class="page-title font-serif">Production Ops &amp; Tooling</h1>
        <p class="page-desc">
          Pusat kendali arsitektur berstandar industri: Contract-First Mock Sandbox, Architecture Decision Records (ADR), Audit SRE (PRR), dan Stress-Tester.
        </p>
      </div>

      <!-- Active Blueprint Info Pill -->
      <div class="active-blueprint-card">
        <div class="card-meta font-mono">
          <span class="meta-label">CETAK BIRU AKTIF:</span>
          <span class="meta-cat">{{ model.category }}</span>
        </div>
        <div class="card-title-row">
          <span class="blueprint-name font-serif">{{ model.title }}</span>
          <RouterLink to="/prd-studio" class="edit-link font-mono" title="Buka di Blueprint Studio">
            <span>Edit Studio</span>
            <ArrowRight :size="11" />
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Global Navigation Tabs for Ops Hub -->
    <nav class="ops-tabs-nav font-mono">
      <button
        type="button"
        class="ops-tab-btn"
        :class="{ active: activeTab === 'prr' }"
        @click="activeTab = 'prr'"
      >
        <ShieldCheck :size="14" />
        <span>Production Gate (PRR)</span>
        <span class="tab-badge">
          {{ prrReport.score }}/100
        </span>
      </button>

      <button
        type="button"
        class="ops-tab-btn"
        :class="{ active: activeTab === 'adr' }"
        @click="activeTab = 'adr'"
      >
        <FileText :size="14" />
        <span>Architecture Decisions (ADR)</span>
        <span class="tab-badge">{{ adrList.length }}</span>
      </button>

      <button
        type="button"
        class="ops-tab-btn"
        :class="{ active: activeTab === 'mock' }"
        @click="activeTab = 'mock'"
      >
        <Zap :size="14" />
        <span>Mock API &amp; MSW Sandbox</span>
        <span class="tab-badge">{{ endpoints.length }} Rute</span>
      </button>

      <button
        type="button"
        class="ops-tab-btn"
        :class="{ active: activeTab === 'grill' }"
        @click="activeTab = 'grill'"
      >
        <Flame :size="14" />
        <span>Stress-Tester (50k RPS)</span>
        <span class="tab-badge">{{ grillReport.grade }}</span>
      </button>

      <button
        type="button"
        class="ops-tab-btn"
        :class="{ active: activeTab === 'reverse' }"
        @click="activeTab = 'reverse'"
      >
        <RotateCcw :size="14" />
        <span>Reverse &amp; Scaffolder</span>
      </button>
    </nav>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="ops-toast font-mono">
      <Check :size="13" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 1: PRODUCTION READINESS REVIEW (PRR)                      -->
    <!-- ============================================================ -->
    <section v-if="activeTab === 'prr'" class="tab-panel">
      <!-- Scorecard Banner -->
      <div class="prr-banner">
        <div class="banner-score">
          <div class="score-box font-mono">
            <span class="score-val">{{ prrReport.score }}</span>
            <span class="score-max">/100</span>
          </div>
          <div class="banner-text">
            <div class="verdict-row font-mono">
              <span class="verdict-dot" :class="`dot-${prrReport.verdict.toLowerCase()}`"></span>
              <span class="verdict-label">
                {{ prrReport.verdict === 'READY' ? 'Ready for Production' : prrReport.verdict === 'CONDITIONAL' ? 'Conditional Approval' : 'Action Required' }}
              </span>
            </div>
            <h2 class="banner-title font-serif">Production Readiness Review Gate</h2>
            <p class="banner-desc">
              Audit SRE mencakup Keamanan, Keandalan (DR), Observabilitas, dan Performa Database sebelum rilis ke server live.
            </p>
          </div>
        </div>

        <div class="banner-actions">
          <button
            type="button"
            class="action-btn-outline font-mono"
            @click="handleDownloadPrr"
          >
            <Download :size="13" />
            <span>Unduh Laporan Sign-Off (.md)</span>
          </button>
        </div>
      </div>

      <!-- Audit Items Grid -->
      <div class="audit-grid">
        <div
          v-for="item in prrReport.items"
          :key="item.id"
          class="audit-card"
        >
          <div class="card-status-row">
            <span class="status-indicator font-mono" :class="{ 'is-passed': item.passed }">
              <CheckCircle2 v-if="item.passed" :size="12" />
              <AlertTriangle v-else :size="12" />
              <span>{{ item.passed ? 'Memenuhi syarat' : item.importance === 'critical' ? 'Kritis' : item.importance === 'high' ? 'Prioritas Tinggi' : 'Rekomendasi' }}</span>
            </span>
            <span class="pillar-tag font-mono">{{ item.pillar.toUpperCase() }}</span>
          </div>

          <h3 class="audit-item-title font-mono">{{ item.title }}</h3>
          <p class="audit-item-desc">{{ item.description }}</p>

          <div v-if="!item.passed" class="remediation-box font-mono">
            <span class="box-title">Tindakan mitigasi:</span>
            <p class="box-text">{{ item.remediation }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- TAB 2: ARCHITECTURE DECISION RECORDS (ADR)                   -->
    <!-- ============================================================ -->
    <section v-else-if="activeTab === 'adr'" class="tab-panel adr-layout">
      <!-- Left Sidebar: ADR List -->
      <aside class="adr-sidebar">
        <div class="sidebar-header font-mono">
          <span>BERKAS ADR (MADR STANDARD)</span>
          <span>{{ adrList.length }} Rekord</span>
        </div>

        <div class="adr-list">
          <button
            v-for="adr in adrList"
            :key="adr.id"
            type="button"
            class="adr-nav-item"
            :class="{ active: selectedAdrId === adr.id }"
            @click="selectedAdrId = adr.id"
          >
            <div class="nav-top">
              <span class="adr-num font-mono">ADR-{{ String(adr.number).padStart(4, '0') }}</span>
              <span class="adr-status-badge font-mono">{{ adr.status }}</span>
            </div>
            <span class="adr-nav-title">{{ adr.title }}</span>
          </button>
        </div>
      </aside>

      <!-- Right Main: Selected ADR Document Viewer -->
      <main class="adr-viewer">
        <div class="viewer-header">
          <div>
            <div class="viewer-tags font-mono">
              <span class="tag-status">{{ activeAdr.status }}</span>
              <span class="tag-date">Tanggal: {{ activeAdr.date }}</span>
              <span class="tag-deciders">Deciders: {{ activeAdr.deciders }}</span>
            </div>
            <h2 class="viewer-title font-serif">{{ activeAdr.title }}</h2>
          </div>

          <div class="viewer-actions font-mono">
            <button
              type="button"
              class="btn-secondary btn-sm"
              @click="handleCopyText(activeAdr.markdown, activeAdr.filename)"
            >
              <Check v-if="copiedNotice === activeAdr.filename" :size="12" />
              <Copy v-else :size="12" />
              <span>Salin .md</span>
            </button>
            <button
              type="button"
              class="btn-primary btn-sm"
              @click="handleDownloadActiveAdr"
            >
              <Download :size="12" />
              <span>Unduh {{ activeAdr.filename }}</span>
            </button>
          </div>
        </div>

        <div class="adr-content-body font-mono">
          <pre><code>{{ activeAdr.markdown }}</code></pre>
        </div>
      </main>
    </section>

    <!-- ============================================================ -->
    <!-- TAB 3: CONTRACT-FIRST MOCK API & MSW SANDBOX                  -->
    <!-- ============================================================ -->
    <section v-else-if="activeTab === 'mock'" class="tab-panel mock-layout">
      <!-- Left: Endpoints Navigator -->
      <aside class="mock-sidebar">
        <div class="sidebar-header font-mono">
          <span>RUTE KONTRAK API (SEKSI 09)</span>
          <span>{{ endpoints.length }} Rute</span>
        </div>

        <div class="endpoints-list font-mono">
          <button
            v-for="ep in endpoints"
            :key="ep.id"
            type="button"
            class="endpoint-btn"
            :class="{ active: selectedEndpointId === ep.id }"
            @click="selectedEndpointId = ep.id"
          >
            <span class="method-pill" :class="`m-${ep.method.toLowerCase()}`">{{ ep.method }}</span>
            <span class="endpoint-path">{{ ep.path }}</span>
          </button>
        </div>

        <div class="sidebar-export-footer font-mono">
          <span class="footer-label">EKSPOR UNTUK DEVELOPER:</span>
          <button
            type="button"
            class="export-tool-btn"
            title="Download Express local runner"
            @click="handleDownloadMockServer"
          >
            <Download :size="12" />
            <span>mock-server.js (Node.js)</span>
          </button>
          <button
            type="button"
            class="export-tool-btn"
            title="Download MSW handlers for React/Vue"
            @click="handleDownloadMswHandlers"
          >
            <Download :size="12" />
            <span>handlers.ts (MSW)</span>
          </button>
        </div>
      </aside>

      <!-- Right: Interactive In-Browser Request & Response Sandbox -->
      <main class="mock-sandbox">
        <div class="sandbox-header">
          <div class="sandbox-ep-info">
            <span class="method-badge font-mono" :class="`m-${activeEndpoint?.method.toLowerCase()}`">
              {{ activeEndpoint?.method }}
            </span>
            <span class="path-text font-mono">{{ activeEndpoint?.path }}</span>
            <span class="ep-desc font-mono">({{ activeEndpoint?.description }})</span>
          </div>

          <div class="sandbox-actions font-mono">
            <button
              type="button"
              class="btn-primary"
              :disabled="isSimulatingRequest"
              @click="simulateMockCall"
            >
              <Play :size="12" />
              <span>{{ isSimulatingRequest ? 'Mengirim...' : 'Kirim Mock Request' }}</span>
            </button>
          </div>
        </div>

        <!-- Simulation Telemetry Bar -->
        <div class="telemetry-bar font-mono">
          <div class="telem-item">
            <span class="telem-label">Status HTTP:</span>
            <span class="telem-val status-ok">200 OK</span>
          </div>
          <div class="telem-item">
            <span class="telem-label">Latency Simulasi:</span>
            <span class="telem-val">{{ simulatedLatency }}ms</span>
          </div>
          <div class="telem-item">
            <span class="telem-label">Content-Type:</span>
            <span class="telem-val">application/json</span>
          </div>
          <div v-if="lastSimulatedAt" class="telem-item">
            <span class="telem-label">Terakhir Dites:</span>
            <span class="telem-val">{{ lastSimulatedAt }}</span>
          </div>

          <button
            type="button"
            class="copy-json-btn"
            @click="handleCopyText(mockJsonFormatted, 'Mock Response JSON')"
          >
            <Copy :size="11" />
            <span>Salin JSON</span>
          </button>
        </div>

        <!-- Response Body Viewer -->
        <div class="response-viewer">
          <pre class="font-mono"><code>{{ mockJsonFormatted }}</code></pre>
        </div>
      </main>
    </section>

    <!-- ============================================================ -->
    <!-- TAB 4: GRILL ARCHITECTURE                                    -->
    <!-- ============================================================ -->
    <section v-else-if="activeTab === 'grill'" class="tab-panel">
      <div class="grill-full-wrapper">
        <div class="grill-banner">
          <div class="banner-left">
            <div class="grill-grade-box font-mono">
              {{ grillReport.grade }}
            </div>
            <div>
              <div class="grill-eyebrow font-mono">STRESS-TEST ARSITEKTUR (50.000+ RPS)</div>
              <h2 class="grill-title font-serif">Simulasi Beban Puncak &amp; SPOF</h2>
              <p class="grill-desc">{{ grillReport.summary }}</p>
            </div>
          </div>

          <div class="grill-banner-right font-mono">
            <div class="counter-chip">
              <span>{{ grillReport.criticalCount }} Kritis</span>
            </div>
            <div class="counter-chip">
              <span>{{ grillReport.warningsCount }} Peringatan</span>
            </div>
            <div class="counter-chip">
              <span>{{ grillReport.strengthsCount }} Kekuatan</span>
            </div>
            <button
              type="button"
              class="action-btn-outline font-mono"
              :disabled="grillReport.suggestedNfrAdditions.length === 0 && grillReport.suggestedConstraintAdditions.length === 0"
              @click="handleApplyGrillSolutions"
            >
              <Flame :size="13" />
              <span>Terapkan Solusi ke Blueprint</span>
            </button>
          </div>
        </div>

        <div class="grill-findings-list">
          <div
            v-for="finding in grillReport.findings"
            :key="finding.id"
            class="finding-item"
          >
            <div class="finding-top-row">
              <span class="finding-tag font-mono">{{ finding.severity.toUpperCase() }}</span>
              <h3 class="finding-name font-mono">{{ finding.title }}</h3>
            </div>
            <p v-if="finding.scenario" class="finding-scen"><strong>Skenario:</strong> {{ finding.scenario }}</p>
            <p v-if="finding.vulnerability" class="finding-risk"><strong>Risiko:</strong> {{ finding.vulnerability }}</p>
            <div class="finding-sol font-mono">
              <strong>Solusi Rekayasa:</strong> {{ finding.recommendation }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- TAB 5: REVERSE BLUEPRINT & SCAFFOLDER LAUNCHER               -->
    <!-- ============================================================ -->
    <section v-else-if="activeTab === 'reverse'" class="tab-panel">
      <div class="tools-launcher-grid">
        <!-- Card 1: Reverse Blueprint Engine -->
        <div class="launcher-card">
          <div class="launcher-icon">
            <RotateCcw :size="24" />
          </div>
          <h2 class="launcher-title font-serif">Reverse Blueprint Engine</h2>
          <p class="launcher-desc">
            Impor skema SQL DDL, Prisma schema, OpenAPI YAML/JSON, atau Docker Compose untuk diubah secara otomatis menjadi spesifikasi arsitektur BlueprintDev lengkap.
          </p>
          <button
            type="button"
            class="btn-primary font-mono"
            @click="showReverseModal = true"
          >
            <RotateCcw :size="13" />
            <span>Buka Reverse Blueprint Importer</span>
          </button>
        </div>

        <!-- Card 2: 1-Click Project Repo Scaffolder -->
        <div class="launcher-card">
          <div class="launcher-icon">
            <Terminal :size="24" />
          </div>
          <h2 class="launcher-title font-serif">1-Click Project Repo Scaffolder</h2>
          <p class="launcher-desc">
            Buat skrip inisialisasi otomatis (setup.bat untuk Windows atau setup.sh untuk Linux/Mac) yang membangun direktori proyek, aturan AI, dan skema database dalam 15 detik.
          </p>
          <button
            type="button"
            class="btn-secondary font-mono"
            @click="showScaffoldModal = true"
          >
            <Terminal :size="13" />
            <span>Buka 1-Click Scaffolder</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Modals -->
    <ReverseBlueprintModal
      :is-open="showReverseModal"
      @close="showReverseModal = false"
      @apply-model="handleApplyReverseModel"
    />

    <ScaffoldModal
      :is-open="showScaffoldModal"
      :model="model"
      @close="showScaffoldModal = false"
    />
  </div>
</template>

<style scoped>
.ops-page {
  padding: 24px 32px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.ops-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent);
  margin-bottom: 4px;
}

.page-title {
  font-size: 24px;
  margin: 0;
  color: var(--text);
}

.page-desc {
  font-size: 13px;
  color: var(--text-2);
  margin: 4px 0 0;
  max-width: 680px;
  line-height: 1.5;
}

.active-blueprint-card {
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 10px 14px;
  min-width: 260px;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-3);
  margin-bottom: 4px;
}

.meta-cat {
  color: var(--accent);
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.blueprint-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.edit-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-2);
  text-decoration: none;
}

.edit-link:hover {
  color: var(--accent);
}

.ops-tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
  flex-wrap: wrap;
}

.ops-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.ops-tab-btn:hover {
  background-color: var(--hover);
  color: var(--text);
}

.ops-tab-btn.active {
  background-color: var(--elevated);
  border-color: var(--accent);
  color: var(--accent);
}

.tab-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  color: var(--text-3);
  font-weight: 500;
}

.ops-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: var(--elevated);
  border: 1px solid var(--accent);
  color: var(--text);
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* PRR Panel */
.prr-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  gap: 20px;
  flex-wrap: wrap;
}

.banner-score {
  display: flex;
  align-items: center;
  gap: 16px;
}

.score-box {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 6px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.score-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.score-max {
  font-size: 11px;
  color: var(--text-3);
}

.banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.verdict-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  margin-bottom: 2px;
}

.verdict-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-ready {
  background-color: #10b981;
}

.dot-conditional {
  background-color: #f59e0b;
}

.dot-blocked {
  background-color: #ef4444;
}

.verdict-label {
  color: var(--text-2);
  font-weight: 500;
}

.banner-title {
  font-size: 17px;
  margin: 0;
  color: var(--text);
}

.banner-desc {
  font-size: 12px;
  color: var(--text-2);
  margin: 2px 0 0;
}

.action-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background-color: var(--elevated);
  color: var(--text);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.action-btn-outline:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.action-btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: var(--rule);
  color: var(--text-3);
}

.audit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.audit-card {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.12s ease;
}

.audit-card:hover {
  border-color: var(--rule-strong);
}

.card-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-2);
}

.status-indicator.is-passed {
  color: var(--text-3);
}

.pillar-tag {
  font-size: 9.5px;
  color: var(--text-3);
  padding: 1px 6px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
}

.audit-item-title {
  font-size: 13px;
  margin: 0;
  color: var(--text);
  line-height: 1.4;
}

.audit-item-desc {
  font-size: 12px;
  color: var(--text-2);
  margin: 0;
  line-height: 1.45;
}

.remediation-box {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 11px;
  margin-top: 2px;
}

.box-title {
  color: var(--text-2);
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}

.box-text {
  margin: 0;
  color: var(--text-3);
  line-height: 1.4;
}

/* ADR Layout */
.adr-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  min-height: 600px;
}

.adr-sidebar {
  border-right: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 10px 14px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  font-size: 10.5px;
  color: var(--text-3);
  display: flex;
  justify-content: space-between;
}

.adr-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.adr-nav-item {
  padding: 10px 14px;
  border: none;
  border-bottom: 1px solid var(--rule);
  background: transparent;
  color: var(--text-2);
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
}

.adr-nav-item:hover {
  background-color: var(--hover);
  color: var(--text);
}

.adr-nav-item.active {
  background-color: var(--elevated);
  border-left: 3px solid var(--accent);
  color: var(--accent);
}

.nav-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.adr-num {
  font-size: 10.5px;
}

.adr-status-badge {
  font-size: 9.5px;
  color: var(--success, #10b981);
}

.adr-nav-title {
  font-size: 12px;
  line-height: 1.35;
}

.adr-viewer {
  display: flex;
  flex-direction: column;
}

.viewer-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.viewer-tags {
  display: flex;
  gap: 8px;
  font-size: 10.5px;
  margin-bottom: 4px;
}

.tag-status {
  color: var(--success, #10b981);
}

.tag-date, .tag-deciders {
  color: var(--text-3);
}

.viewer-title {
  font-size: 18px;
  margin: 0;
  color: var(--text);
}

.viewer-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-secondary:hover {
  background-color: var(--hover);
  color: var(--text);
}

.btn-primary {
  padding: 6px 14px;
  background-color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  color: #fff;
  font-size: 11.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-primary:hover {
  background-color: #ff8c5a;
}

.adr-content-body {
  padding: 16px 20px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-2);
}

.adr-content-body pre {
  margin: 0;
  white-space: pre-wrap;
}

/* Mock Sandbox Layout */
.mock-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  min-height: 600px;
}

.mock-sidebar {
  border-right: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
}

.endpoint-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid var(--rule);
  background: transparent;
  color: var(--text-2);
  text-align: left;
  cursor: pointer;
  font-size: 11.5px;
}

.endpoint-btn:hover {
  background-color: var(--hover);
  color: var(--text);
}

.endpoint-btn.active {
  background-color: var(--elevated);
  border-left: 3px solid var(--accent);
  color: var(--accent);
}

.method-pill {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
}

.m-get {
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.m-post {
  background-color: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.m-put, .m-patch {
  background-color: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.m-delete {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.endpoint-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-export-footer {
  padding: 12px;
  border-top: 1px solid var(--rule);
  background-color: var(--elevated);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-label {
  font-size: 10px;
  color: var(--text-3);
  margin-bottom: 2px;
}

.export-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--rule-strong);
  background: transparent;
  color: var(--text);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.export-tool-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.mock-sandbox {
  display: flex;
  flex-direction: column;
}

.sandbox-header {
  padding: 12px 18px;
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sandbox-ep-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
}

.path-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.ep-desc {
  font-size: 11.5px;
  color: var(--text-3);
}

.telemetry-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 18px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  font-size: 11px;
  flex-wrap: wrap;
}

.telem-item {
  display: flex;
  gap: 4px;
}

.telem-label {
  color: var(--text-3);
}

.telem-val {
  color: var(--text);
}

.status-ok {
  color: var(--success, #10b981);
  font-weight: 600;
}

.copy-json-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  padding: 2px 8px;
  font-size: 10.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.copy-json-btn:hover {
  color: var(--text);
  border-color: var(--rule-strong);
}

.response-viewer {
  flex: 1;
  padding: 16px 18px;
  overflow-y: auto;
  background-color: var(--bg);
}

.response-viewer pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text);
}

/* Grill Full Wrapper */
.grill-full-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grill-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  gap: 20px;
  flex-wrap: wrap;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.grill-grade-box {
  width: 50px;
  height: 50px;
  border: 2px solid var(--accent);
  border-radius: var(--radius);
  color: var(--accent);
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grill-eyebrow {
  font-size: 10px;
  color: var(--accent);
}

.grill-title {
  font-size: 17px;
  margin: 2px 0;
  color: var(--text);
}

.grill-desc {
  font-size: 12px;
  color: var(--text-2);
  margin: 0;
}

.grill-banner-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.counter-chip {
  padding: 4px 9px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  color: var(--text-2);
}

.grill-findings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.finding-item {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.12s ease;
}

.finding-item:hover {
  border-color: var(--rule-strong);
}

.finding-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.finding-tag {
  font-size: 9.5px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  color: var(--text-3);
  font-weight: 500;
}

.finding-name {
  font-size: 13px;
  margin: 0;
  color: var(--text);
}

.finding-scen, .finding-risk {
  font-size: 12px;
  color: var(--text-2);
  margin: 0;
}

.finding-sol {
  background-color: var(--elevated);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  color: var(--accent);
}

/* Tools Launcher Grid */
.tools-launcher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 20px;
}

.launcher-card {
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.launcher-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  background-color: rgba(255, 122, 69, 0.12);
  border: 1px solid rgba(255, 122, 69, 0.35);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.launcher-title {
  font-size: 18px;
  margin: 0;
  color: var(--text);
}

.launcher-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0 0 8px;
}
</style>
