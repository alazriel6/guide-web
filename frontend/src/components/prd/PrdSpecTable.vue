<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, MoreHorizontal, Copy, Trash2 } from 'lucide-vue-next'
import type { PrdDocument } from '@/services/api'
import StatusDot from '@/components/primitives/StatusDot.vue'
import SkeletonRow from '@/components/primitives/SkeletonRow.vue'
import EmptyState from '@/components/primitives/EmptyState.vue'

interface Props {
  prds: PrdDocument[]
  loading?: boolean
  activeDocId?: number
  categories?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  activeDocId: undefined,
  categories: () => ['All', 'SaaS Web App', 'Desktop Media App', 'AI Tooling', 'REST Microservice'],
})

const emit = defineEmits<{
  (e: 'select', doc: PrdDocument): void
  (e: 'clone', doc: PrdDocument): void
  (e: 'delete', doc: PrdDocument): void
}>()

const presetFilter = ref<'all' | 'preset' | 'custom'>('all')
const selectedCategory = ref('All')
const searchQuery = ref('')
const focusedRowIndex = ref<number>(-1)
const openMenuId = ref<number | null>(null)

const filteredPrds = computed(() => {
  return props.prds.filter((item) => {
    if (presetFilter.value === 'preset' && !item.is_preset) return false
    if (presetFilter.value === 'custom' && item.is_preset) return false
    if (selectedCategory.value !== 'All' && item.category !== selectedCategory.value) {
      return false
    }
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchCat = item.category.toLowerCase().includes(q)
      const matchTech = (item.tech_stack || '').toLowerCase().includes(q)
      return matchTitle || matchCat || matchTech
    }
    return true
  })
})

function handleTableKeydown(e: KeyboardEvent) {
  if (filteredPrds.value.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedRowIndex.value = Math.min(focusedRowIndex.value + 1, filteredPrds.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedRowIndex.value = Math.max(focusedRowIndex.value - 1, 0)
  } else if (e.key === 'Enter' && focusedRowIndex.value >= 0) {
    const doc = filteredPrds.value[focusedRowIndex.value]
    if (doc) emit('select', doc)
  }
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'All'
  presetFilter.value = 'all'
}
</script>

<template>
  <section class="table-section" aria-label="Specification catalog">
    <div class="consolidated-toolbar">
      <!-- Source Tabs: All / Presets / Custom -->
      <div class="source-tabs">
        <button
          type="button"
          class="source-tab-btn"
          :class="{ active: presetFilter === 'all' }"
          @click="presetFilter = 'all'"
        >
          Semua ({{ prds.length }})
        </button>
        <button
          type="button"
          class="source-tab-btn"
          :class="{ active: presetFilter === 'preset' }"
          @click="presetFilter = 'preset'"
        >
          Preset Contoh
        </button>
        <button
          type="button"
          class="source-tab-btn"
          :class="{ active: presetFilter === 'custom' }"
          @click="presetFilter = 'custom'"
        >
          Draft Saya
        </button>
      </div>

      <!-- Middle Category Select -->
      <div class="category-select-wrap">
        <select v-model="selectedCategory" class="input-select cat-select">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <!-- Right Search Input -->
      <div class="search-input-wrap">
        <Search :size="14" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="input-base search-input font-sans"
          placeholder="Cari spesifikasi atau teknologi..."
        />
      </div>
    </div>

    <!-- Spec Table Content -->
    <div v-if="loading" class="p-4">
      <SkeletonRow :count="4" />
    </div>

    <div v-else-if="filteredPrds.length === 0" class="p-6">
      <EmptyState
        title="Tidak ada spesifikasi yang cocok"
        description="Hapus kata kunci atau ubah filter kategori untuk melihat dokumen."
        action-label="Reset Filter"
        @action="resetFilters"
      />
    </div>

    <div
      v-else
      class="table-scroll-wrap"
      tabindex="0"
      @keydown="handleTableKeydown"
    >
      <table class="table-workbench">
        <thead>
          <tr>
            <th class="col-title">Judul</th>
            <th class="col-cat">Kategori</th>
            <th class="col-source">Tipe</th>
            <th class="col-status">Status</th>
            <th class="col-date">Diperbarui</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, idx) in filteredPrds"
            :key="item.id || item.title"
            :class="{
              active: activeDocId === item.id,
              focused: focusedRowIndex === idx,
            }"
            @click="emit('select', item)"
          >
            <td class="cell-title">
              <span class="doc-title-text">{{ item.title }}</span>
            </td>
            <td class="cell-cat">{{ item.category }}</td>
            <td class="cell-source">
              <StatusDot
                :variant="item.is_preset ? 'neutral' : 'ok'"
                :label="item.is_preset ? 'Preset' : 'Draft'"
              />
            </td>
            <td class="cell-status">
              <StatusDot
                :variant="item.compiled_markdown ? 'ok' : 'neutral'"
                :label="item.compiled_markdown ? 'Selesai' : 'Draft'"
              />
            </td>
            <td class="cell-date font-mono">
              {{ item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Baru saja' }}
            </td>
            <td class="cell-actions" @click.stop>
              <!-- Overflow Menu -->
              <div class="menu-relative">
                <button
                  type="button"
                  class="icon-action-btn"
                  title="Menu dokumen"
                  @click="openMenuId = openMenuId === item.id ? null : (item.id || 0)"
                >
                  <MoreHorizontal :size="14" />
                </button>

                <div v-if="openMenuId === (item.id || 0)" class="overflow-dropdown">
                  <button
                    type="button"
                    class="dropdown-item"
                    @click="emit('clone', item); openMenuId = null"
                  >
                    <Copy :size="12" />
                    <span>Duplikat Dokumen</span>
                  </button>
                  <button
                    type="button"
                    class="dropdown-item dropdown-delete"
                    @click="emit('delete', item); openMenuId = null"
                  >
                    <Trash2 :size="12" />
                    <span>Hapus Dokumen</span>
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.table-section {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 24px;
}

.consolidated-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  background-color: var(--elevated);
  flex-wrap: wrap;
}

.source-tabs {
  display: flex;
  gap: 4px;
}

.source-tab-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.12s ease;
}

