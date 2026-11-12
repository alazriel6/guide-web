<script setup lang="ts">
import { ref } from 'vue'
import { X, Check, Play, Eye, EyeOff, RefreshCw, Cpu, Settings, Globe } from 'lucide-vue-next'
import {
  useAiConfigStore,
  type LocalProvider,
  type CloudProvider,
} from '@/stores/aiConfig'
import { generateWithAI, fetchAvailableModels } from '@/services/aiService'

const aiStore = useAiConfigStore()

const showKey = ref(false)
const testing = ref(false)
const testResult = ref<{ ok: boolean; message: string } | null>(null)
const savedNotice = ref(false)
const detectingModels = ref(false)
const detectedModels = ref<string[]>([])
const detectNotice = ref<{ ok: boolean; message: string } | null>(null)

const selectLocalProvider = (provider: LocalProvider) => {
  aiStore.state.localProvider = provider
  detectNotice.value = null
  detectedModels.value = []
  if (provider === 'ollama') {
    aiStore.state.localBaseUrl = 'http://localhost:11434/api/generate'
    if (!aiStore.state.localModel || aiStore.state.localModel === 'local-model') {
      aiStore.state.localModel = 'qwen2.5-coder:7b'
    }
  } else if (provider === 'lmstudio') {
    aiStore.state.localBaseUrl = 'http://127.0.0.1:1234/v1/chat/completions'
    if (!aiStore.state.localModel || aiStore.state.localModel === 'qwen2.5-coder:7b') {
      aiStore.state.localModel = 'qwen3.5-9b-sushi-coder-rl'
    }
  } else {
    if (!aiStore.state.localBaseUrl || aiStore.state.localBaseUrl.includes(':11434') || aiStore.state.localBaseUrl.includes(':1234')) {
      aiStore.state.localBaseUrl = 'http://localhost:8000/v1'
    }
    if (!aiStore.state.localModel) {
      aiStore.state.localModel = 'local-model'
    }
  }
}

const handleDetectModels = async () => {
  detectingModels.value = true
  detectNotice.value = null
  try {
    const models = await fetchAvailableModels(
      aiStore.state.localProvider,
      aiStore.state.localBaseUrl,
    )
    detectedModels.value = models
    if (models.length > 0) {
      detectNotice.value = {
        ok: true,
        message: `Terdeteksi ${models.length} model aktif dari ${aiStore.state.localProvider === 'lmstudio' ? 'LM Studio' : 'Ollama'}.`,
      }
      if (
        models[0] &&
        (!aiStore.state.localModel ||
          aiStore.state.localModel === 'qwen2.5-coder-7b-instruct' ||
          aiStore.state.localModel === 'local-model' ||
          !models.includes(aiStore.state.localModel))
      ) {
        aiStore.state.localModel = models[0]
      }
    } else {
      detectNotice.value = {
        ok: false,
        message: `Server ${aiStore.state.localProvider === 'lmstudio' ? 'LM Studio' : 'Ollama'} merespons tetapi tidak ada model terdaftar.`,
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    detectNotice.value = {
      ok: false,
      message: `Gagal mendeteksi model (${errorMsg}). Pastikan server ${aiStore.state.localProvider === 'lmstudio' ? 'LM Studio (port 1234)' : 'Ollama (port 11434)'} dalam status ON/Started.`,
    }
  } finally {
    detectingModels.value = false
  }
}

const selectCloudProvider = (provider: CloudProvider) => {
  aiStore.state.cloudProvider = provider
  const defaultModels: Record<CloudProvider, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-latest',
    gemini: 'gemini-2.5-flash',
    deepseek: 'deepseek-chat',
    custom: 'custom-model',
  }
  aiStore.state.cloudModel = defaultModels[provider]

  const defaultUrls: Record<CloudProvider, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    deepseek: 'https://api.deepseek.com/v1',
    custom: '',
  }
  if (!aiStore.state.cloudBaseUrl || Object.values(defaultUrls).includes(aiStore.state.cloudBaseUrl)) {
    aiStore.state.cloudBaseUrl = defaultUrls[provider]
  }
}

