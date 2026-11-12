<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  Wand2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  X,
  Play,
  Eye,
  Edit3,
} from 'lucide-vue-next'
import type { SectionDef, FeatureItem, PrdModel, PrdStudioMode } from '@/lib/prd/sections'
import { renderMarkdown } from '@/lib/prd/markdown'
import { generateWithAI } from '@/services/aiService'

interface Props {
  def: SectionDef
  modelValue: string | FeatureItem[]
  modelContext: PrdModel
  activeMode?: PrdStudioMode
}

const props = withDefaults(defineProps<Props>(), {
  activeMode: 'simple',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | FeatureItem[]): void
  (e: 'dirty'): void
}>()

// Active Mode for Text: 'write' | 'preview'
const viewMode = ref<'write' | 'preview'>('write')

// Textarea DOM ref for auto-grow
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// History stack for Undo (Cmd/Ctrl+Z)
const preDraftHistory = ref<string | null>(null)

// AI Draft Flow State
const aiLoading = ref(false)
const aiError = ref<string | null>(null)
const aiElapsed = ref(0)
let timerInterval: number | null = null

// Proposed Diff State
interface DiffLine {
  type: 'same' | 'added' | 'removed'
  text: string
}
const proposedDiff = ref<{
  original: string
  incoming: string
  lines: DiffLine[]
} | null>(null)

// Format section number: 1 -> "01"
const formattedOrder = computed(() => {
  return props.def.order.toString().padStart(2, '0')
})

// Current Text / List values
const textContent = computed<string>({
  get() {
    return typeof props.modelValue === 'string' ? props.modelValue : ''
  },
  set(val: string) {
    emit('update:modelValue', val)
    emit('dirty')
  },
})

const featureList = computed<FeatureItem[]>({
  get() {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  },
  set(val: FeatureItem[]) {
    emit('update:modelValue', val)
    emit('dirty')
  },
})

// Character / Item Count
const countLabel = computed(() => {
  if (props.def.kind === 'list') {
    const count = featureList.value.length
    return `${count} ${count === 1 ? 'item' : 'items'}`
  }
  const chars = textContent.value.trim().length
  return `${chars} chars`
})

// State Dot: 'empty' | 'short' | 'ok'
const stateDot = computed<'empty' | 'short' | 'ok'>(() => {
  if (props.def.kind === 'list') {
    if (featureList.value.length === 0) return 'empty'
    const hasMvp = featureList.value.some((f) => f.priority === 'mvp')
    return hasMvp ? 'ok' : 'short'
  }
  const len = textContent.value.trim().length
  if (len === 0) return 'empty'
  if (props.def.minChars > 0 && len < props.def.minChars) return 'short'
  return 'ok'
})

// Memoized preview markdown
const renderedPreviewHtml = computed(() => {
  return renderMarkdown(textContent.value || props.def.placeholder)
})

// Auto-grow textarea
const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    const newHeight = Math.min(520, Math.max(88, textareaRef.value.scrollHeight))
    textareaRef.value.style.height = `${newHeight}px`
  }
}

watch(textContent, () => {
  nextTick(adjustTextareaHeight)
})

// List kind actions
const addFeatureItem = () => {
  const current = [...featureList.value]
  current.push({
    name: '',
    description: '',
    priority: 'mvp',
  })
  featureList.value = current
}

const removeFeatureItem = (index: number) => {
  const current = [...featureList.value]
  current.splice(index, 1)
  featureList.value = current
}

const moveFeatureItem = (index: number, direction: 'up' | 'down') => {
  const current = [...featureList.value]
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= current.length) return
  const temp = current[index]!
  current[index] = current[targetIndex]!
  current[targetIndex] = temp
  featureList.value = current
}

const handleKeydown = (e: KeyboardEvent, index: number) => {
  if (e.altKey && e.key === 'ArrowUp') {
    e.preventDefault()
    moveFeatureItem(index, 'up')
  } else if (e.altKey && e.key === 'ArrowDown') {
    e.preventDefault()
    moveFeatureItem(index, 'down')
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    addFeatureItem()
  }
}

// Compute simple line-based diff
function computeDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.split(/\r?\n/)
  const newLines = newStr.split(/\r?\n/)
  const lines: DiffLine[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]
    const n = newLines[i]

    if (o === n && o !== undefined) {
      lines.push({ type: 'same', text: o })
    } else {
      if (o !== undefined) {
        lines.push({ type: 'removed', text: o })
      }
      if (n !== undefined) {
        lines.push({ type: 'added', text: n })
      }
    }
  }

  return lines
}

