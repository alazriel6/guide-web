<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  ArrowRight,
  Wand2,
  Save,
  AlertCircle,
  History,
  RotateCcw,
} from 'lucide-vue-next'
import { prdApi, type PrdDocument } from '@/services/api'
import { FALLBACK_PRD_PRESETS } from '@/services/defaultPresets'
import { generateWithAI } from '@/services/aiService'
import { useAiConfigStore } from '@/stores/aiConfig'
import {
  PRD_SECTIONS,
  getSectionsForMode,
  createBlankModel,
  type PrdModel,
  type PrdStudioMode,
  type SectionDef,
} from '@/lib/prd/sections'
import { fromPayload, toPayload, parseFeatures } from '@/lib/prd/adapter'
import { lint, getCompleteness, type Issue } from '@/lib/prd/lint'
import SectionEditor from '@/components/prd/SectionEditor.vue'
import PreviewPane from '@/components/prd/PreviewPane.vue'
import ReverseBlueprintModal from '@/components/prd/ReverseBlueprintModal.vue'
import PrdHistoryModal, { type Snapshot } from '@/components/prd/PrdHistoryModal.vue'
import PrdSpecTable from '@/components/prd/PrdSpecTable.vue'
import { useBlueprintStore } from '@/stores/blueprintStore'

const router = useRouter()
const aiStore = useAiConfigStore()
const blueprintStore = useBlueprintStore()

const CATEGORIES = ['All', 'SaaS Web App', 'Desktop Media App', 'AI Tooling', 'REST Microservice']
const FORM_CATEGORIES = ['SaaS Web App', 'Desktop Media App', 'AI Tooling', 'REST Microservice']

// State
const prds = ref<PrdDocument[]>([])
const loading = ref(false)
const saving = ref(false)
const backendConnected = ref(true)
const statusToast = ref<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null)

// Mode: Simple (product + boundaries) vs Advanced (all)
// Defaults to 'advanced' so all 13 sections (01 to 13) are visible and editable
const activeMode = ref<PrdStudioMode>(
  (localStorage.getItem('prd.mode') as PrdStudioMode) || 'advanced',
)

const setMode = (mode: PrdStudioMode) => {
  activeMode.value = mode
  localStorage.setItem('prd.mode', mode)
}

// Active Model in Editor
const model = ref<PrdModel>({ ...blueprintStore.activeModel })
const isDirty = ref(false)
const activeSectionId = ref<string>('overview')

const hasTechnicalContent = computed(() => {
  return Boolean(
    model.value.stack?.trim() ||
    model.value.data_models?.trim() ||
    model.value.api_contract?.trim() ||
    model.value.nfr?.trim(),
  )
})

const confirmDeleteDoc = ref<PrdDocument | null>(null)

// History snapshots modal state (Phase 14)
const showHistoryModal = ref(false)
const historySnapshots = ref<Snapshot[]>([])
const showReverseModal = ref(false)

function handleApplyReverseModel(revModel: Partial<PrdModel>) {
  model.value = {
    ...model.value,
    ...revModel,
  }
  isDirty.value = true
  blueprintStore.setActiveModel(model.value)
  showToast('Berhasil menerapkan hasil Reverse Blueprint ke Studio!', 'ok')
}

function handleApplyGrillFixes(updatedModel: PrdModel) {
  model.value = updatedModel
  isDirty.value = true
  blueprintStore.setActiveModel(model.value)
  showToast('Solusi arsitektur berhasil diterapkan ke NFR & Constraints!', 'ok')
}

// AI Architect Bar Full Draft State (Phase 13)
interface SectionDraftStatus {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
}
const aiTopicPrompt = ref('')
const aiRunningFull = ref(false)
const aiFullElapsed = ref(0)
const aiSectionStatuses = ref<SectionDraftStatus[]>([])
let aiFullInterval: number | null = null
let aiAbortController: AbortController | null = null

// Visible Sections for active mode
const visibleSections = computed<SectionDef[]>(() => {
  return getSectionsForMode(activeMode.value)
})

// Deterministic Lint Issues & Completeness
const lintIssues = computed<Issue[]>(() => {
  return lint(model.value, activeMode.value)
})