const handleSave = () => {
  aiStore.saveConfig()
  savedNotice.value = true
  setTimeout(() => {
    savedNotice.value = false
    aiStore.closeModal()
  }, 500)
}

const handleTestConnection = async () => {
  aiStore.saveConfig()
  testing.value = true
  testResult.value = null
  try {
    const res = await generateWithAI({
      systemPrompt: 'Respond with a single crisp sentence confirming that the AI engine is ready.',
      userPrompt: 'Ping check: reply with "READY: Engine is fully operational."',
    })
    testResult.value = {
      ok: true,
      message: `${res.provider} (${res.model}): ${res.content}`,
    }
  } catch (err) {
    testResult.value = {
      ok: false,
      message: err instanceof Error ? err.message : 'Connection test failed',
    }
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="aiStore.isModalOpen"
      class="modal-backdrop"
      @click.self="aiStore.closeModal"
    >
      <div
        class="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
      >
        <!-- Modal Header -->
        <header class="modal-header">
          <div class="modal-header-titles">
            <div class="modal-eyebrow">
              <Settings :size="13" />
              <span>Pengaturan Mesin AI</span>
            </div>
            <h2 id="ai-modal-title" class="modal-heading font-serif">
              Penyedia &amp; Model AI
            </h2>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            aria-label="Tutup modal"
            @click="aiStore.closeModal"
          >
            <X :size="16" />
          </button>
        </header>

        <!-- Mode Switcher Tabs -->
        <div class="mode-tabs">
          <button
            type="button"
            class="mode-tab-btn"
            :class="{ active: aiStore.state.mode === 'local' }"
            @click="aiStore.state.mode = 'local'"
          >
            <div class="mode-tab-header">
              <span class="status-pip ok"></span>
              <span class="mode-tab-title">Mode 1: AI Lokal (Offline)</span>
            </div>
            <span class="mode-tab-desc">Ollama, LM Studio, atau Localhost</span>
          </button>

          <button
            type="button"
            class="mode-tab-btn"
            :class="{ active: aiStore.state.mode === 'cloud' }"
            @click="aiStore.state.mode = 'cloud'"
          >
            <div class="mode-tab-header">
              <span class="status-pip accent"></span>
              <span class="mode-tab-title">Mode 2: Cloud API Key</span>
            </div>
            <span class="mode-tab-desc">ChatGPT, Claude, Gemini, DeepSeek, Custom</span>
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="modal-body">
          <!-- MODE 1: LOCAL AI -->
          <div v-if="aiStore.state.mode === 'local'" class="settings-group">
            <div class="field-wrap">
              <label class="field-title">Local inference runtime</label>
              <div class="runtime-grid">
                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.localProvider === 'ollama' }"
                  @click="selectLocalProvider('ollama')"
                >
                  <div class="tile-top">
                    <Cpu :size="14" />
                    <span class="tile-name">Ollama</span>
                  </div>
                  <span class="tile-sub font-mono">:11434</span>
                </button>

                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.localProvider === 'lmstudio' }"
                  @click="selectLocalProvider('lmstudio')"
                >
                  <div class="tile-top">
                    <Cpu :size="14" />
                    <span class="tile-name">LM Studio</span>
                  </div>
                  <span class="tile-sub font-mono">:1234</span>
                </button>

                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.localProvider === 'custom_local' }"
                  @click="selectLocalProvider('custom_local')"
                >
                  <div class="tile-top">
                    <Globe :size="14" />
                    <span class="tile-name">Custom Local</span>
                  </div>
                  <span class="tile-sub font-mono">vLLM / Port</span>
                </button>
              </div>
            </div>

            <div class="two-col-grid">
              <div class="field-wrap">
                <label class="field-title">Local server endpoint URL</label>
                <input
                  v-model="aiStore.state.localBaseUrl"
                  type="text"
                  class="input-base font-mono"
                  placeholder="http://localhost:11434/api/generate"
                />
                <span class="field-hint">
                  Default: <code>:11434/api/generate</code> (Ollama) or <code>:1234/v1/chat/completions</code> (LM Studio)
                </span>
              </div>

              <div class="field-wrap">
                <div class="label-with-action">
                  <label class="field-title">Local model identifier</label>
                  <button
                    type="button"
                    class="btn-detect font-mono"
                    :disabled="detectingModels"
                    @click="handleDetectModels"
                  >
                    <RefreshCw :size="12" :class="{ 'spin-animate': detectingModels }" />
                    <span>{{ detectingModels ? 'Mendeteksi...' : 'Deteksi Model' }}</span>
                  </button>
                </div>
                <input
                  v-model="aiStore.state.localModel"
                  type="text"
                  class="input-base font-mono"
                  placeholder="e.g. qwen3.5-9b-sushi-coder-rl"
                />

                <!-- Model Detection Result Badge -->
                <div
                  v-if="detectNotice"
                  class="detect-notice"
                  :class="{ pass: detectNotice.ok, fail: !detectNotice.ok }"
                >
                  <span class="notice-badge">{{ detectNotice.ok ? '✓' : '⚠' }}</span>
                  <span class="notice-text font-mono">{{ detectNotice.message }}</span>
                </div>

                <!-- Detected Running Models Chips -->
                <div v-if="detectedModels.length > 0" class="detected-models-container">
                  <span class="detected-label font-mono">Model Aktif Terdeteksi:</span>
                  <div class="chips-row detected-chips">
                    <button
                      v-for="m in detectedModels"
                      :key="m"
                      type="button"
                      class="chip-btn font-mono"
                      :class="{ active: aiStore.state.localModel === m }"
                      @click="aiStore.state.localModel = m"
                    >
                      {{ m }}
                    </button>
                  </div>
                </div>

                <!-- Default Fallback Preset Chips -->
                <div v-else class="chips-row">
                  <button
                    v-for="m in (aiStore.state.localProvider === 'lmstudio' ? [
                      'qwen3.5-9b-sushi-coder-rl',
                      'qwen2.5-coder-7b-instruct',
                      'google/gemma-4-e4b',
                      'llama-3.2-3b-instruct'
                    ] : [
                      'qwen2.5-coder:7b',
                      'deepseek-coder-v2:16b',
                      'llama3.1:8b',
                      'codestral:22b',
                      'mistral:7b',
                    ])"
                    :key="m"
                    type="button"
                    class="chip-btn font-mono"
                    :class="{ active: aiStore.state.localModel === m }"
                    @click="aiStore.state.localModel = m"
                  >
                    {{ m }}
                  </button>
                </div>
              </div>
            </div>

            <div class="direct-fetch-row">
              <label class="checkbox-label">
                <input
                  v-model="aiStore.state.directLocalFetch"
                  type="checkbox"
                  class="checkbox-input"
                />
                <div>
                  <span class="checkbox-title">
                    Direct browser fetch (bypass backend proxy)
                  </span>
                  <span class="checkbox-desc">
                    When unchecked, requests are forwarded securely through <code>POST /api/v1/ai/generate</code> on the Go backend to prevent browser CORS blocks.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <!-- MODE 2: CLOUD API KEY (BYOK) -->
          <div v-else class="settings-group">
            <div class="field-wrap">
              <label class="field-title">Select cloud AI provider</label>
              <div class="cloud-providers-grid">
                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.cloudProvider === 'openai' }"
                  @click="selectCloudProvider('openai')"
                >
                  <span class="tile-name">ChatGPT</span>
                  <span class="tile-sub">OpenAI (GPT-4o)</span>
                </button>

                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.cloudProvider === 'anthropic' }"
                  @click="selectCloudProvider('anthropic')"
                >
                  <span class="tile-name">Claude</span>
                  <span class="tile-sub">Anthropic Sonnet</span>
                </button>

                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.cloudProvider === 'gemini' }"
                  @click="selectCloudProvider('gemini')"
                >
                  <span class="tile-name">Gemini</span>
                  <span class="tile-sub">Google 2.5 Flash</span>
                </button>

                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.cloudProvider === 'deepseek' }"
                  @click="selectCloudProvider('deepseek')"
                >
                  <span class="tile-name">DeepSeek</span>
                  <span class="tile-sub">V3 &amp; R1 Reasoner</span>
                </button>

                <button
                  type="button"
                  class="provider-tile"
                  :class="{ active: aiStore.state.cloudProvider === 'custom' }"
                  @click="selectCloudProvider('custom')"
                >
                  <span class="tile-name">Custom API</span>
                  <span class="tile-sub">Groq / OpenRouter</span>
                </button>
              </div>
            </div>

            <!-- API Key Input -->
            <div class="field-wrap">
              <div class="label-row">
                <label class="field-title">
                  API Key for {{ aiStore.state.cloudProvider }}
                </label>
                <span class="storage-notice font-mono">Stored in browser localStorage only</span>
              </div>

              <div class="key-input-row">
                <input
                  v-model="aiStore.state.apiKeys[aiStore.state.cloudProvider]"
                  :type="showKey ? 'text' : 'password'"
                  class="input-base font-mono flex-1"
                  :placeholder="`Enter ${aiStore.state.cloudProvider} API key...`"
                />
                <button
                  type="button"
                  class="btn-secondary toggle-key-btn"
                  @click="showKey = !showKey"
                >
                  <EyeOff v-if="showKey" :size="14" />
                  <Eye v-else :size="14" />
                  <span>{{ showKey ? 'Hide' : 'Show' }}</span>
                </button>
              </div>
              <span class="field-hint">
                API keys are never stored in PostgreSQL. They remain local to your session and are forwarded securely via the backend proxy.
              </span>
            </div>

            <!-- Target Model & Custom Base URL -->
            <div class="two-col-grid">
              <div class="field-wrap">
                <label class="field-title">Target model identifier</label>
                <input
                  v-model="aiStore.state.cloudModel"
                  type="text"
                  class="input-base font-mono"
                  placeholder="Model identifier"
                />

                <!-- Quick Model Chips -->
                <div v-if="aiStore.state.cloudProvider === 'openai'" class="chips-row">
                  <button
                    v-for="m in ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1']"
                    :key="m"
                    type="button"
                    class="chip-btn font-mono"
                    @click="aiStore.state.cloudModel = m"
                  >
                    {{ m }}
                  </button>
                </div>
                <div v-else-if="aiStore.state.cloudProvider === 'anthropic'" class="chips-row">
                  <button
                    v-for="m in ['claude-3-5-sonnet-latest', 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest']"
                    :key="m"
                    type="button"
                    class="chip-btn font-mono"
                    @click="aiStore.state.cloudModel = m"
                  >
                    {{ m }}
                  </button>
                </div>
                <div v-else-if="aiStore.state.cloudProvider === 'gemini'" class="chips-row">
                  <button
                    v-for="m in ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro']"
                    :key="m"
                    type="button"
                    class="chip-btn font-mono"
                    @click="aiStore.state.cloudModel = m"
                  >
                    {{ m }}
                  </button>
                </div>
                <div v-else-if="aiStore.state.cloudProvider === 'deepseek'" class="chips-row">
                  <button
                    v-for="m in ['deepseek-chat', 'deepseek-reasoner']"
                    :key="m"
                    type="button"
                    class="chip-btn font-mono"
                    @click="aiStore.state.cloudModel = m"
                  >
                    {{ m }}
                  </button>
                </div>
                <div v-else class="chips-row">
                  <button
                    v-for="m in ['llama-3.3-70b-versatile', 'deepseek/deepseek-r1', 'mistral-large-latest']"
                    :key="m"
                    type="button"
                    class="chip-btn font-mono"
                    @click="aiStore.state.cloudModel = m"
                  >
                    {{ m }}
                  </button>
                </div>
              </div>

              <div class="field-wrap">
                <label class="field-title">Custom base URL (optional)</label>
                <input
                  v-model="aiStore.state.cloudBaseUrl"
                  type="text"
                  class="input-base font-mono"
                  placeholder="Default official API URL"
                />
                <span class="field-hint">
                  Custom endpoint e.g. <code>https://openrouter.ai/api/v1</code> or <code>https://api.groq.com/openai/v1</code>
                </span>
              </div>
            </div>
          </div>

          <!-- Request Timeout Configuration -->
          <div class="field-wrap timeout-wrap">
            <div class="label-row">
              <label class="field-title">Batas Waktu Tunggu Inferensi (Request Timeout)</label>
              <span class="storage-notice font-mono">{{ aiStore.state.timeoutSeconds || 300 }} detik</span>
            </div>
            <div class="timeout-input-row">
              <input
                v-model.number="aiStore.state.timeoutSeconds"
                type="number"
                min="10"
                max="1200"
                step="30"
                class="input-base font-mono timeout-input"
                placeholder="300"
              />
              <div class="chips-row timeout-chips">
                <button
                  v-for="sec in [60, 120, 180, 300, 600]"
                  :key="sec"
                  type="button"
                  class="chip-btn font-mono"
                  :class="{ active: aiStore.state.timeoutSeconds === sec }"
                  @click="aiStore.state.timeoutSeconds = sec"
                >
                  {{ sec }}s {{ sec === 300 ? '(Default)' : '' }}
                </button>
              </div>
            </div>
            <span class="field-hint">
              Waktu maksimal tunggu sebelum membatalkan permintaan. Model lokal berukuran besar (misal: Qwen 9B dengan reasoning) membutuhkan waktu 2–5 menit (300s–600s).
            </span>
          </div>

          <!-- Diagnostic Connection Result -->
          <div
            v-if="testResult"
            class="test-result-box"
            :class="{ pass: testResult.ok, fail: !testResult.ok }"
          >
            <span class="result-badge font-mono">{{ testResult.ok ? '[PASS]' : '[ERROR]' }}</span>
            <span class="result-text font-mono">{{ testResult.message }}</span>
          </div>
        </div>

        <!-- Modal Footer -->
        <footer class="modal-footer">
          <div class="footer-left">
            <button
              type="button"
              class="btn-secondary btn-sm"
              @click="aiStore.resetDefaults"
            >
              <RefreshCw :size="13" />
              <span>Reset Pengaturan</span>
            </button>

            <button
              type="button"
              class="btn-secondary btn-sm"
              :disabled="testing"
              @click="handleTestConnection"
            >
              <Play :size="13" />
              <span>{{ testing ? 'Menguji...' : 'Uji Koneksi' }}</span>
            </button>
          </div>

          <div class="footer-right">
            <button
              type="button"
              class="btn-secondary btn-sm"
              @click="aiStore.closeModal"
            >
              Batal
            </button>

            <button
              type="button"
              class="btn-primary btn-sm"
              @click="handleSave"
            >
              <Check :size="14" />
              <span>{{ savedNotice ? 'Tersimpan!' : 'Simpan Pengaturan' }}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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

