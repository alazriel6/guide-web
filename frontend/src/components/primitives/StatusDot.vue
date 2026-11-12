<script setup lang="ts">
defineProps<{
  status?: string
  variant?: 'ok' | 'warn' | 'danger' | 'neutral'
  label?: string
}>()
</script>

<template>
  <span class="status-wrap">
    <span class="status-dot" :class="variant || 'neutral'"></span>
    <span class="status-text">{{ label || status }}</span>
  </span>
</template>

<style scoped>
.status-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.ok {
  background-color: var(--ok);
}

.status-dot.warn {
  background-color: var(--warn);
}

.status-dot.danger {
  background-color: var(--danger);
}

.status-dot.neutral {
  background-color: var(--text-3);
}

.status-text {
  font-size: 13px;
}
</style>