const lintErrors = computed(() => {
  return lintIssues.value.filter((i) => i.severity === 'error')
})

const hasLintErrors = computed(() => {
  return lintErrors.value.length > 0
})

const completeness = computed(() => {
  return getCompleteness(model.value, activeMode.value)
})

const showToast = (text: string, type: 'ok' | 'err' | 'info' = 'ok') => {
  statusToast.value = { text, type }
  setTimeout(() => {
    if (statusToast.value?.text === text) {
      statusToast.value = null
    }
  }, 4000)
}

// Autosave debounced 800ms to localStorage `prd.draft.{docId}`
let autosaveTimeout: number | null = null
const triggerAutosave = () => {
  isDirty.value = true
  if (autosaveTimeout) clearTimeout(autosaveTimeout)
  autosaveTimeout = window.setTimeout(() => {
    const draftKey = `prd.draft.${model.value.id || 'new'}`
    localStorage.setItem(draftKey, JSON.stringify(model.value))
  }, 800)
}

// Fetch Specifications from Backend or Presets
const fetchPrds = async () => {
  loading.value = true
  try {
    const data = await prdApi.list()
    prds.value = data
    backendConnected.value = true
    if (data.length > 0 && !model.value.id) {
      loadDocIntoEditor(data[0]!)
    }
  } catch {
    backendConnected.value = false
    prds.value = [...FALLBACK_PRD_PRESETS]
    if (prds.value.length > 0 && !model.value.id) {
      loadDocIntoEditor(prds.value[0]!)
    }
    showToast('Loaded local preset catalog.', 'info')
  } finally {
    loading.value = false
  }
}

// Load Document into Editor (losslessly converts legacy or v2 payload into PrdModel)
const loadDocIntoEditor = (doc: PrdDocument) => {
  const parsed = fromPayload(doc)
  model.value = parsed
  isDirty.value = false
  blueprintStore.setActiveModel(parsed)
  loadHistorySnapshots()

  // If the loaded specification contains technical architecture sections, ensure Advanced mode is on
  const hasTech = Boolean(
    parsed.stack?.trim() ||
    parsed.data_models?.trim() ||
    parsed.api_contract?.trim() ||
    parsed.nfr?.trim(),
  )
  if (hasTech && (!localStorage.getItem('prd.mode') || localStorage.getItem('prd.mode') === 'simple')) {
    setMode('advanced')
  }
}

// Initialize Blank Document
const startNewSpecification = () => {
  model.value = createBlankModel('New Architecture Specification', 'SaaS Web App')
  isDirty.value = false
  showToast('Initialized blank specification draft.', 'info')
}

// Fork-on-edit-preset & Save Document
const savePrd = async () => {
  if (!model.value.title.trim()) {
    showToast('Specification title is required before saving.', 'err')
    return
  }

  saving.value = true

  // Fork on editing a preset:
  // "Editing a preset must fork: first 'Update' on a preset calls the existing clone action, then saves the clone."
  let targetModel = { ...model.value }
  if (targetModel.is_preset) {
    targetModel = {
      ...targetModel,
      id: undefined,
      is_preset: false,
      title: `${targetModel.title} (Custom)`,
    }
  }

  const payload: PrdDocument = toPayload(targetModel)

  try {
    if (targetModel.id && backendConnected.value) {
      const updated = await prdApi.update(targetModel.id, payload)
      const idx = prds.value.findIndex((p) => p.id === updated.id)
      if (idx !== -1) prds.value[idx] = updated
      model.value = fromPayload(updated)
      showToast(`Updated document #${updated.id}.`, 'ok')
    } else if (backendConnected.value) {
      const created = await prdApi.create(payload)
      prds.value.unshift(created)
      model.value = fromPayload(created)
      showToast(`Saved new specification #${created.id}.`, 'ok')
    } else {
      if (targetModel.id) {
        const idx = prds.value.findIndex((p) => p.id === targetModel.id)
        if (idx !== -1) prds.value[idx] = { ...payload }
        model.value = fromPayload(payload)
        showToast('Updated specification in local session.', 'ok')
      } else {
        const newDoc = { ...payload, id: Date.now() }
        prds.value.unshift(newDoc)
        model.value = fromPayload(newDoc)
        showToast('Saved specification to local session.', 'ok')
      }
    }
    isDirty.value = false
    recordHistorySnapshot()
    // Clear draft storage
    localStorage.removeItem(`prd.draft.${model.value.id || 'new'}`)
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to save specification', 'err')
  } finally {
    saving.value = false
  }
}

