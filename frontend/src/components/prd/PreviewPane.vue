<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Copy,
  Download,
  Printer,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bot,
  ShieldCheck,
  ArrowRight,
} from 'lucide-vue-next'
import {
  getSectionsForMode,
  type PrdModel,
  type PrdStudioMode,
  type SectionDef,
} from '@/lib/prd/sections'
import { toMarkdown, toPayload } from '@/lib/prd/adapter'
import { renderMarkdown } from '@/lib/prd/markdown'
import { downloadWordDoc } from '@/lib/prd/exportDoc'
import {
  AGENT_TARGETS,
  generateAgentFromPrd,
  downloadAgentFile,
  SPECIALIST_ROLES,
  generateRoleSkillMd,
  downloadRoleSkillMd,
  type AgentTargetId,
  type SpecialistRole,
} from '@/lib/prd/agentGenerators'
import VisualArchitecture from './VisualArchitecture.vue'
import ScaffoldModal from './ScaffoldModal.vue'
import GrillArchitectModal from './GrillArchitectModal.vue'
import {
  parseDataModels,
  generateMermaidErDiagram,
} from '@/lib/prd/diagramParser'
import {
  generateOpenApiDocument,
  stringifyYaml,
  generatePostmanCollection,
  downloadSpecFile,
} from '@/lib/prd/openapiGenerator'
import { generateHttpFile, generateQaTestPlan } from '@/lib/prd/qaGenerator'
import type { Issue } from '@/lib/prd/lint'

interface Props {
  model: PrdModel
  activeMode?: PrdStudioMode
  issues?: Issue[]
  activeSectionId?: string
}

const props = withDefaults(defineProps<Props>(), {
  activeMode: 'advanced',
  issues: () => [],
  activeSectionId: 'overview',
})

const emit = defineEmits<{
  (e: 'navigate-to-section', sectionId: string): void
  (e: 'switch-to-advanced'): void
  (e: 'apply-grill-fixes', updatedModel: PrdModel): void
}>()

// Active Preview Tab: 'document' | 'architecture' | 'markdown' | 'json' | 'issues'
const activeTab = ref<'document' | 'architecture' | 'markdown' | 'json' | 'issues'>('document')
const copiedNotice = ref(false)
const showAgentMenu = ref(false)
const showScaffoldModal = ref(false)
const showGrillModal = ref(false)

const handleExportAgentFromPrd = (targetId: AgentTargetId) => {
  const content = generateAgentFromPrd(targetId, props.model)
  downloadAgentFile(targetId, content, props.model.title)
  showAgentMenu.value = false
}

const handleExportRoleSkill = (role: SpecialistRole) => {
  const content = generateRoleSkillMd(role, props.model)
  downloadRoleSkillMd(role, content, props.model.title)
  showAgentMenu.value = false
}

const handleDownloadOpenApiYaml = () => {
  const doc = generateOpenApiDocument(props.model)
  const yaml = stringifyYaml(doc)
  const slug =
    (props.model.title || 'api-spec')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'api'
  downloadSpecFile(yaml, `${slug}-openapi.yaml`, 'application/x-yaml')
  showAgentMenu.value = false
}

const handleDownloadPostman = () => {
  const json = generatePostmanCollection(props.model)
  const slug =
    (props.model.title || 'api-spec')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'api'
  downloadSpecFile(json, `${slug}-postman-collection.json`, 'application/json')
  showAgentMenu.value = false
}

const handleDownloadHttpTestSuite = () => {
  const content = generateHttpFile(props.model)
  const slug =
    (props.model.title || 'api')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'api'
  downloadSpecFile(content, `${slug}-api-tests.http`, 'text/plain')
  showAgentMenu.value = false
}