// AI Draft Flow
const startAiTimer = () => {
  aiElapsed.value = 0
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = window.setInterval(() => {
    aiElapsed.value += 1
  }, 1000)
}

const stopAiTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const cancelAiDraft = () => {
  stopAiTimer()
  aiLoading.value = false
  aiError.value = null
}

const triggerAiDraft = async () => {
  aiLoading.value = true
  aiError.value = null
  startAiTimer()

  // Gather context from dependsOn sections
  const contextParts: string[] = []
  contextParts.push(`Product Title: "${props.modelContext.title || 'Untitled'}"`)
  contextParts.push(`Category: "${props.modelContext.category}"`)

  for (const depId of props.def.dependsOn) {
    if (depId === 'features') {
      const featStr = props.modelContext.features
        .map((f) => `- ${f.name} (${f.priority}): ${f.description}`)
        .join('\n')
      if (featStr) contextParts.push(`Features Context:\n${featStr}`)
    } else {
      const val = (props.modelContext[depId as keyof PrdModel] as string) || ''
      if (val.trim()) {
        contextParts.push(`Context [${depId}]:\n${val.trim()}`)
      }
    }
  }

  // Specific deterministic guidelines for each section
  let formattingRule = ''
  if (props.def.id === 'features') {
    formattingRule = 'Format: Output 4 to 6 features. Each line MUST strictly follow: - **Feature Name**: Detailed technical description of capability.'
  } else if (props.def.id === 'data_models') {
    formattingRule = 'Format: Use markdown subheadings (### table_name) with bulleted columns showing (PK, FK, data types, nullability, indices).'
  } else if (props.def.id === 'api_contract') {
    formattingRule = 'Format: Each endpoint MUST start with a valid HTTP method: (GET|POST|PUT|PATCH|DELETE) /path - purpose, parameters, response status.'
  } else if (props.def.id === 'metrics') {
    formattingRule = 'Format: Quantifiable metrics with concrete numbers (e.g., P99 < 50ms, 99.9% uptime, 5,000 req/sec).'
  } else if (props.def.id === 'non_goals') {
    formattingRule = 'Format: Bulleted explicit exclusions to prevent scope creep.'
  }

  const prompt = `Context:\n${contextParts.join('\n\n')}

Target Section: "${props.def.title}"
Section Purpose: ${props.def.hint}
${formattingRule}
Instructions:
Write ONLY the content for "${props.def.title}".
Format: Concise, deterministic, production-grade technical specification. Avoid generic filler words like "fast", "modern", "seamless".`

  try {
    const res = await generateWithAI({
      systemPrompt:
        'You are a Principal Software Architect writing production specifications. Output crisp, unambiguous, numbered or bulleted markdown directly.',
      userPrompt: prompt,
    })

    const generated = res.content.trim()

    if (props.def.kind === 'text') {
      const current = textContent.value.trim()
      if (!current) {
        // Direct fill
        preDraftHistory.value = textContent.value
        textContent.value = generated
      } else {
        // Show inline diff
        const diffLines = computeDiff(current, generated)
        proposedDiff.value = {
          original: current,
          incoming: generated,
          lines: diffLines,
        }
      }
    } else {
      // List kind (features)
      // Parse generated lines
      const lines = generated.split(/\r?\n/)
      const newItems: FeatureItem[] = []
      for (const line of lines) {
        const m = line.match(/^[-*\d.]+\s*(?:\*\*(.*?)\*\*)?\s*:?\s*(.*)$/)
        if (m) {
          const name = ((m[1] || m[2] || 'Feature') as string).trim()
          const desc = (m[1] ? (m[2] || '') : '').trim()
          if (name) {
            newItems.push({ name, description: desc, priority: 'mvp' })
          }
        }
      }
      if (newItems.length > 0) {
        if (featureList.value.length === 0) {
          featureList.value = newItems
        } else {
          // Append new items
          featureList.value = [...featureList.value, ...newItems]
        }
      }
    }
  } catch (err) {
    aiError.value = err instanceof Error ? err.message : 'AI generation failed'
  } finally {
    stopAiTimer()
    aiLoading.value = false
  }
}

// Diff Actions
const acceptDiff = () => {
  if (proposedDiff.value) {
    preDraftHistory.value = textContent.value
    textContent.value = proposedDiff.value.incoming
    proposedDiff.value = null
  }
}

const discardDiff = () => {
  proposedDiff.value = null
}

const restorePreDraft = () => {
  if (preDraftHistory.value !== null) {
    textContent.value = preDraftHistory.value
    preDraftHistory.value = null
  }
}
</script>

