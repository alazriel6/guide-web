<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Terminal,
  Download,
  Copy,
  Check,
  Sparkles,
} from 'lucide-vue-next'
import type { PrdModel } from '@/lib/prd/sections'
import {
  SCAFFOLD_TARGETS,
  getScaffoldTarget,
  generateWindowsBatchScript,
  generateBashScript,
  type ScaffoldTargetId,
} from '@/lib/prd/scaffoldGenerator'

interface Props {
  model: PrdModel
  isOpen: boolean
  initialTargetId?: ScaffoldTargetId
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Active selections
const selectedTargetId = ref<ScaffoldTargetId>(props.initialTargetId || 'fullstack-go-vue')
const selectedScriptType = ref<'bat' | 'sh'>('bat')
const activeCategoryFilter = ref<string>('All')
const copiedNotice = ref(false)

watch(
  () => props.initialTargetId,
  (newVal) => {
    if (newVal) {
      selectedTargetId.value = newVal
    }
  },
)

const categories = ['All', 'Full-Stack', 'Frontend', 'BaaS & Cloud']

const filteredTargets = computed(() => {
  if (activeCategoryFilter.value === 'All') return SCAFFOLD_TARGETS
  return SCAFFOLD_TARGETS.filter((t) => t.category === activeCategoryFilter.value)
})

const currentTarget = computed(() => getScaffoldTarget(selectedTargetId.value))

const generatedScriptContent = computed(() => {
  if (selectedScriptType.value === 'sh') {
    return generateBashScript(props.model, selectedTargetId.value)
  }
  return generateWindowsBatchScript(props.model, selectedTargetId.value)
})

const scriptFilename = computed(() => {
  return selectedScriptType.value === 'bat' ? 'setup.bat' : 'setup.sh'
})

const copyScript = async () => {
  await navigator.clipboard.writeText(generatedScriptContent.value)
  copiedNotice.value = true
  setTimeout(() => {
    copiedNotice.value = false
  }, 1600)
}

const downloadScript = () => {
  const content = generatedScriptContent.value
  const filename = scriptFilename.value
  const mime = selectedScriptType.value === 'bat' ? 'application/x-bat' : 'application/x-sh'

  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-if="isOpen" class="scaffold-modal-backdrop" @click.self="emit('close')">
    <div class="scaffold-modal-card" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-title-group">
          <Terminal :size="16" class="header-icon" />
          <h2 class="modal-title">1-Click Project Repo Scaffolder</h2>
          <span class="header-badge font-mono">setup.bat &amp; setup.sh</span>
        </div>
        <button
          type="button"
          class="close-btn"
          title="Close dialog"
          @click="emit('close')"
        >
          <X :size="16" />
        </button>
      </div>

      <p class="modal-subtitle">
        Generate an automated initialization script. Double-click <code>setup.bat</code> on Windows (or run <code>setup.sh</code> on Linux/Mac) to scaffold your workspace, directories, AI agent rules (Antigravity/Cursor), OpenAPI spec, and SQL database migrations in 15 seconds.
      </p>

      <div class="modal-body">
        <!-- Left Column: Stack & Target Options -->
        <div class="options-column">
          <!-- Category Filter Tabs -->
          <div class="category-tabs font-mono">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="cat-tab"
              :class="{ active: activeCategoryFilter === cat }"
              @click="activeCategoryFilter = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Target Stack Grid -->
          <div class="targets-list">
            <button
              v-for="target in filteredTargets"
              :key="target.id"
              type="button"
              class="target-card"
              :class="{ active: selectedTargetId === target.id }"
              @click="selectedTargetId = target.id"
            >
              <div class="target-card-top">
                <span class="target-badge font-mono">{{ target.badge }}</span>
                <span class="target-cat font-mono">{{ target.category }}</span>
              </div>
              <h3 class="target-name">{{ target.name }}</h3>
              <p class="target-desc">{{ target.description }}</p>
              <div class="target-tags">
                <span v-for="tag in target.tags.slice(0, 4)" :key="tag" class="target-tag font-mono">
                  {{ tag }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Right Column: Script Format, Preview & Download -->
        <div class="preview-column">
          <!-- Script Format Selector -->
          <div class="script-format-row">
            <div class="script-type-toggles">
              <button
                type="button"
                class="script-type-btn font-mono"
                :class="{ active: selectedScriptType === 'bat' }"
                @click="selectedScriptType = 'bat'"
              >
                <span>⚡ Windows Batch (setup.bat)</span>
              </button>
              <button
                type="button"
                class="script-type-btn font-mono"
                :class="{ active: selectedScriptType === 'sh' }"
                @click="selectedScriptType = 'sh'"
              >
                <span>🐧 Linux / macOS (setup.sh)</span>
              </button>
            </div>

            <div class="action-btn-group">
              <button
                type="button"
                class="btn-secondary btn-sm"
                @click="copyScript"
              >
                <Check v-if="copiedNotice" :size="12" />
                <Copy v-else :size="12" />
                <span>{{ copiedNotice ? 'Copied' : 'Copy script' }}</span>
              </button>

              <button
                type="button"
                class="btn-primary btn-sm highlight-btn"
                @click="downloadScript"
              >
                <Download :size="12" />
                <span class="font-mono">Download {{ scriptFilename }}</span>
              </button>
            </div>
          </div>

          <!-- Execution Instructions Card -->
          <div class="quick-guide-box font-mono">
            <div class="guide-title">
              <Sparkles :size="12" />
              <span>HOW TO EXECUTE:</span>
            </div>
            <ol class="guide-steps">
              <li>Save <strong>{{ scriptFilename }}</strong> into an empty project folder.</li>
              <li>
                <span v-if="selectedScriptType === 'bat'">Double-click <strong>setup.bat</strong> (or run in CMD / PowerShell).</span>
                <span v-else>Run <code>chmod +x setup.sh &amp;&amp; ./setup.sh</code> in terminal.</span>
              </li>
              <li>Open in Cursor or VS Code — your AI agents (<strong>AGENTS.md</strong> &amp; <strong>.cursorrules</strong>), QA Test Suite (<strong>tests/api.http</strong>), Master QA Plan (<strong>docs/QA_TEST_PLAN.md</strong>), and DB Runner (<strong>docker-compose.yml</strong> &amp; <strong>dev.bat</strong>) are immediately ready!</li>
            </ol>
          </div>

          <!-- Code Viewport -->
          <div class="script-viewport">
            <div class="viewport-header font-mono">
              <span>{{ scriptFilename }} - {{ currentTarget.name }}</span>
              <span class="file-size font-mono">{{ generatedScriptContent.split('\n').length }} lines</span>
            </div>
            <pre class="script-code font-mono"><code>{{ generatedScriptContent }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scaffold-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.scaffold-modal-card {
  width: 100%;
  max-width: 1080px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--rule);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--accent);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.header-badge {
  font-size: 11px;
  padding: 2px 7px;
  background-color: var(--hover);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--accent);
}

.close-btn {
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
  transition: all 0.12s ease;
}

.close-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.modal-subtitle {
  font-size: 12.5px;
  color: var(--text-2);
  padding: 10px 20px;
  margin: 0;
  line-height: 1.5;
  border-bottom: 1px solid var(--rule);
  background-color: var(--elevated);
}

.modal-subtitle code {
  color: var(--accent);
  background-color: var(--surface);
  padding: 1px 5px;
  border-radius: var(--radius);
  font-family: var(--font-mono);
}

.modal-body {
  display: grid;
  grid-template-columns: 360px 1fr;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 900px) {
  .modal-body {
    grid-template-columns: 1fr;
  }
}

/* Left Column: Stack Targets */
.options-column {
  border-right: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--surface);
}

.category-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--rule);
  overflow-x: auto;
}