const handleDownloadQaPlan = () => {
  const content = generateQaTestPlan(props.model)
  const slug =
    (props.model.title || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'project'
  downloadSpecFile(content, `${slug}-QA_TEST_PLAN.md`, 'text/markdown')
  showAgentMenu.value = false
}

// Visible sections for current mode
const visibleSections = computed<SectionDef[]>(() => {
  return getSectionsForMode(props.activeMode)
})

// Compiled representations
const compiledMarkdown = computed(() => {
  return toMarkdown(props.model)
})

const renderedHtml = computed(() => {
  return renderMarkdown(compiledMarkdown.value)
})

const compiledJson = computed(() => {
  const payload = toPayload(props.model)
  return JSON.stringify(payload, null, 2)
})

// Lint issues grouped by severity
const groupedIssues = computed(() => {
  const errors = props.issues.filter((i) => i.severity === 'error')
  const warns = props.issues.filter((i) => i.severity === 'warn')
  const infos = props.issues.filter((i) => i.severity === 'info')
  return { errors, warns, infos }
})

// Section state in TOC (error, warn, ok, empty)
const sectionStatusMap = computed(() => {
  const map: Record<string, 'error' | 'warn' | 'ok' | 'empty'> = {}

  for (const def of visibleSections.value) {
    // Check if section has lint error or warning
    const secIssues = props.issues.filter((i) => i.sectionId === def.id)
    if (secIssues.some((i) => i.severity === 'error')) {
      map[def.id] = 'error'
      continue
    }
    if (secIssues.some((i) => i.severity === 'warn')) {
      map[def.id] = 'warn'
      continue
    }

    if (def.kind === 'list') {
      const items = props.model.features || []
      map[def.id] = items.length > 0 ? 'ok' : 'empty'
    } else {
      const text = ((props.model[def.id as keyof PrdModel] as string) || '').trim()
      map[def.id] = text.length > 0 ? 'ok' : 'empty'
    }
  }

  return map
})

// Navigation: Click section in TOC or Issue
const jumpToSection = (sectionId: string) => {
  emit('navigate-to-section', sectionId)
  const el = document.getElementById(`section-${sectionId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const input = el.querySelector('textarea, input') as HTMLElement | null
    input?.focus()
  }
}

// Export actions
const copyCurrentView = async () => {
  let content = compiledMarkdown.value
  if (activeTab.value === 'json') {
    content = compiledJson.value
  } else if (activeTab.value === 'architecture') {
    content = generateMermaidErDiagram(parseDataModels(props.model.data_models || ''))
  }
  await navigator.clipboard.writeText(content)
  copiedNotice.value = true
  setTimeout(() => {
    copiedNotice.value = false
  }, 1500)
}

const downloadFile = (format: 'md' | 'json') => {
  const filename = `${(props.model.title || 'specification').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`
  const content = format === 'md' ? compiledMarkdown.value : compiledJson.value
  const blob = new Blob([content], {
    type: format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const triggerPrint = () => {
  window.print()
}

const handleDownloadDoc = () => {
  downloadWordDoc(props.model)
}
</script>

<template>
  <aside class="preview-pane-root" aria-label="Specification reader and live inspector">
    <!-- Header with View Tabs & Export Tools -->
    <header class="preview-toolbar">
      <nav class="preview-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'document' }"
          @click="activeTab = 'document'"
        >
          Dokumen
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'architecture' }"
          @click="activeTab = 'architecture'"
        >
          Arsitektur
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'markdown' }"
          @click="activeTab = 'markdown'"
        >
          Markdown
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'json' }"
          @click="activeTab = 'json'"
        >
          JSON
        </button>
        <button
          type="button"
          class="tab-btn issues-tab-btn"
          :class="{ active: activeTab === 'issues' }"
          @click="activeTab = 'issues'"
        >
          <span>Validasi</span>
          <span
            v-if="issues.length > 0"
            class="issues-badge font-mono"
            :class="{ has_error: groupedIssues.errors.length > 0 }"
          >
            {{ issues.length }}
          </span>
        </button>
      </nav>

      <!-- Export Actions (Streamlined & Clean) -->
      <div class="export-actions">
        <button
          type="button"
          class="icon-btn"
          title="Salin Markdown ke clipboard"
          @click="copyCurrentView"
        >
          <Check v-if="copiedNotice" :size="13" />
          <Copy v-else :size="13" />
        </button>

        <button
          type="button"
          class="icon-btn"
          title="Unduh Markdown (.md)"
          @click="downloadFile('md')"
        >
          <Download :size="13" />
        </button>

        <button
          type="button"
          class="icon-btn"
          title="Cetak atau Simpan ke PDF"
          @click="triggerPrint"
        >
          <Printer :size="13" />
        </button>

        <!-- Prominent Gateway to Production Ops & QA Hub -->
        <RouterLink
          to="/ops"
          class="btn-ops-link font-mono"
          title="Buka Production Ops: Mock Sandbox, ADR Generator, PRR Gate & Stress-Tester"
        >
          <ShieldCheck :size="12" />
          <span>Production Ops</span>
          <ArrowRight :size="11" />
        </RouterLink>

        <!-- Direct Agent & Spec Exporter Dropdown (Organized Menu) -->
        <div class="agent-export-wrapper">
          <button
            type="button"
            class="icon-btn agent-export-btn"
            :class="{ active: showAgentMenu }"
            title="Menu Alat Ekspor: Aturan AI, SKILL.md, Word, OpenAPI, Postman, QA"
            @click="showAgentMenu = !showAgentMenu"
          >
            <Bot :size="13" />
          </button>

          <div v-if="showAgentMenu" class="agent-dropdown-menu">
            <div class="agent-dropdown-header font-mono">SPECIALIST SKILL.MD (5 ROLES)</div>
            <button
              v-for="role in SPECIALIST_ROLES"
              :key="role.id"
              type="button"
              class="agent-menu-item"
              @click="handleExportRoleSkill(role.id)"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">{{ role.shortLabel }}</span>
                <span class="agent-menu-filename font-mono" :style="{ color: role.color }">SKILL.md</span>
              </div>
              <span class="agent-menu-sub font-mono">{{ role.name }}</span>
            </button>

            <div class="agent-dropdown-header font-mono" style="margin-top: 6px;">ATURAN AI CODING AGENT</div>
            <button
              v-for="agent in AGENT_TARGETS"
              :key="agent.id"
              type="button"
              class="agent-menu-item"
              @click="handleExportAgentFromPrd(agent.id)"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">{{ agent.name }}</span>
                <span class="agent-menu-filename font-mono">{{ agent.filename }}</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 {{ agent.recommendedPath }}</span>
            </button>

            <div class="agent-dropdown-header font-mono" style="margin-top: 6px;">KONTRAK API &amp; POSTMAN</div>
            <button
              type="button"
              class="agent-menu-item"
              @click="handleDownloadOpenApiYaml"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">OpenAPI 3.1 Spec</span>
                <span class="agent-menu-filename font-mono">openapi.yaml</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 REST schema &amp; endpoints</span>
            </button>

            <button
              type="button"
              class="agent-menu-item"
              @click="handleDownloadPostman"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">Postman Collection</span>
                <span class="agent-menu-filename font-mono">postman.json</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 v2.1.0 siap import</span>
            </button>

            <div class="agent-dropdown-header font-mono" style="margin-top: 6px;">QA &amp; DOKUMEN</div>
            <button
              type="button"
              class="agent-menu-item"
              @click="handleDownloadDoc"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">Dokumen Word (.doc)</span>
                <span class="agent-menu-filename font-mono">specification.doc</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 Format dokumen formal</span>
            </button>

            <button
              type="button"
              class="agent-menu-item"
              @click="handleDownloadHttpTestSuite"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">Pengujian REST Client</span>
                <span class="agent-menu-filename font-mono">api.http</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 Test assertions langsung di editor</span>
            </button>

            <button
              type="button"
              class="agent-menu-item"
              @click="handleDownloadQaPlan"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">Dokumen Rencana QA</span>
                <span class="agent-menu-filename font-mono">QA_TEST_PLAN.md</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 Matriks pengujian &amp; validasi data</span>
            </button>

            <div class="agent-dropdown-header font-mono" style="margin-top: 6px;">ALAT REKAYASA SISTEM</div>
            <button
              type="button"
              class="agent-menu-item"
              @click="showScaffoldModal = true; showAgentMenu = false"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">1-Click Scaffolder</span>
                <span class="agent-menu-filename font-mono">setup.bat / .sh</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 Inisialisasi folder 9 framework</span>
            </button>

            <button
              type="button"
              class="agent-menu-item"
              @click="showGrillModal = true; showAgentMenu = false"
            >
              <div class="agent-menu-top">
                <span class="agent-menu-name">Grill Architecture</span>
                <span class="agent-menu-filename font-mono">50k RPS</span>
              </div>
              <span class="agent-menu-sub font-mono">📍 Audit stres &amp; auto-hardening</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Pane Grid: Left TOC + Right Content Area -->
    <div class="pane-split">
      <!-- Left Table of Contents (TOC) with Section Dots -->
      <nav class="toc-column" aria-label="Table of contents">
        <div class="toc-header">
          <span class="toc-title font-mono">BAGIAN DOKUMEN</span>
        </div>
        <div class="toc-list">
          <template v-for="sec in visibleSections" :key="sec.id">
            <button
              type="button"
              class="toc-item"
              :class="{ active: activeSectionId === sec.id }"
              @click="jumpToSection(sec.id)"
            >
              <span
                class="toc-dot"
                :class="{
                  'dot-error': sectionStatusMap[sec.id] === 'error',
                  'dot-warn': sectionStatusMap[sec.id] === 'warn',
                  'dot-ok': sectionStatusMap[sec.id] === 'ok',
                  'dot-empty': sectionStatusMap[sec.id] === 'empty',
                }"
              ></span>
              <span class="toc-num font-mono">{{ sec.order.toString().padStart(2, '0') }}</span>
              <span class="toc-name">{{ sec.title }}</span>
            </button>

            <!-- When in Simple mode, show 07-10 placeholder item in TOC -->
            <button
              v-if="activeMode === 'simple' && sec.id === 'metrics'"
              type="button"
              class="toc-item toc-item-hidden"
              title="Bagian teknis 07–10 disembunyikan dalam mode Sederhana. Klik untuk membuka di Mode Lengkap."
              @click="emit('switch-to-advanced')"
            >
              <span class="toc-dot dot-empty"></span>
              <span class="toc-num font-mono">07–10</span>
              <span class="toc-name text-muted">Teknis (Tersembunyi)</span>
            </button>
          </template>
        </div>
      </nav>

      <!-- Right Scrollable Content Pane -->
      <div class="preview-scroll-viewport">
        <!-- 1. Document Tab (Rendered Markdown Specification) -->
        <article v-if="activeTab === 'document'" class="document-article print-article">
          <!-- Print-Only Formal Cover Header (Shown exclusively in print/PDF) -->
          <div class="print-only-cover">
            <div class="print-eyebrow font-mono">PRODUCT REQUIREMENT DOCUMENT & ARCHITECTURE SPECIFICATION</div>
            <h1 class="print-main-title font-serif">{{ model.title || 'Untitled Specification' }}</h1>
            <table class="print-metadata-table">
              <tbody>
                <tr>
                  <td class="print-meta-k font-mono">Category:</td>
                  <td class="print-meta-v">{{ model.category }}</td>
                  <td class="print-meta-k font-mono">Status:</td>
                  <td class="print-meta-v">Approved Architecture Draft</td>
                </tr>
                <tr>
                  <td class="print-meta-k font-mono">Date:</td>
                  <td class="print-meta-v">{{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</td>
                  <td class="print-meta-k font-mono">Workbench:</td>
                  <td class="print-meta-v">BlueprintDev (13 Sections)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Screen-Only Title Header -->
          <div class="screen-only-header">
            <h1 class="doc-main-title font-serif">{{ model.title || 'Untitled Specification' }}</h1>
            <span class="doc-category-badge font-mono">{{ model.category }}</span>
          </div>

          <div
            v-if="!compiledMarkdown.trim()"
            class="empty-preview-prompt font-mono"
          >
            Isi bagian formulir di sebelah kiri untuk melihat pratinjau dokumen secara langsung.
          </div>

          <div
            v-else
            class="rendered-content"
            v-html="renderedHtml"
          ></div>

          <!-- Print-Only Running Footer -->
          <div class="print-footer font-mono">
            Dokumen Spesifikasi Kebutuhan &amp; Arsitektur Proyek · BlueprintDev
          </div>
        </article>

        <!-- 2. Architecture & Diagrams Tab (Interactive ERD & Flowcharts) -->
        <div v-else-if="activeTab === 'architecture'" class="arch-preview-pane">
          <VisualArchitecture :model="model" />
        </div>

        <!-- 3. Markdown Tab -->
        <div v-else-if="activeTab === 'markdown'" class="code-view-container">
          <pre class="code-view font-mono"><code>{{ compiledMarkdown }}</code></pre>
        </div>

        <!-- 3. JSON Tab -->
        <div v-else-if="activeTab === 'json'" class="code-view-container">
          <pre class="code-view font-mono"><code>{{ compiledJson }}</code></pre>
        </div>

        <!-- 4. Issues Tab -->
        <div v-else class="issues-view-container">
          <div v-if="issues.length === 0" class="zero-issues-card">
            <CheckCircle2 :size="24" class="text-ok" />
            <span class="zero-title">Semua bagian lengkap</span>
            <span class="zero-sub">Dokumen memenuhi semua standar kelengkapan dan siap pakai.</span>
          </div>

          <div v-else class="issues-list">
            <!-- Errors -->
            <div v-if="groupedIssues.errors.length > 0" class="issue-group">
              <div class="group-label error-label font-mono">
                <AlertCircle :size="13" />
                <span>Wajib Diisi ({{ groupedIssues.errors.length }}) - Diperlukan sebelum membuat prompt</span>
              </div>
              <button
                v-for="(err, idx) in groupedIssues.errors"
                :key="`err-${idx}`"
                type="button"
                class="issue-card card-error"
                @click="jumpToSection(err.sectionId)"
              >
                <span class="issue-sec font-mono">{{ err.sectionId }}</span>
                <span class="issue-msg">{{ err.message }}</span>
              </button>
            </div>

            <!-- Warnings -->
            <div v-if="groupedIssues.warns.length > 0" class="issue-group">
              <div class="group-label warn-label font-mono">
                <AlertTriangle :size="13" />
                <span>Peringatan ({{ groupedIssues.warns.length }})</span>
              </div>
              <button
                v-for="(warn, idx) in groupedIssues.warns"
                :key="`warn-${idx}`"
                type="button"
                class="issue-card card-warn"
                @click="jumpToSection(warn.sectionId)"
              >
                <div class="issue-meta">
                  <span class="issue-sec font-mono">{{ warn.sectionId }}</span>
                  <span v-if="warn.line" class="issue-line font-mono">Baris {{ warn.line }}</span>
                </div>
                <span class="issue-msg">{{ warn.message }}</span>
              </button>
            </div>

            <!-- Info -->
            <div v-if="groupedIssues.infos.length > 0" class="issue-group">
              <div class="group-label info-label font-mono">
                <Info :size="13" />
                <span>Saran ({{ groupedIssues.infos.length }})</span>
              </div>
              <button
                v-for="(inf, idx) in groupedIssues.infos"
                :key="`inf-${idx}`"
                type="button"
                class="issue-card card-info"
                @click="jumpToSection(inf.sectionId)"
              >
                <span class="issue-sec font-mono">{{ inf.sectionId }}</span>
                <span class="issue-msg">{{ inf.message }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 1-Click Project Repo Scaffolder Modal -->
    <ScaffoldModal
      :is-open="showScaffoldModal"
      :model="model"
      @close="showScaffoldModal = false"
    />

    <!-- Grill My Architecture Stress-Tester Modal -->
    <GrillArchitectModal
      :is-open="showGrillModal"
      :model="model"
      @close="showGrillModal = false"
      @apply-fixes="emit('apply-grill-fixes', $event)"
    />
  </aside>
</template>

<style scoped>
.preview-pane-root {
  position: sticky;
  top: 24px;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
  z-index: 20;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  height: 44px;
  flex-shrink: 0;
}

.preview-tabs {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  height: 100%;
  padding: 0 4px;
  color: var(--text-3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--text);
}

.tab-btn.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.issues-badge {
  font-size: 11px;
  padding: 1px 5px;
  background-color: var(--hover);
  border-radius: var(--radius);
  color: var(--text-2);
}

.issues-badge.has_error {
  background-color: var(--danger);
  color: var(--bg);
  font-weight: 600;
}

.export-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease, background-color 0.12s ease;
}

.icon-btn:hover {
  color: var(--text);
  border-color: var(--rule-strong);
  background-color: var(--hover);
}

.icon-btn.active {
  color: var(--accent);
  border-color: var(--accent);
  background-color: var(--hover);
}

.btn-ops-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  background-color: rgba(255, 122, 69, 0.12);
  border: 1px solid rgba(255, 122, 69, 0.45);
  border-radius: var(--radius);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.12s ease;
}

.btn-ops-link:hover {
  background-color: var(--accent);
  color: #fff;
}

.scaffold-trigger-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  background-color: var(--hover);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.03em;
  transition: all 0.12s ease;
}

.scaffold-trigger-btn:hover {
  background-color: var(--accent);
  color: var(--bg);
}

.grill-trigger-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  background-color: rgba(255, 122, 69, 0.1);
  border: 1px solid rgba(255, 122, 69, 0.4);
  border-radius: var(--radius);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.03em;
  white-space: nowrap;
  transition: all 0.12s ease;
}

.grill-trigger-btn:hover {
  background-color: var(--accent);
  color: #fff;
}

/* Direct Agent Exporter Dropdown */
.agent-export-wrapper {
  position: relative;
}

.agent-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 260px;
  background-color: var(--elevated);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 6px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.agent-dropdown-header {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  padding: 6px 8px 4px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 2px;
}

.agent-menu-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: var(--radius);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s ease;
}

.agent-menu-item:hover {
  background-color: var(--hover);
  border-color: var(--rule);
}

.agent-menu-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.agent-menu-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
}

.agent-menu-filename {
  font-size: 11px;
  color: var(--accent);
}

.agent-menu-sub {
  font-size: 10.5px;
  color: var(--text-3);
}

/* Pane Split: Left TOC (180px) + Right Viewport */
.pane-split {
  display: grid;
  grid-template-columns: 190px 1fr;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 900px) {
  .pane-split {
    grid-template-columns: 1fr;
  }
  .toc-column {
    display: none;
  }
}

/* Left TOC */
.toc-column {
  border-right: 1px solid var(--rule);
  background-color: var(--surface);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.toc-header {
  padding: 12px 14px 6px;
}

.toc-title {
  font-size: 11px;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

.toc-list {
  display: flex;
  flex-direction: column;
  padding: 4px 6px 16px;
  gap: 2px;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  color: var(--text-2);
  font-size: 12px;
}

.toc-item:hover {
  background-color: var(--hover);
  color: var(--text);
}

.toc-item.active {
  background-color: var(--elevated);
  color: var(--text);
  font-weight: 500;
  border-left: 2px solid var(--accent);
}

.toc-item-hidden {
  opacity: 0.75;
  border-left: 2px dashed var(--warn);
}

.toc-item-hidden:hover {
  opacity: 1;
  background-color: var(--hover);
}

.toc-item-hidden .toc-num {
  color: var(--warn);
}

.text-muted {
  color: var(--text-3);
}

.toc-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-error {
  background-color: var(--danger);
}

.dot-warn {
  background-color: var(--warn);
}

.dot-ok {
  background-color: var(--ok);
}

.dot-empty {
  background-color: var(--rule-strong);
}

.toc-num {
  font-size: 11px;
  color: var(--text-3);
}

.toc-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Right Scroll Viewport */
.preview-scroll-viewport {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  background-color: var(--bg);
}

.document-article {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.print-only-cover,
.print-footer {
  display: none;
}

.doc-main-title {
  font-size: 32px;
  line-height: 1.1;
  color: var(--text);
  margin: 0;
}

.doc-category-badge {
  font-size: 12px;
  color: var(--text-3);
}

.empty-preview-prompt {
  padding: 48px 16px;
  text-align: center;
  color: var(--text-3);
  font-size: 13px;
}

.rendered-content {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-2);
}

:deep(.md-heading-1) {
  font-size: 28px;
  color: var(--text);
  margin: 24px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--rule);
}

:deep(.md-heading-2) {
  font-size: 18px;
  color: var(--text);
  font-weight: 600;
  margin: 28px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rule);
}

:deep(.md-heading-3) {
  font-size: 14px;
  color: var(--text);
  font-weight: 600;
  margin: 16px 0 6px;
}

:deep(.md-paragraph) {
  margin: 0 0 12px;
}

:deep(.md-list),
:deep(.md-num-list) {
  margin: 0 0 14px;
  padding-left: 20px;
}

:deep(.md-list-item),
:deep(.md-num-item) {
  margin-bottom: 6px;
}

:deep(.md-inline-code) {
  background-color: var(--elevated);
  padding: 2px 5px;
  border-radius: var(--radius);
  color: var(--text);
  font-size: 12px;
}

:deep(.code-box) {
  margin: 14px 0;
  padding: 14px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
}

:deep(.md-bold) {
  color: var(--text);
}

:deep(.md-blockquote) {
  margin: 12px 0;
  padding: 8px 14px;
  border-left: 3px solid var(--accent);
  background-color: var(--elevated);
  color: var(--text-2);
  border-radius: 0 var(--radius) var(--radius) 0;
}

:deep(.md-table-wrap) {
  width: 100%;
  overflow-x: auto;
  margin: 14px 0;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

:deep(.md-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

:deep(.md-table th) {
  background-color: var(--elevated);
  color: var(--text);
  font-weight: 600;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
}

:deep(.md-table td) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--text-2);
}

:deep(.md-table tr:last-child td) {
  border-bottom: none;
}

:deep(.md-hr) {
  border: none;
  border-top: 1px solid var(--rule);
  margin: 20px 0;
}

:deep(.md-link) {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

:deep(.md-link:hover) {
  opacity: 0.85;
}

:deep(.md-task-item) {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.md-task-checkbox) {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
  margin: 0;
}

/* Architecture View */
.arch-preview-pane {
  padding: 8px 0;
}

/* Code View */
.code-view-container {
  height: 100%;
}

.code-view {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Issues Tab */
.issues-view-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.zero-issues-card {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.text-ok {
  color: var(--ok);
}

.zero-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.zero-sub {
  font-size: 13px;
  color: var(--text-3);
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.error-label {
  color: var(--danger);
}

.warn-label {
  color: var(--warn);
}

.info-label {
  color: var(--text-2);
}

.issue-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.12s ease;
}

.issue-card:hover {
  border-color: var(--rule-strong);
}

.card-error {
  border-left: 3px solid var(--danger);
}

.card-warn {
  border-left: 3px solid var(--warn);
}

.card-info {
  border-left: 3px solid var(--text-3);
}

.issue-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.issue-sec {
  font-size: 11px;
  color: var(--text-3);
}

.issue-line {
  font-size: 11px;
  color: var(--accent);
}

.issue-msg {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}

/* Print Styles */
@media print {
  .preview-pane-root {
    position: static !important;
    height: auto !important;
    border: none !important;
    background: #ffffff !important;
    color: #000000 !important;
    overflow: visible !important;
  }
  .preview-toolbar,
  .toc-column {
    display: none !important;
  }
  .preview-scroll-viewport {
    background: #ffffff !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  .print-article {
    color: #000000 !important;
  }
  .doc-main-title {
    color: #000000 !important;
  }
  :deep(.md-heading-1),
  :deep(.md-heading-2),
  :deep(.md-heading-3),
  :deep(.md-bold) {
    color: #000000 !important;
    border-color: #e0e0e0 !important;
  }
  :deep(.rendered-content),
  :deep(.md-paragraph),
  :deep(.md-list-item) {
    color: #222222 !important;
  }
  :deep(.code-box),
  :deep(.md-inline-code) {
    background-color: #f5f5f5 !important;
    color: #111111 !important;
    border-color: #cccccc !important;
  }
}
</style>
