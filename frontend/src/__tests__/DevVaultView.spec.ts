import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import DevVaultView from '../views/DevVaultView.vue'
import { VAULT_ENTRIES, exportVaultPlaybookMarkdown } from '../lib/vault/vaultData'
import { useVaultStore } from '../stores/vaultStore'

describe('DevVaultView', () => {
  const createWrapper = () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    return mount(DevVaultView, {
      global: {
        plugins: [pinia],
      },
    })
  }

  it('mounts properly and displays knowledge base cards', () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('Dev Vault & Buku Saku Sintaks')
    expect(wrapper.text()).toContain('DEVELOPER KNOWLEDGE BASE')
    expect(wrapper.findAll('.vault-card').length).toBe(VAULT_ENTRIES.length)
  })

  it('filters snippets by keyword', async () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input.search-input')

    await input.setValue('FastAPI')
    const cards = wrapper.findAll('.vault-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Python 3.12 (FastAPI)')
  })

  it('filters snippets when store category changes', async () => {
    const wrapper = createWrapper()
    const store = useVaultStore()

    store.setCategory('backend')
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.vault-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards[0]!.text()).toContain('BACKEND')
  })

  it('toggles Quick Reference drawer (HTTP Status & Big-O)', async () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="quick-ref-drawer"]').exists()).toBe(false)

    await wrapper.find('[data-testid="toggle-quick-ref-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="quick-ref-drawer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('KODE STATUS HTTP')
    expect(wrapper.text()).toContain('KOMPLEKSITAS ALGORITMA (BIG-O)')
  })

  it('switches card internal tabs between Code, Setup, Folder Structure, and Gotchas', async () => {
    const wrapper = createWrapper()

    // 1. Setup Tab
    const setupTabBtn = wrapper.find('[data-testid="tab-setup-vue3-composition"]')
    await setupTabBtn.trigger('click')
    expect(wrapper.find('[data-testid="panel-setup-vue3-composition"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('LANGKAH SETUP PROYEK')

    // 2. Folder Structure Tab
    const structureTabBtn = wrapper.find('[data-testid="tab-structure-vue3-composition"]')
    await structureTabBtn.trigger('click')
    expect(wrapper.find('[data-testid="panel-structure-vue3-composition"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('STRUKTUR FOLDER')

    // 3. Gotchas Tab
    const gotchasTabBtn = wrapper.find('[data-testid="tab-gotchas-vue3-composition"]')
    await gotchasTabBtn.trigger('click')
    expect(wrapper.find('[data-testid="panel-gotchas-vue3-composition"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('KESALAHAN YANG SERING TERJADI')
  })

  it('supports bookmarking cards and filtering by bookmarks', async () => {
    const wrapper = createWrapper()
    const store = useVaultStore()

    const bookmarkBtn = wrapper.find('[data-testid="bookmark-btn-vue3-composition"]')
    await bookmarkBtn.trigger('click')

    store.setCategory('bookmarks')
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.vault-card')
    expect(cards.length).toBe(1)
    expect(cards[0]!.text()).toContain('Vue 3')
  })

  it('dynamically customizes terminal commands with custom project name', async () => {
    const wrapper = createWrapper()
    const store = useVaultStore()

    store.setProjectName('pos-retail-app')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('pos-retail-app')
  })

  it('switches between 2-column grid and 1-column list layouts', async () => {
    const wrapper = createWrapper()
    const listBtn = wrapper.find('[data-testid="layout-list-btn"]')

    await listBtn.trigger('click')
    expect(wrapper.find('.vault-grid.layout-list-mode').exists()).toBe(true)

    const gridBtn = wrapper.find('[data-testid="layout-grid-btn"]')
    await gridBtn.trigger('click')
    expect(wrapper.find('.vault-grid.layout-list-mode').exists()).toBe(false)
  })

  it('exports full playbook markdown string including Gotchas', () => {
    const md = exportVaultPlaybookMarkdown()
    expect(md).toContain('# DEV VAULT & SYNTAX PLAYBOOK (BLUEPRINTDEV KNOWLEDGE BASE)')
    expect(md).toContain('## Kamus Cepat Kode Status HTTP')
    expect(md).toContain('Jebakan Batman & Anti-Patterns')
  })
})
