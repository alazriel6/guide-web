<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  actionLabel?: string
}>()

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="empty-state">
    <h3 class="empty-title font-serif">{{ title }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="empty-action"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-title {
  font-size: 26px;
  margin: 0;
  color: var(--text);
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-3);
  max-width: 44ch;
}

.empty-action {
  margin-top: 12px;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--text);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  padding: 2px 0;
  cursor: pointer;
}

.empty-action:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
</style>
