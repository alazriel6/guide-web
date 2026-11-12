<script setup lang="ts">
import { useRoute, RouterLink, RouterView } from 'vue-router'
import {
  FileText,
  Cpu,
  Settings,
  BookOpen,
  LayoutDashboard,
  Code2,
  Bookmark,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-vue-next'
import { useAiConfigStore } from '@/stores/aiConfig'
import { useVaultStore } from '@/stores/vaultStore'
import { VAULT_CATEGORIES } from '@/lib/vault/vaultData'
import AiSettingsModal from '@/components/AiSettingsModal.vue'

const route = useRoute()
const aiStore = useAiConfigStore()
const vaultStore = useVaultStore()
</script>

<template>
  <div class="workbench-layout">
    <!-- Left Rail 240px -->
    <aside class="left-rail" aria-label="Sidebar navigation">
      <div class="rail-brand">
        <RouterLink to="/" class="brand-link">
          <div class="brand-logo-wrap" title="BlueprintDev Studio">
            <svg class="brand-logo-svg" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="navOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffa26e"/>
                  <stop offset="40%" stop-color="#ff7a45"/>
                  <stop offset="100%" stop-color="#e65818"/>
                </linearGradient>
                <linearGradient id="navUpper" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffab7c"/>
                  <stop offset="100%" stop-color="#ff7a45"/>
                </linearGradient>
                <linearGradient id="navLower" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ff7a45"/>
                  <stop offset="100%" stop-color="#de4d13"/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="120" height="120" rx="28" fill="#111317" stroke="#26292f" stroke-width="2.5"/>
              <g stroke="#ff7a45" stroke-width="1.5" stroke-linecap="round" opacity="0.4">
                <path d="M 16 26 L 16 16 L 26 16"/>
                <path d="M 112 26 L 112 16 L 102 16"/>
                <path d="M 16 102 L 16 112 L 26 112"/>
                <path d="M 112 102 L 112 112 L 102 112"/>
              </g>
              <!-- Foundation Pillar -->
              <rect x="28" y="26" width="14" height="76" rx="4" fill="url(#navOrange)"/>
              <!-- Upper Loop -->
              <path d="M 42 26 H 68 C 82 26 91.5 34.5 91.5 46.5 C 91.5 58.5 82 66 68 66 H 42 Z"
                    fill="none" stroke="url(#navUpper)" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>
              <!-- Lower Loop -->
              <path d="M 42 63 H 72.5 C 87.5 63 98 72 98 84 C 98 96 87.5 104.5 72.5 104.5 H 42 Z"
                    fill="none" stroke="url(#navLower)" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>
              <!-- Slit -->
              <line x1="42" y1="64.5" x2="71" y2="64.5" stroke="#111317" stroke-width="4.5" stroke-linecap="round"/>
              <!-- Scale Mark -->
              <rect x="29" y="63" width="7" height="3" rx="1.5" fill="#ffffff" opacity="0.95"/>
              <!-- Apex Nodes -->
              <circle cx="91.5" cy="46.5" r="3" fill="#ffffff" opacity="0.95"/>
              <circle cx="98" cy="84" r="3.4" fill="#ffffff" opacity="0.95"/>
            </svg>
          </div>
          <div class="brand-text-col">
            <span class="brand-heading font-serif">BlueprintDev</span>
            <span class="brand-sub">Workspace Arsitektur &amp; Kode</span>
          </div>
        </RouterLink>
      </div>

      <nav class="rail-nav">
        <RouterLink to="/" class="rail-link" exact-active-class="active">
          <LayoutDashboard :size="16" :stroke-width="1.5" />
          <span>Workspace</span>
        </RouterLink>

        <RouterLink to="/prd-studio" class="rail-link" active-class="active">
          <FileText :size="16" :stroke-width="1.5" />
          <span>Blueprint Studio</span>
        </RouterLink>

        <RouterLink to="/ops" class="rail-link" active-class="active">
          <ShieldCheck :size="16" :stroke-width="1.5" />
          <span>Production Ops &amp; QA</span>
        </RouterLink>

        <RouterLink to="/prompt-engineer" class="rail-link" active-class="active">
          <Cpu :size="16" :stroke-width="1.5" />
          <span>Prompt Compiler</span>
        </RouterLink>

        <!-- Dev Vault with Child Navigation -->
        <div class="rail-nav-group">
          <RouterLink
            to="/dev-vault"
            class="rail-link"
            :class="{ active: route.path.startsWith('/dev-vault') }"
          >
            <Code2 :size="16" :stroke-width="1.5" />
            <span class="rail-link-text">Dev Vault &amp; Sintaks</span>
            <button
              v-if="route.path.startsWith('/dev-vault')"
              type="button"
              class="subnav-toggle-btn"
              :title="vaultStore.isLeftNavOpen ? 'Tutup sub-menu kategori' : 'Buka sub-menu kategori'"
              @click.prevent.stop="vaultStore.isLeftNavOpen = !vaultStore.isLeftNavOpen"
            >
              <ChevronDown v-if="vaultStore.isLeftNavOpen" :size="13" />
              <ChevronRight v-else :size="13" />
            </button>
          </RouterLink>

          <!-- Child navigation of Dev Vault categories in the left rail -->
          <div
            v-if="route.path.startsWith('/dev-vault') && vaultStore.isLeftNavOpen"
            class="rail-child-menu"
            data-testid="vault-child-nav"
          >
            <button
              v-for="cat in VAULT_CATEGORIES"
              :key="cat.id"
              type="button"
              class="child-nav-item font-mono"
              :class="{ active: vaultStore.selectedCategory === cat.id }"
              :data-testid="`nav-cat-${cat.id}`"
              @click="vaultStore.setCategory(cat.id)"
            >
              <span class="child-item-name">{{ cat.name }}</span>
              <span class="child-item-count">{{ vaultStore.categoryCounts[cat.id] || 0 }}</span>
            </button>

            <!-- Bookmarked items filter -->
            <button
              type="button"
              class="child-nav-item bookmark-child-item font-mono"
              :class="{ active: vaultStore.selectedCategory === 'bookmarks' }"
              data-testid="nav-cat-bookmarks"
              @click="vaultStore.setCategory('bookmarks')"
            >
              <span class="bookmark-label-wrap">
                <Bookmark :size="11" />
                <span>Favorit Saya</span>
              </span>
              <span class="child-item-count">{{ vaultStore.categoryCounts.bookmarks || 0 }}</span>
            </button>
          </div>
        </div>

        <RouterLink to="/guide" class="rail-link" active-class="active">
          <BookOpen :size="16" :stroke-width="1.5" />
          <span>Panduan Aplikasi</span>
        </RouterLink>
      </nav>

      <div class="rail-footer">
        <button
          type="button"
          class="engine-trigger"
          @click="aiStore.openModal"
        >
          <div class="engine-info">
            <span class="engine-title">AI Engine</span>
            <span class="engine-status">{{ aiStore.statusBadgeText }}</span>
          </div>
          <Settings :size="15" :stroke-width="1.5" />
        </button>
      </div>
    </aside>

    <!-- Main Workspace Content Area -->
    <main class="workbench-main">
      <RouterView />
    </main>

    <!-- Persistent Modal -->
    <AiSettingsModal />
  </div>
</template>

<style scoped>
.workbench-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  background-color: var(--bg);
  color: var(--text);
}