// Clone Document Action
const cloneDocument = (doc: PrdDocument) => {
  const parsed = fromPayload(doc)
  parsed.id = undefined
  parsed.title = `${doc.title} (Copy)`
  parsed.is_preset = false
  model.value = parsed
  isDirty.value = true
  showToast('Cloned specification into an editable draft.', 'info')
}

// Delete Document Action
const triggerDeleteModal = (doc: PrdDocument) => {
  confirmDeleteDoc.value = doc
}

const executeDelete = async () => {
  if (!confirmDeleteDoc.value || !confirmDeleteDoc.value.id) return
  const id = confirmDeleteDoc.value.id

  try {
    if (backendConnected.value) {
      await prdApi.remove(id)
    }
    prds.value = prds.value.filter((p) => p.id !== id)
    if (model.value.id === id) {
      if (prds.value.length > 0) {
        loadDocIntoEditor(prds.value[0]!)
      } else {
        startNewSpecification()
      }
    }
    showToast(`Deleted document #${id}.`, 'ok')
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to delete specification', 'err')
  } finally {
    confirmDeleteDoc.value = null
  }
}

// Bridge to Technical Prompt Engineer (Gated by Lint Errors)
const sendToPromptEngineer = () => {
  if (hasLintErrors.value) {
    showToast('Resolve all blocking lint errors before bridging to Prompt Compiler.', 'err')
    return
  }
  const payload = toPayload(model.value)
  sessionStorage.setItem('bridge_prd_draft', JSON.stringify(payload))
  router.push({
    path: '/prompt-engineer',
    query: model.value.id ? { prdId: String(model.value.id) } : { bridge: 'session' },
  })
}