<template>
  <div class="section-editor-card" :id="`section-${def.id}`">
    <!-- Header Row -->
    <header class="card-header">
      <div class="header-left">
        <span class="order-num font-mono">{{ formattedOrder }}</span>
        <h3 class="section-title">{{ def.title }}</h3>
      </div>

      <div class="header-right">
        <!-- Text View Mode Toggle -->
        <div v-if="def.kind === 'text'" class="view-toggle">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: viewMode === 'write' }"
            @click="viewMode = 'write'"
          >
            <Edit3 :size="12" />
            <span>Tulis</span>
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: viewMode === 'preview' }"
            @click="viewMode = 'preview'"
          >
            <Eye :size="12" />
            <span>Pratinjau</span>
          </button>
        </div>

        <span class="char-count font-mono">{{ countLabel }}</span>

        <!-- State Dot: empty / short / ok -->
        <span
          class="state-dot"
          :class="{
            'dot-empty': stateDot === 'empty',
            'dot-short': stateDot === 'short',
            'dot-ok': stateDot === 'ok',
          }"
          :title="stateDot"
        ></span>

        <!-- Undo Restore Button -->
        <button
          v-if="preDraftHistory !== null"
          type="button"
          class="btn-tertiary undo-btn"
          title="Batalkan draf AI"
          @click="restorePreDraft"
        >
          <RotateCcw :size="13" />
          <span>Urungkan</span>
        </button>

        <!-- AI Draft Tertiary Trigger -->
        <div class="ai-ctrl">
          <template v-if="aiLoading">
            <span class="ai-timer font-mono">{{ aiElapsed }}s</span>
            <button type="button" class="btn-tertiary cancel-btn" @click="cancelAiDraft">
              Batal
            </button>
          </template>
          <button
            v-else
            type="button"
            class="btn-tertiary ai-btn"
            :disabled="aiLoading"
            @click="triggerAiDraft"
          >
            <Wand2 :size="13" />
            <span>Bantuan AI</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Hint Row -->
    <p class="section-hint">{{ def.hint }}</p>

    <!-- AI Error Banner -->
    <div v-if="aiError" class="ai-error-banner">
      <span class="error-msg font-mono">{{ aiError }}</span>
      <button type="button" class="btn-secondary btn-sm" @click="triggerAiDraft">
        <Play :size="11" />
        <span>Coba Lagi</span>
      </button>
    </div>

    <!-- Proposed Diff View (when overwriting non-empty text) -->
    <div v-if="proposedDiff" class="diff-container">
      <div class="diff-header">
        <span class="diff-title">Saran Perubahan AI</span>
        <div class="diff-actions">
          <button type="button" class="btn-secondary btn-sm" @click="discardDiff">
            <X :size="12" />
            <span>Tolak</span>
          </button>
          <button type="button" class="btn-primary btn-sm" @click="acceptDiff">
            <Check :size="12" />
            <span>Terapkan Perubahan</span>
          </button>
        </div>
      </div>
      <div class="diff-lines-box font-mono">
        <div
          v-for="(line, idx) in proposedDiff.lines"
          :key="idx"
          class="diff-line"
          :class="`line-${line.type}`"
        >
          <span class="diff-prefix">{{
            line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '
          }}</span>
          <span class="diff-text">{{ line.text }}</span>
        </div>
      </div>
    </div>

    <!-- Section Body: TEXT KIND -->
    <div v-if="def.kind === 'text'" class="card-body">
      <!-- Write View -->
      <textarea
        v-if="viewMode === 'write'"
        ref="textareaRef"
        v-model="textContent"
        class="auto-textarea font-sans"
        :placeholder="def.placeholder"
        @keydown.ctrl.z.prevent="restorePreDraft"
        @keydown.meta.z.prevent="restorePreDraft"
      ></textarea>

      <!-- Preview View -->
      <div
        v-else
        class="rendered-preview-box"
        v-html="renderedPreviewHtml"
      ></div>
    </div>

    <!-- Section Body: LIST KIND (features) -->
    <div v-else class="card-body list-body">
      <div v-if="featureList.length === 0" class="empty-list-placeholder">
        <p>Belum ada fitur yang ditentukan. Tambahkan fitur atau gunakan bantuan AI.</p>
        <button type="button" class="btn-secondary btn-sm" @click="addFeatureItem">
          <Plus :size="13" />
          <span>Tambah Fitur</span>
        </button>
      </div>

      <div v-else class="feature-rows-container">
        <div
          v-for="(item, index) in featureList"
          :key="index"
          class="feature-row"
        >
          <div class="row-reorder-ctrl">
            <button
              type="button"
              class="icon-action-btn"
              :disabled="index === 0"
              title="Move up (Alt+Up)"
              @click="moveFeatureItem(index, 'up')"
            >
              <ArrowUp :size="12" />
            </button>
            <button
              type="button"
              class="icon-action-btn"
              :disabled="index === featureList.length - 1"
              title="Move down (Alt+Down)"
              @click="moveFeatureItem(index, 'down')"
            >
              <ArrowDown :size="12" />
            </button>
          </div>

          <div class="row-inputs-grid">
            <div class="row-top-line">
              <input
                v-model="item.name"
                type="text"
                class="input-base row-name-input font-mono"
                placeholder="Feature capability name..."
                @keydown="handleKeydown($event, index)"
              />
              <select
                v-model="item.priority"
                class="input-select priority-select font-mono"
              >
                <option value="mvp">MVP</option>
                <option value="later">Later</option>
              </select>
            </div>

            <textarea
              v-model="item.description"
              rows="2"
              class="input-textarea row-desc-input font-sans"
              placeholder="Deterministic functional scope and user outcome..."
              @keydown="handleKeydown($event, index)"
            ></textarea>
          </div>

          <button
            type="button"
            class="icon-action-btn remove-btn"
            title="Remove item"
            @click="removeFeatureItem(index)"
          >
            <Trash2 :size="13" />
          </button>
        </div>

        <button type="button" class="btn-secondary btn-sm add-row-btn" @click="addFeatureItem">
          <Plus :size="13" />
          <span>Add feature (Enter)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-editor-card {
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-margin-top: 24px;
  transition: border-color 0.12s ease;
}