.cat-tab {
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s ease;
}

.cat-tab:hover {
  color: var(--text);
  border-color: var(--rule-strong);
}

.cat-tab.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.targets-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.target-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: all 0.12s ease;
}

.target-card:hover {
  background-color: var(--hover);
  border-color: var(--rule-strong);
}

.target-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(255, 122, 69, 0.25);
  background-color: var(--hover);
}

.target-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.target-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}

.target-cat {
  font-size: 10px;
  color: var(--text-3);
}

.target-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.target-desc {
  font-size: 11px;
  color: var(--text-2);
  margin: 0;
  line-height: 1.4;
}

.target-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.target-tag {
  font-size: 9.5px;
  padding: 1px 5px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-3);
}

/* Right Column: Preview & Download */
.preview-column {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--elevated);
  padding: 14px 18px;
  gap: 12px;
}

.script-format-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.script-type-toggles {
  display: flex;
  align-items: center;
  gap: 6px;
}

.script-type-btn {
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.script-type-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.script-type-btn.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.action-btn-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.highlight-btn {
  background-color: var(--accent) !important;
  color: #ffffff !important;
  font-weight: 600;
  border-color: var(--accent) !important;
}

.highlight-btn:hover {
  opacity: 0.9;
}

.quick-guide-box {
  padding: 8px 12px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 11px;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}

.guide-steps {
  margin: 0;
  padding-left: 18px;
  color: var(--text-2);
  line-height: 1.5;
}

.guide-steps strong {
  color: var(--text);
}

.guide-steps code {
  color: var(--accent);
  background-color: var(--elevated);
  padding: 1px 4px;
  border-radius: var(--radius);
}

.script-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
}

.viewport-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background-color: var(--hover);
  border-bottom: 1px solid var(--rule);
  font-size: 11px;
  color: var(--text-2);
}

.file-size {
  color: var(--text-3);
}

.script-code {
  flex: 1;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text);
  white-space: pre;
}
</style>