.modal-dialog {
  width: 100%;
  max-width: 720px;
  max-height: 88vh;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
}

.modal-header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
}

.modal-heading {
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  color: var(--text);
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease, background-color 0.12s ease;
}

.modal-close-btn:hover {
  color: var(--text);
  border-color: var(--rule-strong);
  background-color: var(--hover);
}

/* Mode Switcher Tabs */
.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
}

.mode-tab-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-right: 1px solid var(--rule);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}

.mode-tab-btn:last-child {
  border-right: none;
}

.mode-tab-btn.active {
  background-color: var(--surface);
  border-bottom-color: var(--accent);
}

.mode-tab-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-pip {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-pip.ok {
  background-color: var(--ok);
}

.status-pip.accent {
  background-color: var(--accent);
}

.mode-tab-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.mode-tab-btn:not(.active) .mode-tab-title {
  color: var(--text-2);
}

.mode-tab-desc {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
}

/* Modal Body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
}

.field-hint {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.5;
}

.field-hint code {
  color: var(--text-2);
  background-color: var(--elevated);
  padding: 1px 4px;
  border-radius: var(--radius);
}

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .two-col-grid {
    grid-template-columns: 1fr;
  }
}

/* Runtime and Provider Tiles */
.runtime-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cloud-providers-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

@media (max-width: 640px) {
  .runtime-grid {
    grid-template-columns: 1fr;
  }
  .cloud-providers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.provider-tile {
  padding: 10px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.provider-tile:hover {
  border-color: var(--rule-strong);
  color: var(--text);
}

.provider-tile.active {
  border-color: var(--accent);
  background-color: var(--hover);
  color: var(--text);
}

.tile-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tile-name {
  font-size: 13px;
  font-weight: 600;
}

.tile-sub {
  font-size: 11px;
  color: var(--text-3);
}

.label-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.btn-detect {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background-color: var(--elevated);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-detect:hover:not(:disabled) {
  background-color: var(--accent);
  color: #fff;
}

.btn-detect:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-animate {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.detect-notice {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: var(--radius);
  font-size: 11px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.detect-notice.pass {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--ok);
}

.detect-notice.fail {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger);
}

.notice-badge {
  font-weight: bold;
  flex-shrink: 0;
}

.notice-text {
  color: var(--text);
  word-break: break-word;
}

.detected-models-container {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detected-label {
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Chips Row */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.chip-btn {
  padding: 2px 8px;
  font-size: 11px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;
}

.chip-btn:hover {
  border-color: var(--rule-strong);
  color: var(--text);
}

.chip-btn.active {
  border-color: var(--accent);
  background-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

/* Timeout Row */
.timeout-wrap {
  padding-top: 14px;
  border-top: 1px solid var(--rule);
}

.timeout-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.timeout-input {
  width: 100px;
}

.timeout-chips {
  margin-top: 0;
}

/* Direct Fetch Checkbox Row */
.direct-fetch-row {
  padding-top: 14px;
  border-top: 1px solid var(--rule);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.checkbox-input {
  margin-top: 3px;
  accent-color: var(--accent);
}

.checkbox-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.checkbox-desc {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.5;
  margin-top: 2px;
}

.checkbox-desc code {
  color: var(--text-2);
  background-color: var(--elevated);
  padding: 1px 4px;
  border-radius: var(--radius);
}

/* API Key Input Row */
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.storage-notice {
  font-size: 11px;
  color: var(--text-3);
}

.key-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flex-1 {
  flex: 1;
}

.toggle-key-btn {
  height: 40px;
  padding: 0 12px;
  font-size: 12px;
  flex-shrink: 0;
}

/* Test Diagnostic Result */
.test-result-box {
  padding: 12px 16px;
  border-radius: var(--radius);
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  line-height: 1.5;
}

.test-result-box.pass {
  border-color: var(--ok);
  color: var(--ok);
}

.test-result-box.fail {
  border-color: var(--danger);
  color: var(--danger);
}

.result-badge {
  font-weight: 700;
  flex-shrink: 0;
}

.result-text {
  color: var(--text);
  word-break: break-all;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: var(--elevated);
  border-top: 1px solid var(--rule);
  gap: 12px;
  flex-wrap: wrap;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