// AI Architect Bar: Draft Full Specification with Section Queue Status (Phase 13)
const startFullAiDraft = async () => {
  if (!aiTopicPrompt.value.trim() && !model.value.title.trim()) {
    showToast('Please enter an application topic or title to auto-draft.', 'err')
    return
  }

  aiRunningFull.value = true
  aiFullElapsed.value = 0
  aiAbortController = new AbortController()
  if (aiFullInterval) clearInterval(aiFullInterval)
  aiFullInterval = window.setInterval(() => {
    aiFullElapsed.value += 1
  }, 1000)

  // Initialize per-section status queue
  const sectionsToDraft = visibleSections.value
  aiSectionStatuses.value = sectionsToDraft.map((s) => ({
    id: s.id,
    title: s.title,
    status: 'queued',
  }))

  const topic = aiTopicPrompt.value.trim() || model.value.title
  const currentModel = { ...model.value }

  for (let i = 0; i < sectionsToDraft.length; i++) {
    if (!aiRunningFull.value) break // User cancelled

    const secDef = sectionsToDraft[i]!
    const queueItem = aiSectionStatuses.value.find((s) => s.id === secDef.id)
    if (queueItem) queueItem.status = 'running'

    const dependsOnContext: string[] = []
    for (const depId of secDef.dependsOn) {
      if (depId === 'features') {
        const featStr = currentModel.features
          .map((f) => `- **${f.name}** [${f.priority.toUpperCase()}]: ${f.description}`)
          .join('\n')
        if (featStr) dependsOnContext.push(`[features]:\n${featStr}`)
      } else {
        const val = (currentModel[depId as keyof PrdModel] as string) || ''
        if (typeof val === 'string' && val.trim()) {
          dependsOnContext.push(`[${depId}]:\n${val.trim()}`)
        }
      }
    }

    // Specific deterministic guidelines for each section to satisfy quality linter
    let formattingRule = ''
    if (secDef.id === 'features') {
      formattingRule = 'Format: Output 4 to 6 numbered or bulleted items. Each line MUST strictly follow: - **Feature Name** [MVP]: Technical description.'
    } else if (secDef.id === 'data_models') {
      formattingRule = 'Format: Use markdown subheadings (### table_name) with bulleted columns showing (PK, FK, data types, nullability, indices).'
    } else if (secDef.id === 'api_contract') {
      formattingRule = 'Format: Each endpoint MUST start with a valid HTTP method: (GET|POST|PUT|PATCH|DELETE) /path - purpose, parameters, response status.'
    } else if (secDef.id === 'metrics') {
      formattingRule = 'Format: Measurable quantitative SLIs/SLOs with concrete numbers (e.g., P99 < 50ms, 99.99% availability, 10,000 req/sec).'
    } else if (secDef.id === 'non_goals') {
      formattingRule = 'Format: Explicit out-of-scope boundaries to prevent scope creep.'
    }

    const prompt = `Application Scope Topic: "${topic}"
Category: "${model.value.category}"
Context from dependencies:
${dependsOnContext.join('\n\n')}

Target Section: "${secDef.title}"
Section Definition: ${secDef.hint}
${formattingRule}
Write production-grade, deterministic technical content for this section without fluff or generic filler.`

    try {
      const res = await generateWithAI({
        systemPrompt:
          'You are a Principal Software Architect drafting production specifications. Output crisp, technical markdown without fluff.',
        userPrompt: prompt,
      })

      const content = res.content.trim()

      if (secDef.kind === 'text') {
        const existing = (model.value[secDef.id as keyof PrdModel] as string) || ''
        // Empty sections are filled directly; non-empty preserved
        if (!existing.trim()) {
          (model.value[secDef.id as keyof PrdModel] as string) = content
          ;(currentModel[secDef.id as keyof PrdModel] as string) = content
        }
      } else if (secDef.kind === 'list' && secDef.id === 'features') {
        if (model.value.features.length === 0) {
          const parsed = parseFeatures(content)
          if (parsed.length > 0) {
            model.value.features = parsed
            currentModel.features = parsed
          }
        }
      }
      if (queueItem) queueItem.status = 'done'
    } catch {
      if (queueItem) queueItem.status = 'failed'
    }
  }

  if (aiFullInterval) {
    clearInterval(aiFullInterval)
    aiFullInterval = null
  }
  aiRunningFull.value = false
  triggerAutosave()
  showToast('Full specification drafting cycle complete.', 'ok')
}

const cancelFullAiDraft = () => {
  if (aiFullInterval) {
    clearInterval(aiFullInterval)
    aiFullInterval = null
  }
  if (aiAbortController) {
    aiAbortController.abort()
    aiAbortController = null
  }
  aiRunningFull.value = false
  showToast('Cancelled full AI draft.', 'info')
}

// Phase 14: History Snapshots
const loadHistorySnapshots = () => {
  try {
    const raw = localStorage.getItem(`prd.history.${model.value.id || 'new'}`)
    historySnapshots.value = raw ? JSON.parse(raw) : []
  } catch {
    historySnapshots.value = []
  }
}

const recordHistorySnapshot = () => {
  const list = [...historySnapshots.value]
  list.unshift({
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    title: model.value.title,
    model: JSON.parse(JSON.stringify(model.value)),
  })
  // Keep last 10 snapshots per doc
  const trimmed = list.slice(0, 10)
  historySnapshots.value = trimmed
  localStorage.setItem(`prd.history.${model.value.id || 'new'}`, JSON.stringify(trimmed))
}

const restoreSnapshot = (snap: Snapshot) => {
  model.value = JSON.parse(JSON.stringify(snap.model))
  isDirty.value = true
  showHistoryModal.value = false
  showToast(`Restored snapshot from ${snap.timestamp}.`, 'ok')
}

// Global Keybinding (Cmd/Ctrl+S) & beforeunload dirty guard
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    savePrd()
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// Intersection Observer for Active TOC Section Tracking
let observer: IntersectionObserver | null = null
const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('section-', '')
          activeSectionId.value = id
        }
      }
    },
    { threshold: 0.3 },
  )

  for (const def of PRD_SECTIONS) {
    const el = document.getElementById(`section-${def.id}`)
    if (el) observer.observe(el)
  }
}

