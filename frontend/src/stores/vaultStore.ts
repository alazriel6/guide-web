import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  VAULT_ENTRIES,
  type VaultCategory,
  type VaultSnippet,
} from '@/lib/vault/vaultData'
import type { ScaffoldTargetId } from '@/lib/prd/scaffoldGenerator'

export type CardTab = 'code' | 'setup' | 'structure' | 'gotchas'
export type ViewLayout = 'grid' | 'list'

const BOOKMARK_STORAGE_KEY = 'prd_vault_bookmarks_v1'
const PROJECT_NAME_STORAGE_KEY = 'prd_vault_project_name_v1'
const LAYOUT_STORAGE_KEY = 'prd_vault_layout_v1'

export const useVaultStore = defineStore('vault', () => {
  const selectedCategory = ref<VaultCategory | 'bookmarks'>('all')
  const searchKeyword = ref('')
  const projectName = ref('my-app')
  const viewLayout = ref<ViewLayout>('grid')
  const globalDefaultTab = ref<CardTab>('code')
  const activeCardTabs = ref<Record<string, CardTab>>({})
  const bookmarkedIds = ref<string[]>([])
  const focusModalItem = ref<VaultSnippet | null>(null)
  const scaffoldTarget = ref<ScaffoldTargetId | null>(null)
  const isLeftNavOpen = ref(true)

  // Initialize from localStorage
  const init = () => {
    try {
      const bMarks = localStorage.getItem(BOOKMARK_STORAGE_KEY)
      if (bMarks) {
        const parsed = JSON.parse(bMarks)
        if (Array.isArray(parsed)) bookmarkedIds.value = parsed
      }
      const pName = localStorage.getItem(PROJECT_NAME_STORAGE_KEY)
      if (pName) projectName.value = pName
      const layout = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (layout === 'grid' || layout === 'list') viewLayout.value = layout
    } catch {
      // ignore quota / environment errors
    }
  }

  init()

  const setCategory = (cat: VaultCategory | 'bookmarks') => {
    selectedCategory.value = cat
  }

  const setProjectName = (name: string) => {
    projectName.value = name.trim() || 'my-app'
    try {
      localStorage.setItem(PROJECT_NAME_STORAGE_KEY, projectName.value)
    } catch {
      // ignore
    }
  }

  const setViewLayout = (layout: ViewLayout) => {
    viewLayout.value = layout
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
    } catch {
      // ignore
    }
  }

  const toggleBookmark = (id: string) => {
    const idx = bookmarkedIds.value.indexOf(id)
    if (idx >= 0) {
      bookmarkedIds.value.splice(idx, 1)
    } else {
      bookmarkedIds.value.push(id)
    }
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedIds.value))
    } catch {
      // ignore
    }
  }

  const isBookmarked = (id: string) => bookmarkedIds.value.includes(id)

  const getCardTab = (id: string): CardTab => {
    return activeCardTabs.value[id] || globalDefaultTab.value
  }

  const setCardTab = (id: string, tab: CardTab) => {
    activeCardTabs.value[id] = tab
  }

  const setGlobalMode = (tab: CardTab) => {
    globalDefaultTab.value = tab
    activeCardTabs.value = {}
  }

  const openFocusModal = (item: VaultSnippet) => {
    focusModalItem.value = item
  }

  const closeFocusModal = () => {
    focusModalItem.value = null
  }

  const openScaffold = (targetId: ScaffoldTargetId) => {
    scaffoldTarget.value = targetId
  }

  const closeScaffold = () => {
    scaffoldTarget.value = null
  }

  // Helper to customize CLI commands with custom project name
  const customizeCli = (cmd: string): string => {
    const p = projectName.value || 'my-app'
    const snake = p.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'my_project'
    return cmd
      .replace(/my-vue-app/g, p)
      .replace(/my-app/g, p)
      .replace(/my-express-app/g, p)
      .replace(/my_project/g, snake)
      .replace(/my_axum_service/g, snake)
      .replace(/my_fastapi_project/g, snake)
      .replace(/my_flutter_app/g, snake)
  }

  // Category counts
  const categoryCounts = computed(() => {
    const map: Record<string, number> = {
      all: VAULT_ENTRIES.length,
      bookmarks: bookmarkedIds.value.length,
    }
    for (const entry of VAULT_ENTRIES) {
      map[entry.category] = (map[entry.category] || 0) + 1
    }
    return map
  })

  return {
    selectedCategory,
    searchKeyword,
    projectName,
    viewLayout,
    globalDefaultTab,
    activeCardTabs,
    bookmarkedIds,
    focusModalItem,
    scaffoldTarget,
    isLeftNavOpen,
    categoryCounts,
    setCategory,
    setProjectName,
    setViewLayout,
    toggleBookmark,
    isBookmarked,
    getCardTab,
    setCardTab,
    setGlobalMode,
    openFocusModal,
    closeFocusModal,
    openScaffold,
    closeScaffold,
    customizeCli,
  }
})