.source-tab-btn:hover {
  color: var(--text);
  background-color: var(--hover);
}

.source-tab-btn.active {
  color: var(--accent);
  background-color: var(--surface);
  border-color: var(--rule-strong);
  font-weight: 500;
}

.category-select-wrap {
  min-width: 160px;
}

.cat-select {
  height: 30px;
  font-size: 12px;
  padding: 2px 8px;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 0 8px;
  height: 30px;
  min-width: 220px;
}

.search-icon {
  color: var(--text-3);
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  color: var(--text);
  width: 100%;
}

.table-scroll-wrap {
  overflow-x: auto;
  outline: none;
}

.table-workbench {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

.table-workbench th {
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  border-bottom: 1px solid var(--rule);
  background-color: var(--surface);
}

.table-workbench td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--text-2);
  white-space: nowrap;
}

.col-title { width: 40%; }
.col-cat { width: 20%; }
.col-source { width: 12%; }
.col-status { width: 12%; }
.col-date { width: 12%; }
.col-actions { width: 44px; }

.table-workbench tr {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.table-workbench tr:hover {
  background-color: var(--hover);
}

.table-workbench tr.active {
  background-color: var(--hover);
}

.table-workbench tr.focused {
  outline: 1px solid var(--accent);
}

.cell-title {
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.menu-relative {
  position: relative;
}

.icon-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-3);
  cursor: pointer;
}

.icon-action-btn:hover {
  background-color: var(--elevated);
  border-color: var(--rule);
  color: var(--text);
}

.overflow-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  min-width: 160px;
  padding: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-2);
  background: transparent;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--hover);
  color: var(--text);
}

.dropdown-delete {
  color: var(--danger);
}

.dropdown-delete:hover {
  background-color: rgba(240, 106, 98, 0.1);
  color: var(--danger);
}

.p-4 { padding: 16px; }
.p-6 { padding: 24px; }
</style>
