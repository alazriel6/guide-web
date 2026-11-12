import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useAiConfigStore } from '../stores/aiConfig'
import AiSettingsModal from '../components/AiSettingsModal.vue'

describe('AiSettingsModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('toggles modal visibility and updates cloud provider to deepseek/openai/gemini', async () => {
    const aiStore = useAiConfigStore()
    expect(aiStore.isModalOpen).toBe(false)

    aiStore.openModal()
    expect(aiStore.isModalOpen).toBe(true)

    const wrapper = mount(AiSettingsModal, {
      attachTo: document.body,
    })

    // Dialog exists in teleported body
    const dialog = document.querySelector('.modal-dialog')
    expect(dialog).not.toBeNull()

    // Switch to cloud mode
    aiStore.state.mode = 'cloud'
    aiStore.state.cloudProvider = 'deepseek'
    aiStore.state.cloudModel = 'deepseek-chat'
    aiStore.state.apiKeys.deepseek = 'sk-test-deepseek'

    expect(aiStore.activeProvider).toBe('deepseek')
    expect(aiStore.activeModel).toBe('deepseek-chat')
    expect(aiStore.activeApiKey).toBe('sk-test-deepseek')
    expect(aiStore.statusBadgeText).toContain('DeepSeek')

    // Close modal
    aiStore.closeModal()
    expect(aiStore.isModalOpen).toBe(false)
    wrapper.unmount()
  })

  it('configures LM Studio local provider and renders auto-detect UI', async () => {
    const aiStore = useAiConfigStore()
    aiStore.openModal()

    const wrapper = mount(AiSettingsModal, {
      attachTo: document.body,
    })

    // Local mode should be active by default
    expect(aiStore.state.mode).toBe('local')

    // Find and click LM Studio provider button
    const lmBtn = Array.from(document.querySelectorAll('.provider-tile')).find((el) =>
      el.textContent?.includes('LM Studio'),
    ) as HTMLButtonElement | undefined
    expect(lmBtn).toBeDefined()
    lmBtn?.click()

    expect(aiStore.state.localProvider).toBe('lmstudio')
    expect(aiStore.state.localBaseUrl).toContain(':1234')

    // Check detect button is visible
    const detectBtn = document.querySelector('.btn-detect') as HTMLButtonElement | null
    expect(detectBtn).not.toBeNull()
    expect(detectBtn?.textContent).toContain('Deteksi Model')

    wrapper.unmount()
  })
})
