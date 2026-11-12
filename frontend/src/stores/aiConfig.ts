import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type AIMode = 'local' | 'cloud'
export type LocalProvider = 'ollama' | 'lmstudio' | 'custom_local'
export type CloudProvider = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom'

export interface AIConfigState {
  mode: AIMode
  localProvider: LocalProvider
  localBaseUrl: string
  localModel: string
  directLocalFetch: boolean
  timeoutSeconds: number
  cloudProvider: CloudProvider
  cloudModel: string
  cloudBaseUrl: string
  apiKeys: {
    openai: string
    anthropic: string
    gemini: string
    deepseek: string
    custom: string
  }
}

const STORAGE_KEY = 'prd_studio_ai_config_v2'

const DEFAULT_CONFIG: AIConfigState = {
  mode: 'local',
  localProvider: 'ollama',
  localBaseUrl: 'http://localhost:11434/api/generate',
  localModel: 'qwen2.5-coder:7b',
  directLocalFetch: false,
  timeoutSeconds: 300,
  cloudProvider: 'openai',
  cloudModel: 'gpt-4o',
  cloudBaseUrl: '',
  apiKeys: {
    openai: '',
    anthropic: '',
    gemini: '',
    deepseek: '',
    custom: '',
  },
}

export const useAiConfigStore = defineStore('aiConfig', () => {
  const isModalOpen = ref(false)

  const loadInitialState = (): AIConfigState => {
    try {
      // Check v2 key first, then fallback to v1 migration
      let raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        raw = localStorage.getItem('prd_studio_ai_config_v1')
      }
      if (!raw) return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_CONFIG.apiKeys } }
      const parsed = JSON.parse(raw) as Partial<AIConfigState>
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        timeoutSeconds:
          typeof parsed.timeoutSeconds === 'number' && parsed.timeoutSeconds >= 10
            ? parsed.timeoutSeconds
            : 300,
        apiKeys: {
          ...DEFAULT_CONFIG.apiKeys,
          ...parsed.apiKeys,
        },
      }
    } catch {
      return { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_CONFIG.apiKeys } }
    }
  }

  const state = ref<AIConfigState>(loadInitialState())

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  const resetDefaults = () => {
    state.value = { ...DEFAULT_CONFIG, apiKeys: { ...DEFAULT_CONFIG.apiKeys } }
    saveConfig()
  }

  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  const activeProvider = computed(() =>
    state.value.mode === 'local' ? state.value.localProvider : state.value.cloudProvider,
  )

  const activeModel = computed(() =>
    state.value.mode === 'local' ? state.value.localModel : state.value.cloudModel,
  )

  const activeApiKey = computed(() => {
    if (state.value.mode === 'local') return ''
    return state.value.apiKeys[state.value.cloudProvider] || ''
  })

  const activeBaseUrl = computed(() =>
    state.value.mode === 'local' ? state.value.localBaseUrl : state.value.cloudBaseUrl,
  )

  const statusBadgeText = computed(() => {
    if (state.value.mode === 'local') {
      const labelMap: Record<LocalProvider, string> = {
        ollama: 'Ollama',
        lmstudio: 'LM Studio',
        custom_local: 'Local Custom',
      }
      return `LOCAL / ${labelMap[state.value.localProvider] || 'Local'} (${state.value.localModel || 'default'})`
    }
    const labelMap: Record<CloudProvider, string> = {
      openai: 'ChatGPT',
      anthropic: 'Claude',
      gemini: 'Gemini',
      deepseek: 'DeepSeek',
      custom: 'Custom API',
    }
    const hasKey = Boolean(activeApiKey.value.trim())
    return `CLOUD / ${labelMap[state.value.cloudProvider] || 'Cloud'} [${hasKey ? 'KEY SET' : 'NO KEY'}]`
  })

  return {
    state,
    isModalOpen,
    activeProvider,
    activeModel,
    activeApiKey,
    activeBaseUrl,
    statusBadgeText,
    saveConfig,
    resetDefaults,
    openModal,
    closeModal,
  }
})