onMounted(() => {
  const sessionDraft = sessionStorage.getItem('bridge_prd_draft')
  if (sessionDraft) {
    try {
      const parsed = JSON.parse(sessionDraft) as PrdDocument
      loadDocIntoEditor(parsed)
      sessionStorage.removeItem('bridge_prd_draft')
    } catch {
      // ignore
    }
  }
  fetchPrds()
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
  setTimeout(setupIntersectionObserver, 300)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (observer) observer.disconnect()
})

const handleJumpToSection = (id: string) => {
  activeSectionId.value = id
}
</script>

<template>
  <div class="studio-page">
    <!-- Toast Notification -->
    <div v-if="statusToast" class="toast-card" :class="`toast-${statusToast.type}`">
      <span class="toast-dot"></span>
      <span class="font-mono text-xs">{{ statusToast.text }}</span>
    </div>

    <!-- Confirmation Modal for Safe Deletion -->
    <div
      v-if="confirmDeleteDoc"
      class="modal-backdrop"
      @click.self="confirmDeleteDoc = null"
    >
      <div class="delete-modal-dialog">
        <h3 class="delete-modal-title">Hapus dokumen spesifikasi?</h3>
        <p class="delete-modal-desc">
          Apakah Anda yakin ingin menghapus <strong>{{ confirmDeleteDoc.title }}</strong>?
          Tindakan ini akan menghapus dokumen secara permanen.
        </p>
        <div class="delete-modal-actions">
          <button type="button" class="btn-secondary btn-sm" @click="confirmDeleteDoc = null">
            Batal
          </button>
          <button type="button" class="btn-primary btn-sm delete-btn" @click="executeDelete">
            Hapus Dokumen
          </button>
        </div>
      </div>
    </div>

    <!-- History Snapshots Modal -->
    <PrdHistoryModal
      :show="showHistoryModal"
      :snapshots="historySnapshots"
      @close="showHistoryModal = false"
      @restore="restoreSnapshot"
    />

    <!-- Top Workspace Header -->
    <header class="studio-header">
      <div>
        <h1 class="page-title font-serif">Blueprint Studio</h1>
        <p class="page-sub">
          Penyusunan cetak biru dan spesifikasi teknis lengkap dengan bantuan AI dan validasi kualitas.
        </p>
      </div>

      <!-- Button Hierarchy: "Update document" while editing, otherwise "New specification" -->
      <div class="header-actions">
        <div class="mode-switch-group">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: activeMode === 'simple' }"
            @click="setMode('simple')"
          >
            Sederhana
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: activeMode === 'advanced' }"
            @click="setMode('advanced')"
          >
            Lengkap
          </button>
        </div>

        <button
          type="button"
          class="btn-secondary btn-sm"
          @click="startNewSpecification"
        >
          <Plus :size="14" :stroke-width="1.5" />
          <span>Dokumen Baru</span>
        </button>

        <button
          type="button"
          class="btn-secondary btn-sm btn-reverse font-mono"
          title="Impor SQL, Prisma, OpenAPI, atau Docker Compose menjadi Blueprint"
          @click="showReverseModal = true"
        >
          <RotateCcw :size="14" :stroke-width="1.5" />
          <span>Reverse Blueprint</span>
        </button>

        <button
          type="button"
          class="btn-primary btn-sm"
          :disabled="saving"
          @click="savePrd"
        >
          <Save :size="14" :stroke-width="1.5" />
          <span>{{ saving ? 'Menyimpan...' : model.id ? 'Simpan Perubahan' : 'Simpan Dokumen' }}</span>
        </button>
      </div>
    </header>

    <!-- Spec List Table -->
    <PrdSpecTable
      :prds="prds"
      :loading="loading"
      :active-doc-id="model.id"
      :categories="CATEGORIES"
      @select="loadDocIntoEditor"
      @clone="cloneDocument"
      @delete="triggerDeleteModal"
    />

    <!-- Phase 13: AI Architect Bar (Single Row + Provider Select + Full Draft Status) -->
    <section class="ai-architect-bar">
      <div class="ai-bar-single-row">
        <label class="ai-bar-label font-mono">Asisten AI</label>
        <input
          v-model="aiTopicPrompt"
          type="text"
          class="input-base flex-1 font-sans"
          placeholder="Tulis ide atau deskripsi aplikasi untuk generate draf otomatis..."
          @keydown.enter="startFullAiDraft"
        />

        <!-- Provider Select (Dropdown, not a chip) -->
        <select
          v-model="aiStore.state.cloudProvider"
          class="input-select provider-select font-mono"
        >
          <option value="openai">ChatGPT (OpenAI)</option>
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="gemini">Gemini (Google)</option>
          <option value="deepseek">DeepSeek (V3/R1)</option>
          <option value="custom">Custom API</option>
        </select>

        <button
          type="button"
          class="btn-secondary btn-sm"
          :disabled="aiRunningFull"
          @click="startFullAiDraft"
        >
          <Wand2 :size="14" />
          <span>{{ aiRunningFull ? `Menyusun (${aiFullElapsed}s)...` : 'Buat Draf Lengkap' }}</span>
        </button>
      </div>

      <!-- Running Queue Status Drawer -->
      <div v-if="aiRunningFull" class="ai-queue-drawer">
        <div class="queue-header">
          <span class="queue-title font-mono">
            Menyusun dokumen via {{ aiStore.activeProvider }} ({{ aiFullElapsed }}s berjalan)
          </span>
          <button type="button" class="btn-secondary btn-sm" @click="cancelFullAiDraft">
            Batal
          </button>
        </div>
        <div class="queue-items-grid">
          <div
            v-for="st in aiSectionStatuses"
            :key="st.id"
            class="queue-item"
            :class="`status-${st.status}`"
          >
            <span class="queue-sec-name">{{ st.title }}</span>
            <span class="queue-badge font-mono">{{ st.status }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Split-Pane Workspace: Left Modular Editor (7fr) + Right Preview Pane (5fr) -->
    <div class="studio-split-grid">
      <!-- Left Column: Modular Editor Form (7fr) -->
      <section class="editor-column" aria-label="Specification editor">
        <!-- Editor Toolbar -->
        <div class="editor-toolbar">
          <div class="editor-meta">
            <span class="doc-badge font-mono">
              {{ model.is_preset ? 'TEMPLATE CONTOH' : 'DRAFT SAYA' }}
            </span>
            <h2 class="doc-title-editor font-serif">{{ model.title || 'Spesifikasi Tanpa Judul' }}</h2>
          </div>

          <div class="editor-actions">
            <!-- Dirty State Badge -->
            <span v-if="isDirty" class="dirty-badge">
              <span class="dirty-dot"></span>
              <span>Belum disimpan</span>
            </span>

            <!-- Completeness Ratio -->
            <span class="completeness-label font-mono">{{ completeness.label }}</span>

            <!-- Version History Button -->
            <button
              type="button"
              class="icon-action-btn"
              title="Riwayat versi dokumen"
              @click="showHistoryModal = true"
            >
              <History :size="14" />
            </button>

            <!-- Phase 13: Bridge to Prompt Button (Gated by Lint Errors) -->
            <div class="bridge-button-wrapper">
              <button
                type="button"
                class="btn-secondary btn-sm bridge-btn"
                :disabled="hasLintErrors"
                :title="hasLintErrors ? `Lengkapi ${lintErrors.length} bagian yang wajib sebelum membuat prompt` : 'Buat prompt teknis untuk coding AI'"
                @click="sendToPromptEngineer"
              >
                <span>Buat Prompt AI</span>
                <ArrowRight :size="13" />
              </button>
              <span v-if="hasLintErrors" class="bridge-error-tooltip">
                <AlertCircle :size="12" />
                <span>{{ lintErrors[0]?.message }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Meta Inputs (Title & Category) -->
        <div class="meta-row-card">
          <div class="meta-field flex-2">
            <label class="meta-label">Judul Dokumen</label>
            <input
              v-model="model.title"
              type="text"
              class="input-base font-sans"
              placeholder="Contoh: Aplikasi Pengelolaan Gudang & Kasir Pintar"
              @input="triggerAutosave"
            />
          </div>

          <div class="meta-field flex-1">
            <label class="meta-label">Kategori</label>
            <select
              v-model="model.category"
              class="input-select font-sans"
              @change="triggerAutosave"
            >
              <option v-for="cat in FORM_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <!-- Section Editors (Iterates over visible sections based on Simple/Advanced mode) -->
        <div class="sections-stream">
          <template v-for="def in visibleSections" :key="def.id">
            <SectionEditor
              :def="def"
              :model-value="def.kind === 'list' ? model.features : (model[def.id as keyof PrdModel] as string)"
              :model-context="model"
              :active-mode="activeMode"
              @update:model-value="(val) => {
                if (def.kind === 'list') {
                  model.features = val as any
                } else {
                  (model[def.id as keyof PrdModel] as string) = val as string
                }
                triggerAutosave()
              }"
              @dirty="triggerAutosave"
            />

            <!-- In Simple mode, show clear transition card right after Section 06 (metrics) and before Section 11 (non_goals) -->
            <div
              v-if="activeMode === 'simple' && def.id === 'metrics'"
              class="mode-hidden-banner"
            >
              <div class="hidden-banner-content">
                <div class="hidden-banner-badge font-mono">BAGIAN 07–10 TERSEMBUNYI DI MODE SEDERHANA</div>
                <p class="hidden-banner-desc">
                  Bagian arsitektur teknis (<strong>07 Teknologi</strong>, <strong>08 Model data</strong>, <strong>09 Kontrak API</strong>, <strong>10 Kualitas/NFR</strong>) disembunyikan dalam mode Sederhana.
                </p>
                <div v-if="hasTechnicalContent" class="hidden-banner-notice font-mono">
                  ● Catatan: Ada data arsitektur teknis yang tersimpan di dokumen ini.
                </div>
              </div>
              <button
                type="button"
                class="btn-secondary btn-sm switch-advanced-btn"
                @click="setMode('advanced')"
              >
                <span>Beralih ke Mode Lengkap</span>
                <ArrowRight :size="13" />
              </button>
            </div>
          </template>
        </div>
      </section>

      <!-- Right Column: Interactive Sticky Preview Pane (5fr) -->
      <PreviewPane
        :model="model"
        :active-mode="activeMode"
        :issues="lintIssues"
        :active-section-id="activeSectionId"
        @navigate-to-section="handleJumpToSection"
        @switch-to-advanced="setMode('advanced')"
        @apply-grill-fixes="handleApplyGrillFixes"
      />
    </div>

    <!-- Reverse Blueprint Modal -->
    <ReverseBlueprintModal
      :is-open="showReverseModal"
      @close="showReverseModal = false"
      @apply-model="handleApplyReverseModel"
    />
  </div>
</template>

<style scoped>
.studio-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: relative;
}

