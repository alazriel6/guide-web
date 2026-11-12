<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 3,
  },
)
</script>

<template>
  <div class="skeleton-list">
    <div v-for="n in count" :key="n" class="skeleton-row">
      <div class="skeleton-cell title-bar"></div>
      <div class="skeleton-cell meta-bar"></div>
      <div class="skeleton-cell date-bar"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
}

.skeleton-row {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 12px;
  border-bottom: 1px solid var(--rule);
}

.skeleton-cell {
  height: 12px;
  border-radius: var(--radius);
  background-color: var(--elevated);
}

.title-bar {
  width: 45%;
}

.meta-bar {
  width: 25%;
}

.date-bar {
  width: 15%;
  margin-left: auto;
}
</style>
