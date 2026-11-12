<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import AccessibleModal from '@/components/primitives/AccessibleModal.vue'
import type { PrdModel } from '@/lib/prd/sections'

export interface Snapshot {
  timestamp: string
  title: string
  model: PrdModel
}

interface Props {
  show: boolean
  snapshots: Snapshot[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'restore', snap: Snapshot): void
}>()
</script>

<template>
  <AccessibleModal
    :show="show"
    title="Riwayat Versi Dokumen"
    max-width="520px"
    @close="emit('close')"
  >
    <div class="history-list">
      <div v-if="snapshots.length === 0" class="history-empty">
        Belum ada riwayat tersimpan untuk dokumen ini.
      </div>
      <div
        v-for="(snap, idx) in snapshots"
        :key="idx"
        class="history-item"
      >
        <div class="history-meta">
          <span class="history-time font-mono">{{ snap.timestamp }}</span>
          <span class="history-title">{{ snap.title }}</span>
        </div>
        <button
          type="button"
          class="btn-secondary btn-sm"
          @click="emit('restore', snap)"
        >
          <RotateCcw :size="12" />
          <span>Pulihkan</span>
        </button>
      </div>
    </div>
  </AccessibleModal>
</template>

<style scoped>
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-empty {
  font-size: 13px;
  color: var(--text-3);
  text-align: center;
  padding: 24px 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.history-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-time {
  font-size: 11px;
  color: var(--text-3);
}

.history-title {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}
</style>