/* Toast Notification */
.toast-card {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 900;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.toast-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--ok);
}

.toast-err .toast-dot {
  background-color: var(--danger);
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: var(--scrim-modal, rgba(0, 0, 0, 0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.delete-modal-dialog,
.history-modal-dialog {
  width: 100%;
  max-width: 460px;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}

.delete-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.delete-modal-desc {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 0;
}

.delete-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.delete-btn {
  background-color: var(--danger);
  border-color: var(--danger);
  color: var(--bg);
}

/* History Modal */
.history-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.history-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-3);
  font-size: 13px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.history-time {
  font-size: 11px;
  color: var(--accent);
  display: block;
}

.history-title {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

/* Header */
.studio-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--rule);
  gap: 20px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.1;
  color: var(--text);
}

.page-sub {
  margin: 6px 0 0;
  font-size: 15px;
  color: var(--text-2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Simple vs Advanced Mode Switcher */
.mode-switch-group {
  display: flex;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--elevated);
  overflow: hidden;
}

.mode-btn {
  height: 32px;
  padding: 0 12px;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.12s ease, background-color 0.12s ease;
}

.mode-btn.active {
  background-color: var(--hover);
  color: var(--text);
  font-weight: 600;
}

/* Phase 12: Consolidated Toolbar Row */
.table-section {
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  overflow: hidden;
}

.consolidated-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  flex-wrap: wrap;
}

.source-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.source-tab-btn {
  height: 30px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-3);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
}

