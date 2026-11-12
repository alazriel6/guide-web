import { describe, it, expect } from 'vitest'
import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'

describe('App', () => {
  it('mounts and renders the PRD & Technical Prompt Studio workspace shell', async () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
      },
    })
    await router.isReady()
    expect(wrapper.text()).toContain('BlueprintDev')
    expect(wrapper.text()).toContain('Workspace Arsitektur')
  })
})
