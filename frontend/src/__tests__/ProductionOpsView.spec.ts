import { describe, it, expect } from 'vitest'
import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import ProductionOpsView from '../views/ProductionOpsView.vue'
import router from '../router'

describe('ProductionOpsView', () => {
  it('mounts properly and displays all 5 operations tabs', async () => {
    const pinia = createPinia()
    const wrapper = mount(ProductionOpsView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Production Ops & Tooling')
    expect(wrapper.text()).toContain('Production Gate (PRR)')
    expect(wrapper.text()).toContain('Architecture Decisions (ADR)')
    expect(wrapper.text()).toContain('Mock API & MSW Sandbox')
    expect(wrapper.text()).toContain('Stress-Tester')
    expect(wrapper.text()).toContain('Reverse & Scaffolder')
  })

  it('renders PRR audit scorecard and audit checklist items', async () => {
    const pinia = createPinia()
    const wrapper = mount(ProductionOpsView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Production Readiness Review Gate')
    expect(wrapper.text()).toContain('Unduh Laporan Sign-Off (.md)')
  })
})