.source-tab-btn:hover {
  color: var(--text);
}

.source-tab-btn.active {
  background-color: var(--surface);
  border-color: var(--rule);
  color: var(--text);
  font-weight: 600;
}

.cat-select {
  height: 32px;
  font-size: 12px;
  width: 170px;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  height: 32px;
  padding-left: 32px;
  font-size: 12px;
  width: 100%;
}

/* Table */
.table-scroll-wrap {
  overflow-x: auto;
  outline: none;
}

.col-title {
  width: auto;
}
.col-cat {
  width: 160px;
}
.col-source {
  width: 100px;
}
.col-status {
  width: 120px;
}
.col-date {
  width: 120px;
}
.col-actions {
  width: 44px;
}

.cell-title {
  font-weight: 500;
  color: var(--text);
}

.doc-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-cat,
.cell-date {
  color: var(--text-2);
  font-size: 13px;
}

.cell-actions {
  text-align: right;
}

.menu-relative {
  position: relative;
  display: inline-block;
}

.icon-action-btn,
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: var(--elevated);
  color: var(--text-2);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease, background-color 0.12s ease;
}

.icon-action-btn:hover:not(:disabled),
.icon-btn:hover:not(:disabled) {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.icon-action-btn:focus-visible,
.icon-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.overflow-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  z-index: 50;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: color 0.12s ease, background-color 0.12s ease;
}

