<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { LEXICON_MATRIX, type LexiconChip } from './lexiconData'

interface Props {
  selectedTags: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-chip', chip: LexiconChip): void
  (e: 'add-custom-tag', tag: string): void
  (e: 'remove-tag', tag: string): void
}>()

const activeCategory = ref<string>('All')
const newCustomTag = ref('')

const categories = ['All', 'Frontend', 'Backend', 'Database', 'Desktop', 'Fullstack']

const filteredChips = computed(() => {
  if (activeCategory.value === 'All') return LEXICON_MATRIX
  return LEXICON_MATRIX.filter((c) => c.category === activeCategory.value)
})

const isSelected = (tag: string) => props.selectedTags.includes(tag)

const handleAddTag = () => {
  const clean = newCustomTag.value.trim()
  if (!clean) return
  emit('add-custom-tag', clean)
  newCustomTag.value = ''
}
</script>

<template>
  <div class="lexicon-component">
    <!-- Active Stack Tags Bar -->
    <div class="field-item">
      <label class="field-label">Tag Teknologi Aktif</label>
      <div class="tags-editor-bar">
        <span
          v-for="tag in selectedTags"
          :key="tag"
          class="stack-tag"
        >
          <span class="font-mono">{{ tag }}</span>
          <button
            type="button"
            class="tag-close-btn"
            aria-label="Hapus tag"
            @click="emit('remove-tag', tag)"
          >
            <X :size="11" />
          </button>
        </span>

        <div class="add-tag-inline">
          <input
            v-model="newCustomTag"
            type="text"
            placeholder="Tambah tag baru + Enter"
            class="add-tag-input font-mono"
            @keydown.enter.prevent="handleAddTag"
          />
          <button
            type="button"
            class="add-tag-btn"
            @click="handleAddTag"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>

    <!-- Integrated Lexicon Constraint Injector -->
    <div class="lexicon-dock">
      <div class="lexicon-dock-header">
        <span class="field-label">Sisipkan aturan teknologi:</span>
        <div class="lexicon-cat-tabs">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="lex-cat-tab"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div class="lexicon-chips-flow">
        <button
          v-for="chip in filteredChips"
          :key="chip.tag"
          type="button"
          class="lexicon-chip font-mono"
          :class="{ active: isSelected(chip.tag) }"
          @click="emit('toggle-chip', chip)"
        >
          <span class="chip-dot"></span>
          <span>{{ chip.tag }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lexicon-component {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 6px;
}

.tags-editor-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 10px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.stack-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  color: var(--accent);
  font-size: 12px;
}

.tag-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-3);
  cursor: pointer;
}

.tag-close-btn:hover {
  color: var(--danger);
}

.add-tag-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.add-tag-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 12px;
  min-width: 170px;
  padding: 2px 4px;
}

.add-tag-btn {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  color: var(--text-2);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius);
  cursor: pointer;
}

.add-tag-btn:hover {
  background-color: var(--hover);
  color: var(--text);
}

.lexicon-dock {
  margin-top: 4px;
  padding: 10px 12px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.lexicon-dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.lexicon-cat-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.lex-cat-tab {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-3);
  font-size: 11.5px;
  padding: 2px 8px;
  border-radius: var(--radius);
  cursor: pointer;
}

.lex-cat-tab.active {
  background-color: var(--elevated);
  border-color: var(--rule-strong);
  color: var(--accent);
  font-weight: 500;
}

.lex-cat-tab:hover:not(.active) {
  color: var(--text);
}

.lexicon-chips-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lexicon-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.lexicon-chip:hover {
  background-color: var(--hover);
  border-color: var(--rule-strong);
  color: var(--text);
}

.lexicon-chip.active {
  background-color: var(--hover);
  border-color: var(--accent);
  color: var(--accent);
}

.chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--text-3);
}

.lexicon-chip.active .chip-dot {
  background-color: var(--accent);
}
</style>