.section-editor-card:focus-within {
  border-color: var(--rule-strong);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.order-num {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  align-items: center;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--elevated);
  overflow: hidden;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.12s ease, background-color 0.12s ease;
}

.toggle-btn.active {
  background-color: var(--hover);
  color: var(--text);
  font-weight: 500;
}

.char-count {
  font-size: 12px;
  color: var(--text-3);
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-empty {
  background-color: var(--text-3);
}

.dot-short {
  background-color: var(--warn);
}

.dot-ok {
  background-color: var(--ok);
}

.section-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
}

/* AI Control */
.ai-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-timer {
  font-size: 12px;
  color: var(--accent);
}

.cancel-btn {
  color: var(--danger);
  font-size: 12px;
}

.ai-btn {
  font-size: 12px;
}

.undo-btn {
  font-size: 12px;
  color: var(--warn);
}

/* AI Error Banner */
.ai-error-banner {
  padding: 8px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.error-msg {
  font-size: 12px;
  color: var(--danger);
}

/* Diff View */
.diff-container {
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  background-color: var(--elevated);
  overflow: hidden;
}

.diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
}

.diff-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.diff-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.diff-lines-box {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.diff-line {
  display: flex;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.line-added {
  color: var(--ok);
  background-color: rgba(62, 207, 142, 0.1);
}

.line-removed {
  color: var(--danger);
  background-color: rgba(240, 106, 98, 0.1);
  text-decoration: line-through;
}

.line-same {
  color: var(--text-2);
}

.diff-prefix {
  user-select: none;
  font-weight: bold;
}

/* Card Body */
.card-body {
  width: 100%;
}

.auto-textarea {
  width: 100%;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  line-height: 1.65;
  padding: 10px 12px;
  outline: none;
  min-height: 88px;
  max-height: 520px;
  resize: none;
  overflow-y: auto;
  field-sizing: content;
  transition: border-color 0.12s ease;
}

.auto-textarea:focus {
  border-color: var(--rule-strong);
}

.rendered-preview-box {
  padding: 12px 14px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.65;
  color: var(--text);
  min-height: 88px;
}

/* Feature List Editor */
.list-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-list-placeholder {
  padding: 24px;
  background-color: var(--elevated);
  border: 1px dashed var(--rule);
  border-radius: var(--radius);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-3);
  font-size: 13px;
}

.feature-rows-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.row-reorder-ctrl {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
}

.icon-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.12s ease, background-color 0.12s ease;
}

.icon-action-btn:hover:not(:disabled) {
  color: var(--text);
  background-color: var(--hover);
}

.icon-action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.remove-btn:hover:not(:disabled) {
  color: var(--danger);
}

.row-inputs-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row-top-line {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 8px;
}

.row-name-input {
  height: 36px;
  font-size: 13px;
}

.priority-select {
  height: 36px;
  font-size: 12px;
  padding: 0 8px;
}

.row-desc-input {
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.add-row-btn {
  align-self: flex-start;
}
</style>