.dropdown-item:hover {
  background-color: var(--hover);
  color: var(--text);
}

.dropdown-delete:hover {
  color: var(--danger);
}

/* Phase 13: AI Architect Bar */
.ai-architect-bar {
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--elevated);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-bar-single-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ai-bar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  white-space: nowrap;
}

.provider-select {
  height: 36px;
  font-size: 12px;
  width: 170px;
}

.ai-queue-drawer {
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queue-title {
  font-size: 12px;
  color: var(--accent);
}

.queue-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 11px;
}

.queue-sec-name {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-running {
  border-color: var(--accent);
  color: var(--accent);
}

.status-done {
  border-color: var(--ok);
  color: var(--ok);
}

.status-failed {
  border-color: var(--danger);
  color: var(--danger);
}

/* Split-Pane 7fr / 5fr Grid */
.studio-split-grid {
  display: grid;
  grid-template-columns: minmax(520px, 7fr) minmax(420px, 5fr);
  gap: 28px;
  align-items: start;
}

@media (max-width: 1040px) {
  .studio-split-grid {
    grid-template-columns: 1fr;
  }
}

/* Left Editor Column */
.editor-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  gap: 12px;
  flex-wrap: wrap;
}

.editor-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-badge {
  font-size: 11px;
  color: var(--text-3);
}

.doc-title-editor {
  margin: 0;
  font-size: 22px;
  color: var(--text);
  line-height: 1.2;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dirty-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--warn);
}

.dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--warn);
}

.completeness-label {
  font-size: 12px;
  color: var(--text-3);
}

.bridge-button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.bridge-error-tooltip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--danger);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Meta Inputs Card */
.meta-row-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flex-1 {
  flex: 1;
}

.flex-2 {
  flex: 2;
}

.meta-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
}

/* Stream of Section Editors */
.sections-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Mode Hidden Banner (Sections 07-10 in Simple Mode) */
.mode-hidden-banner {
  border: 1px dashed var(--rule-strong);
  border-radius: var(--radius);
  background-color: var(--elevated);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hidden-banner-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hidden-banner-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--warn);
}

.hidden-banner-desc {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}

.hidden-banner-desc strong {
  color: var(--text);
}

.hidden-banner-notice {
  font-size: 12px;
  color: var(--ok);
}

.switch-advanced-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
