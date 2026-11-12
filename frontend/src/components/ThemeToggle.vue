<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

const applyTheme = (dark: boolean) => {
  isDark.value = dark
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('prd_editorial_theme', dark ? 'dark' : 'light')
    }
  } catch {
    // ignore in environments without localStorage
  }
}

const toggle = () => {
  applyTheme(!isDark.value)
}

onMounted(() => {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('prd_editorial_theme') : null
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches

    if (saved === 'dark' || (!saved && prefersDark)) {
      applyTheme(true)
    } else {
      applyTheme(false)
    }
  } catch {
    applyTheme(false)
  }
})
</script>

<template>
  <button
    type="button"
    class="theme-toggle-btn"
    :title="isDark ? 'Switch to light paper' : 'Switch to dark paper'"
    @click="toggle"
  >
    <span class="theme-label">{{ isDark ? 'Dark paper' : 'Light paper' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 4px 10px;
  color: var(--text-2);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;
}

.theme-toggle-btn:hover {
  border-color: var(--rule-strong);
  color: var(--text);
}

.theme-label {
  font-size: 13px;
}
</style>