.left-rail {
  width: 240px;
  background-color: var(--surface);
  border-right: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.rail-brand {
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--rule);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.brand-logo-wrap {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}

.brand-link:hover .brand-logo-wrap {
  transform: scale(1.05);
}

.brand-logo-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.brand-text-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-heading {
  font-size: 20px;
  color: var(--text);
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.2;
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 16px;
  flex: 1;
}

.rail-nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rail-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-2);
  transition: color 0.12s ease, background-color 0.12s ease;
}

.rail-link:hover {
  color: var(--text);
  background-color: var(--hover);
}

.rail-link.active {
  color: var(--text);
  background-color: var(--hover);
  font-weight: 600;
  border-left: 2px solid var(--accent);
}

.rail-link-text {
  flex: 1;
}

.subnav-toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.12s ease;
}

.subnav-toggle-btn:hover {
  color: var(--text);
  background-color: var(--elevated);
}

.rail-child-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0 6px 12px;
  margin-left: 10px;
  border-left: 1px solid var(--rule);
}

.child-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  border-radius: var(--radius);
  background: transparent;
  border: none;
  color: var(--text-3);
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
  width: 100%;
}

.child-nav-item:hover {
  color: var(--text);
  background-color: var(--hover);
}

.child-nav-item.active {
  color: var(--accent);
  background-color: var(--hover);
  font-weight: 600;
}

.child-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.child-item-count {
  font-size: 9.5px;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
  flex-shrink: 0;
}

.bookmark-label-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rail-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--rule);
}

.engine-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text);
  transition: border-color 0.12s ease;
}

.engine-trigger:hover {
  border-color: var(--rule-strong);
}

.engine-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.engine-title {
  font-size: 13px;
  font-weight: 500;
}

.engine-status {
  font-size: 12px;
  color: var(--text-3);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-main {
  padding: 24px 32px;
  width: 100%;
  min-width: 0;
}

@media (max-width: 768px) {
  .workbench-layout {
    grid-template-columns: 1fr;
  }
  .left-rail {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--rule);
  }
  .workbench-main {
    padding: 20px 14px;
  }
}
</style>
