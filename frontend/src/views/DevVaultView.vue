<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Search,
  Copy,
  Check,
  Terminal,
  Code2,
  Sparkles,
  Layers,
  Download,
  Bookmark,
  FolderTree,
  ExternalLink,
  BookOpen,
  Grid,
  List,
  Maximize2,
  Minimize2,
  ArrowUp,
  ShieldAlert,
  Wand2,
  X,
} from 'lucide-vue-next'
import {
  VAULT_CATEGORIES,
  VAULT_ENTRIES,
  exportVaultPlaybookMarkdown,
  type VaultSnippet,
} from '@/lib/vault/vaultData'
import { useVaultStore } from '@/stores/vaultStore'
import { highlightSyntax } from '@/lib/vault/syntaxHighlighter'
import ScaffoldModal from '@/components/prd/ScaffoldModal.vue'
import QuickRefDrawer from '@/components/vault/QuickRefDrawer.vue'
import type { ScaffoldTargetId } from '@/lib/prd/scaffoldGenerator'
import type { PrdModel } from '@/lib/prd/sections'

const vaultStore = useVaultStore()

const copiedId = ref<string | null>(null)
const showQuickRef = ref(false)
const showBackToTop = ref(false)
const isScaffoldModalOpen = ref(false)
const activeScaffoldTarget = ref<ScaffoldTargetId>('fullstack-go-vue')

// Fallback minimal PRD model for Scaffolder when launched from Dev Vault
const defaultVaultPrdModel: PrdModel = {
  title: 'My Scaffolded App',
  category: 'Full-Stack Web',
  is_preset: false,
  overview: 'Generated directly from Dev Vault Playbook.',
  problem: 'Automated initial project scaffolding.',
  personas: 'Developers',
  features: [
    { name: 'Authentication', description: 'JWT authentication & session guard', priority: 'mvp' },
    { name: 'Core API Endpoints', description: 'Resource management and data contract', priority: 'mvp' },
  ],
  flows: 'User authenticates -> receives token -> interacts with APIs',
  metrics: 'Sub-100ms API response time',
  stack: 'Full-stack modern framework',
  data_models: 'User (id, email, password_hash, created_at)\nRecord (id, user_id, title, status, created_at)',
  api_contract: 'POST /api/auth/login\nGET /api/records\nPOST /api/records\nGET /api/records/:id',
  nfr: 'Clean architecture, dockerized deployment, robust testing',
  non_goals: '',
  constraints: 'Production-ready TypeScript / compiled backend',
  open_questions: '',
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Current active category label
const currentCategoryLabel = computed(() => {
  if (vaultStore.selectedCategory === 'bookmarks') return 'Favorit Saya'
  const found = VAULT_CATEGORIES.find((c) => c.id === vaultStore.selectedCategory)
  return found ? found.name : 'Semua Ekosistem'
})

// Filtered entries
const filteredEntries = computed<VaultSnippet[]>(() => {
  const kw = vaultStore.searchKeyword.trim().toLowerCase()

  return VAULT_ENTRIES.filter((item) => {
    // Bookmark filter
    if (vaultStore.selectedCategory === 'bookmarks') {
      if (!vaultStore.isBookmarked(item.id)) return false
    } else if (vaultStore.selectedCategory !== 'all' && item.category !== vaultStore.selectedCategory) {
      return false
    }

    // Keyword match
    if (!kw) return true

    const inTitle = item.title.toLowerCase().includes(kw)
    const inPlatform = item.platform.toLowerCase().includes(kw)
    const inDesc = item.description.toLowerCase().includes(kw)
    const inTags = item.tags.some((t) => t.toLowerCase().includes(kw))
    const inCode = item.codeSnippet.toLowerCase().includes(kw)
    const inSetup = (item.setupSteps || []).some((s) => s.toLowerCase().includes(kw))
    const inGotchas = (item.gotchas || []).some((g) => g.toLowerCase().includes(kw))
    const inCli = (item.cliCommands || []).some(
      (c) => c.label.toLowerCase().includes(kw) || c.cmd.toLowerCase().includes(kw),
    )

    return inTitle || inPlatform || inDesc || inTags || inCode || inSetup || inGotchas || inCli
  })
})

const triggerCopyFeedback = (id: string) => {
  copiedId.value = id
  setTimeout(() => {
    if (copiedId.value === id) {
      copiedId.value = null
    }
  }, 2000)
}

const handleCopySnippet = (item: VaultSnippet) => {
  navigator.clipboard.writeText(item.codeSnippet)
  triggerCopyFeedback(item.id)
}

const handleCopyCli = (cmd: string, id: string) => {
  const customCmd = vaultStore.customizeCli(cmd)
  navigator.clipboard.writeText(customCmd)
  triggerCopyFeedback(id)
}

const handleCopyAllCli = (item: VaultSnippet) => {
  if (!item.cliCommands || item.cliCommands.length === 0) return
  const joined = item.cliCommands
    .map((c) => `# ${c.label}\n${vaultStore.customizeCli(c.cmd)}`)
    .join('\n\n')
  navigator.clipboard.writeText(joined)
  triggerCopyFeedback(`${item.id}-all-cli`)
}

const handleCopyFolder = (item: VaultSnippet) => {
  if (!item.folderStructure) return
  navigator.clipboard.writeText(item.folderStructure)
  triggerCopyFeedback(`${item.id}-folder`)
}

const handleDownloadMarkdown = () => {
  const md = exportVaultPlaybookMarkdown()
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'DEV_VAULT_PLAYBOOK.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const scrollToCard = (id: string) => {
  const el = document.getElementById(`vault-card-${id}`)
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const openScaffoldForTarget = (targetId: ScaffoldTargetId) => {
  activeScaffoldTarget.value = targetId
  isScaffoldModalOpen.value = true
}
</script>

<template>
  <div class="dev-vault-view full-width-layout">
    <!-- Header Hero -->
    <header class="vault-header">
      <div class="header-top-row">
        <div>
          <div class="eyebrow font-mono">
            <Code2 :size="13" />
            <span>DEVELOPER KNOWLEDGE BASE &amp; SINTAKS</span>
          </div>
          <h1 class="page-title font-serif">
            Dev Vault &amp; Buku Saku Sintaks
          </h1>
        </div>

        <!-- Top Utility Actions -->
        <div class="header-actions">
          <button
            type="button"
            class="action-btn font-mono"
            :class="{ active: showQuickRef }"
            data-testid="toggle-quick-ref-btn"
            @click="showQuickRef = !showQuickRef"
          >
            <BookOpen :size="13" />
            <span>{{ showQuickRef ? 'Tutup Contekan' : 'Contekan HTTP & Big-O' }}</span>
          </button>

          <button
            type="button"
            class="action-btn action-btn-primary font-mono"
            data-testid="download-playbook-btn"
            @click="handleDownloadMarkdown"
          >
            <Download :size="13" />
            <span>Unduh Buku Saku (.md)</span>
          </button>
        </div>
      </div>

      <p class="page-desc">
        Buku saku praktis: langkah setup proyek dari nol, struktur folder standar, perintah terminal penting, sintaks siap pakai, dan solusi kesalahan umum lintas bahasa.
      </p>

      <!-- Collapsible Quick Reference Drawer (HTTP Status & Big-O) -->
      <QuickRefDrawer :show="showQuickRef" />

      <!-- Streamlined Top Control Workbench -->
      <div class="vault-controls-card">
        <div class="controls-main-row">
          <!-- Search Bar -->
          <div class="search-input-wrap">
            <Search :size="15" class="search-icon" />
            <input
              v-model="vaultStore.searchKeyword"
              type="text"
              class="search-input font-mono"
              placeholder="Cari bahasa, framework, sintaks, atau perintah..."
            />
            <button
              v-if="vaultStore.searchKeyword"
              type="button"
              class="clear-btn font-mono"
              @click="vaultStore.searchKeyword = ''"
            >
              Reset
            </button>
          </div>

          <!-- Dynamic Project Name Variable Input -->
          <div class="project-name-input-wrap font-mono" title="Ketik nama proyek Anda; seluruh perintah terminal di bawah otomatis berganti!">
            <Terminal :size="13" class="project-icon" />
            <span class="project-label">Nama Proyek:</span>
            <input
              v-model="vaultStore.projectName"
              type="text"
              class="project-input font-mono"
              placeholder="nama-proyek"
            />
          </div>

          <!-- Layout Switcher: 2-Col vs 1-Col -->
          <div class="layout-switch font-mono" title="Pilih tata letak kartu">
            <button
              type="button"
              class="layout-btn"
              :class="{ active: vaultStore.viewLayout === 'grid' }"
              title="Tampilan 2 Kolom"
              data-testid="layout-grid-btn"
              @click="vaultStore.setViewLayout('grid')"
            >
              <Grid :size="13" />
              <span>2 Kolom</span>
            </button>
            <button
              type="button"
              class="layout-btn"
              :class="{ active: vaultStore.viewLayout === 'list' }"
              title="Tampilan 1 Kolom Penuh"
              data-testid="layout-list-btn"
              @click="vaultStore.setViewLayout('list')"
            >
              <List :size="13" />
              <span>1 Kolom Penuh</span>
            </button>
          </div>

          <!-- Global Tab Mode Switcher -->
          <div class="global-mode-switch font-mono" title="Ubah tampilan tab default semua kartu">
            <button
              type="button"
              class="mode-btn"
              :class="{ active: vaultStore.globalDefaultTab === 'code' }"
              @click="vaultStore.setGlobalMode('code')"
            >
              Sintaks
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: vaultStore.globalDefaultTab === 'setup' }"
              data-testid="global-mode-setup"
              @click="vaultStore.setGlobalMode('setup')"
            >
              Setup Proyek
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: vaultStore.globalDefaultTab === 'structure' }"
              @click="vaultStore.setGlobalMode('structure')"
            >
              Struktur Folder
            </button>
            <button
              type="button"
              class="mode-btn gotcha-mode-btn"
              :class="{ active: vaultStore.globalDefaultTab === 'gotchas' }"
              data-testid="global-mode-gotchas"
              @click="vaultStore.setGlobalMode('gotchas')"
            >
              Kesalahan Umum
            </button>
          </div>
        </div>

        <!-- Filter Status Bar & Quick Jump Chips -->
        <div class="filter-and-jump-row">
          <div class="active-category-indicator font-mono">
            <span class="active-cat-label">Kategori:</span>
            <span class="active-cat-pill font-mono">
              {{ currentCategoryLabel }}
              <span class="cat-count">({{ filteredEntries.length }})</span>
            </span>
            <button
              v-if="vaultStore.selectedCategory !== 'all'"
              type="button"
              class="reset-cat-btn font-mono"
              @click="vaultStore.setCategory('all')"
            >
              <X :size="11" />
              <span>Semua Kategori</span>
            </button>
          </div>

          <!-- Quick Jump Chips (Filtered to currently visible stacks) -->
          <div v-if="filteredEntries.length > 1" class="quick-jump-scroll font-mono">
            <span class="jump-label">Pilih bahasa:</span>
            <div class="jump-chips-wrap">
              <button
                v-for="item in filteredEntries"
                :key="`jump-${item.id}`"
                type="button"
                class="jump-chip font-mono"
                @click="scrollToCard(item.id)"
              >
                {{ item.platform }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Results Status Bar -->
    <div class="results-bar font-mono">
      <span>{{ filteredEntries.length }} playbook tersedia</span>
      <span v-if="vaultStore.searchKeyword" class="search-active-hint">
        Pencarian: "{{ vaultStore.searchKeyword }}"
      </span>
      <span class="project-name-hint">
        Nama Proyek: <code>{{ vaultStore.projectName }}</code>
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="filteredEntries.length === 0" class="empty-state-card">
      <Layers :size="32" class="empty-icon" />
      <h3 class="empty-title font-serif">
        {{ vaultStore.selectedCategory === 'bookmarks' ? 'Belum ada Playbook yang difavoritkan' : 'Tidak ditemukan playbook yang cocok' }}
      </h3>
      <p class="empty-desc">
        {{
          vaultStore.selectedCategory === 'bookmarks'
            ? 'Klik ikon Bookmark (pita) di pojok kanan atas kartu stack yang sering Anda pakai agar mudah diakses dari sini.'
            : 'Tidak ada sintaks atau langkah setup yang cocok dengan kata kunci pencarian Anda.'
        }}
      </p>
      <button
        type="button"
        class="btn-secondary btn-sm font-mono"
        @click="vaultStore.searchKeyword = ''; vaultStore.setCategory('all')"
      >
        Tampilkan semua ekosistem
      </button>
    </div>

    <!-- Vault Snippets Grid (Responsive 2-Col or 1-Col full width) -->
    <div
      v-else
      class="vault-grid"
      :class="{ 'layout-list-mode': vaultStore.viewLayout === 'list' }"
    >
      <article
        v-for="item in filteredEntries"
        :id="`vault-card-${item.id}`"
        :key="item.id"
        class="vault-card"
        :class="{ 'is-bookmarked': vaultStore.isBookmarked(item.id) }"
      >
        <!-- Card Top Bar -->
        <div class="card-header">
          <div class="header-badges">
            <span class="platform-badge font-mono">{{ item.platform }}</span>
            <span class="cat-badge font-mono">{{ item.category.toUpperCase() }}</span>
          </div>

          <div class="card-top-actions">
            <!-- 1-Click Scaffold Generator button (if target exists) -->
            <button
              v-if="item.scaffoldTargetId"
              type="button"
              class="card-action-btn btn-scaffold font-mono"
              title="Buat template proyek ini langsung (setup.bat, api.http, docker-compose)"
              :data-testid="`scaffold-btn-${item.id}`"
              @click="openScaffoldForTarget(item.scaffoldTargetId as ScaffoldTargetId)"
            >
              <Wand2 :size="12" />
              <span>Scaffold</span>
            </button>

            <!-- Focus / Fullscreen Mode button -->
            <button
              type="button"
              class="card-action-btn btn-focus font-mono"
              title="Buka tampilan fokus layar penuh"
              :data-testid="`focus-btn-${item.id}`"
              @click="vaultStore.openFocusModal(item)"
            >
              <Maximize2 :size="12" />
              <span>Fokus</span>
            </button>

            <!-- Docs link -->
            <a
              v-if="item.docsUrl"
              :href="item.docsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="card-action-btn btn-docs font-mono"
              title="Buka Dokumentasi Resmi"
            >
              <ExternalLink :size="12" />
              <span>Docs</span>
            </a>

            <!-- Bookmark toggle -->
            <button
              type="button"
              class="card-action-btn btn-bookmark font-mono"
              :class="{ active: vaultStore.isBookmarked(item.id) }"
              :title="vaultStore.isBookmarked(item.id) ? 'Hapus dari Favorit' : 'Simpan ke Favorit'"
              :data-testid="`bookmark-btn-${item.id}`"
              @click="vaultStore.toggleBookmark(item.id)"
            >
              <Bookmark :size="12" />
            </button>

            <!-- Copy code button -->
            <button
              type="button"
              class="card-action-btn btn-copy font-mono"
              :class="{ active: copiedId === item.id }"
              title="Salin cuplikan kode utama"
              @click="handleCopySnippet(item)"
            >
              <Check v-if="copiedId === item.id" :size="12" />
              <Copy v-else :size="12" />
              <span>{{ copiedId === item.id ? 'Copied' : 'Copy code' }}</span>
            </button>
          </div>
        </div>

        <!-- Card Title & Description -->
        <h2 class="card-title font-serif">{{ item.title }}</h2>
        <p class="card-desc">{{ item.description }}</p>

        <!-- Ergonomic Internal Card Tabs (4 Tabs) -->
        <div class="card-tabs font-mono" role="tablist">
          <button
            type="button"
            class="card-tab-btn"
            :class="{ active: vaultStore.getCardTab(item.id) === 'code' }"
            :data-testid="`tab-code-${item.id}`"
            @click="vaultStore.setCardTab(item.id, 'code')"
          >
            <Code2 :size="12" />
            <span>Sintaks</span>
          </button>

          <button
            type="button"
            class="card-tab-btn"
            :class="{ active: vaultStore.getCardTab(item.id) === 'setup' }"
            :data-testid="`tab-setup-${item.id}`"
            @click="vaultStore.setCardTab(item.id, 'setup')"
          >
            <Terminal :size="12" />
            <span>Setup Proyek</span>
            <span v-if="item.setupSteps?.length" class="tab-pill-badge">{{ item.setupSteps.length }}</span>
          </button>

          <button
            v-if="item.folderStructure"
            type="button"
            class="card-tab-btn"
            :class="{ active: vaultStore.getCardTab(item.id) === 'structure' }"
            :data-testid="`tab-structure-${item.id}`"
            @click="vaultStore.setCardTab(item.id, 'structure')"
          >
            <FolderTree :size="12" />
            <span>Struktur Folder</span>
          </button>

          <button
            v-if="item.gotchas && item.gotchas.length > 0"
            type="button"
            class="card-tab-btn tab-btn-gotcha"
            :class="{ active: vaultStore.getCardTab(item.id) === 'gotchas' }"
            :data-testid="`tab-gotchas-${item.id}`"
            @click="vaultStore.setCardTab(item.id, 'gotchas')"
          >
            <ShieldAlert :size="12" />
            <span>Kesalahan Umum</span>
            <span class="tab-pill-badge gotcha-count">{{ item.gotchas.length }}</span>
          </button>
        </div>

        <!-- TAB 1: CODE & SYNTAX (WITH SYNTAX HIGHLIGHTING) -->
        <div v-if="vaultStore.getCardTab(item.id) === 'code'" class="tab-panel">
          <!-- Compact Quick CLI Preview -->
          <div v-if="item.cliCommands && item.cliCommands.length > 0" class="cli-section">
            <div class="cli-label-row font-mono">
              <div class="cli-label">
                <Terminal :size="11" />
                <span>PERINTAH TERMINAL:</span>
              </div>
              <button
                type="button"
                class="mini-link-btn font-mono"
                @click="vaultStore.setCardTab(item.id, 'setup')"
              >
                Lihat langkah setup →
              </button>
            </div>
            <div class="cli-list">
              <div
                v-for="(cmdItem, cIdx) in item.cliCommands"
                :key="cIdx"
                class="cli-row font-mono"
                @click="handleCopyCli(cmdItem.cmd, `${item.id}-cmd-${cIdx}`)"
              >
                <span class="cli-row-label">{{ cmdItem.label }}:</span>
                <code class="cli-code">{{ vaultStore.customizeCli(cmdItem.cmd) }}</code>
                <span class="cli-copy-indicator">
                  {{ copiedId === `${item.id}-cmd-${cIdx}` ? 'Tersalin' : 'Salin' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Code Viewport with Syntax Highlighting -->
          <div class="code-viewport">
            <div class="code-header font-mono">
              <span class="code-lang-tag">{{ item.language }}</span>
              <span class="line-count">{{ item.codeSnippet.split('\n').length }} baris</span>
            </div>
            <pre class="code-content font-mono"><code v-html="highlightSyntax(item.codeSnippet)"></code></pre>
          </div>

          <!-- Key Takeaways & Pro Tips -->
          <div class="takeaways-box">
            <div class="takeaways-header font-mono">
              <Sparkles :size="11" />
              <span>CATATAN PENTING:</span>
            </div>
            <ul class="takeaways-list">
              <li v-for="(tip, tIdx) in item.keyTakeaways" :key="tIdx">
                {{ tip }}
              </li>
            </ul>
          </div>
        </div>

        <!-- TAB 2: SETUP FROM SCRATCH & CLI -->
        <div v-else-if="vaultStore.getCardTab(item.id) === 'setup'" class="tab-panel" :data-testid="`panel-setup-${item.id}`">
          <div v-if="item.setupSteps && item.setupSteps.length > 0" class="setup-steps-box">
            <div class="setup-box-header font-mono">
              <span>LANGKAH SETUP PROYEK:</span>
            </div>
            <ol class="setup-steps-list">
              <li v-for="(step, sIdx) in item.setupSteps" :key="sIdx" class="setup-step-item">
                <span class="step-num font-mono">{{ sIdx + 1 }}</span>
                <span class="step-text">{{ vaultStore.customizeCli(step) }}</span>
              </li>
            </ol>
          </div>

          <div v-if="item.cliCommands && item.cliCommands.length > 0" class="cli-section">
            <div class="cli-label-row font-mono">
              <div class="cli-label">
                <Terminal :size="11" />
                <span>DAFTAR PERINTAH LENGKAP:</span>
              </div>
              <button
                type="button"
                class="card-action-btn btn-copy font-mono"
                :class="{ active: copiedId === `${item.id}-all-cli` }"
                @click="handleCopyAllCli(item)"
              >
                <Check v-if="copiedId === `${item.id}-all-cli`" :size="11" />
                <Copy v-else :size="11" />
                <span>{{ copiedId === `${item.id}-all-cli` ? 'Tersalin' : 'Salin Semua' }}</span>
              </button>
            </div>
            <div class="cli-list">
              <div
                v-for="(cmdItem, cIdx) in item.cliCommands"
                :key="cIdx"
                class="cli-row font-mono"
                @click="handleCopyCli(cmdItem.cmd, `${item.id}-setup-cmd-${cIdx}`)"
              >
                <span class="cli-row-label">{{ cmdItem.label }}:</span>
                <code class="cli-code">{{ vaultStore.customizeCli(cmdItem.cmd) }}</code>
                <span class="cli-copy-indicator">
                  {{ copiedId === `${item.id}-setup-cmd-${cIdx}` ? 'Tersalin' : 'Salin' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: FOLDER STRUCTURE -->
        <div v-else-if="vaultStore.getCardTab(item.id) === 'structure'" class="tab-panel" :data-testid="`panel-structure-${item.id}`">
          <div class="code-viewport">
            <div class="code-header font-mono">
              <span>STRUKTUR FOLDER: {{ item.platform }}</span>
              <button
                type="button"
                class="card-action-btn btn-copy font-mono"
                :class="{ active: copiedId === `${item.id}-folder` }"
                @click="handleCopyFolder(item)"
              >
                <Check v-if="copiedId === `${item.id}-folder`" :size="11" />
                <Copy v-else :size="11" />
                <span>{{ copiedId === `${item.id}-folder` ? 'Tersalin' : 'Salin Struktur' }}</span>
              </button>
            </div>
            <pre class="code-content folder-tree-pre font-mono"><code>{{ item.folderStructure }}</code></pre>
          </div>
        </div>

        <!-- TAB 4: GOTCHAS & ANTI-PATTERNS -->
        <div v-else-if="vaultStore.getCardTab(item.id) === 'gotchas'" class="tab-panel" :data-testid="`panel-gotchas-${item.id}`">
          <div class="gotchas-box">
            <div class="gotchas-header font-mono">
              <ShieldAlert :size="13" />
              <span>KESALAHAN YANG SERING TERJADI:</span>
            </div>
            <ul class="gotchas-list">
              <li v-for="(gotcha, gIdx) in item.gotchas" :key="gIdx" class="gotcha-item">
                <span class="gotcha-bullet font-mono">!</span>
                <span class="gotcha-text">{{ gotcha }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Clickable Tags Row -->
        <div class="tags-row">
          <button
            v-for="tag in item.tags"
            :key="tag"
            type="button"
            class="tag-pill font-mono"
            title="Klik untuk memfilter tag ini"
            @click="vaultStore.searchKeyword = tag"
          >
            #{{ tag }}
          </button>
        </div>
      </article>
    </div>

    <!-- Focus / Fullscreen Modal -->
    <div
      v-if="vaultStore.focusModalItem"
      class="focus-modal-backdrop"
      @click.self="vaultStore.closeFocusModal()"
    >
      <div class="focus-modal-card" role="dialog" aria-modal="true">
        <div class="focus-modal-header">
          <div>
            <div class="header-badges">
              <span class="platform-badge font-mono">{{ vaultStore.focusModalItem.platform }}</span>
              <span class="cat-badge font-mono">{{ vaultStore.focusModalItem.category.toUpperCase() }}</span>
            </div>
            <h2 class="focus-title font-serif">{{ vaultStore.focusModalItem.title }}</h2>
          </div>

          <div class="focus-actions">
            <button
              v-if="vaultStore.focusModalItem.scaffoldTargetId"
              type="button"
              class="action-btn action-btn-primary font-mono"
              @click="openScaffoldForTarget(vaultStore.focusModalItem.scaffoldTargetId as ScaffoldTargetId)"
            >
              <Wand2 :size="12" />
              <span>Buat Proyek</span>
            </button>
            <button
              type="button"
              class="card-action-btn btn-copy font-mono"
              @click="handleCopySnippet(vaultStore.focusModalItem)"
            >
              <Copy :size="12" />
              <span>Salin Kode</span>
            </button>
            <button
              type="button"
              class="close-modal-btn"
              title="Tutup (ESC)"
              @click="vaultStore.closeFocusModal()"
            >
              <Minimize2 :size="15" />
            </button>
          </div>
        </div>

        <p class="focus-desc">{{ vaultStore.focusModalItem.description }}</p>

        <!-- Focus Code Viewport -->
        <div class="focus-code-viewport code-viewport">
          <div class="code-header font-mono">
            <span>{{ vaultStore.focusModalItem.language }}</span>
            <span>{{ vaultStore.focusModalItem.codeSnippet.split('\n').length }} baris</span>
          </div>
          <pre class="code-content focus-code-content font-mono"><code v-html="highlightSyntax(vaultStore.focusModalItem.codeSnippet)"></code></pre>
        </div>

        <!-- Gotchas inside Focus Modal -->
        <div v-if="vaultStore.focusModalItem.gotchas?.length" class="gotchas-box">
          <div class="gotchas-header font-mono">
            <ShieldAlert :size="12" />
            <span>HAL YANG PERLU DIPERHATIKAN:</span>
          </div>
          <ul class="gotchas-list">
            <li v-for="(g, gIdx) in vaultStore.focusModalItem.gotchas" :key="gIdx">
              {{ g }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Floating Back-to-Top Button -->
    <button
      v-if="showBackToTop"
      type="button"
      class="back-to-top-btn font-mono"
      title="Kembali ke atas"
      @click="scrollToTop"
    >
      <ArrowUp :size="16" />
      <span>Top</span>
    </button>

    <!-- Scaffold Modal Integration -->
    <ScaffoldModal
      :model="defaultVaultPrdModel"
      :is-open="isScaffoldModalOpen"
      :initial-target-id="activeScaffoldTarget"
      @close="isScaffoldModalOpen = false"
    />
  </div>
</template>

<style scoped>
.full-width-layout {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding-bottom: 64px;
}

.vault-header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--rule);
}

.header-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.page-title {
  font-size: 34px;
  line-height: 1.1;
  color: var(--text);
  margin: 0;
}

.page-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  max-width: 95ch;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.action-btn:hover {
  border-color: var(--rule-strong);
  color: var(--text);
  background-color: var(--elevated);
}

.action-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  background-color: var(--elevated);
}

.action-btn-primary {
  background-color: var(--elevated);
  border-color: var(--rule-strong);
  color: var(--text);
}

.action-btn-primary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Quick Reference Drawer */
.quick-ref-drawer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  background-color: var(--surface);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 16px;
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .quick-ref-drawer {
    grid-template-columns: 1fr;
  }
}

.quick-ref-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-ref-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.06em;
}

.quick-table-wrap {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow-x: auto;
}

.quick-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.quick-table th {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--text-3);
  font-size: 11px;
  font-weight: 600;
}

.quick-table td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--rule);
  vertical-align: top;
}

.quick-table tr:last-child td {
  border-bottom: none;
}

.status-code-badge,
.bigo-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.s-2xx,
.verdict-fast {
  background-color: rgba(16, 185, 129, 0.14);
  color: #34d399;
}

.s-4xx,
.verdict-moderate {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.s-5xx,
.verdict-slow {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.status-name-cell {
  color: var(--text);
  white-space: nowrap;
  font-size: 11.5px;
}

.status-desc-cell {
  color: var(--text-2);
  line-height: 1.45;
}

/* Controls Workbench */
.vault-controls-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 14px 16px;
}

.controls-main-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrap {
  flex: 2;
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 0 12px;
  height: 38px;
  transition: border-color 0.12s ease;
}

.search-input-wrap:focus-within {
  border-color: var(--accent);
}

.search-icon {
  color: var(--text-3);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-3);
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius);
}

.clear-btn:hover {
  color: var(--text);
  background-color: var(--hover);
}

/* Dynamic Project Name Input */
.project-name-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 0 10px;
  height: 38px;
}

.project-icon {
  color: var(--accent);
}

.project-label {
  font-size: 11.5px;
  color: var(--text-3);
  white-space: nowrap;
}

.project-input {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  width: 100px;
  outline: none;
}

.project-input:focus {
  border-bottom: 1px dashed var(--accent);
}

/* Layout Switcher */
.layout-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 3px 5px;
  height: 38px;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.layout-btn:hover {
  color: var(--text);
}

.layout-btn.active {
  background-color: var(--surface);
  border-color: var(--accent);
  color: var(--accent);
}

/* Global Mode Switch */
.global-mode-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 3px 6px;
  height: 38px;
}

.mode-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  color: var(--text-2);
  font-size: 11.5px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.mode-btn:hover {
  color: var(--text);
}

.mode-btn.active {
  background-color: var(--surface);
  border-color: var(--accent);
  color: var(--accent);
}

.gotcha-mode-btn.active {
  color: #fbbf24;
  border-color: #fbbf24;
}

/* Filter Status & Jump Row */
.filter-and-jump-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px dashed var(--rule);
  padding-top: 10px;
  flex-wrap: wrap;
}

.active-category-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.active-cat-label {
  color: var(--text-3);
}

.active-cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius);
  background-color: var(--elevated);
  border: 1px solid var(--accent);
  color: var(--accent);
  font-size: 11.5px;
}

.cat-count {
  font-size: 10px;
  opacity: 0.8;
}

.reset-cat-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-3);
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
}

.reset-cat-btn:hover {
  color: var(--text);
  border-color: var(--rule-strong);
}

/* Quick Jump Horizontal Scroll */
.quick-jump-scroll {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  max-width: 60%;
}

.jump-label {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
}

.jump-chips-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jump-chip {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: 3px;
  color: var(--text-2);
  font-size: 11px;
  padding: 2px 8px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.12s ease;
}

.jump-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Results Status Bar */
.results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-3);
  padding: 0 4px;
}

.search-active-hint {
  color: var(--accent);
}

.project-name-hint code {
  color: var(--accent);
  background-color: var(--surface);
  padding: 1px 5px;
  border-radius: 3px;
}

/* Empty State */
.empty-state-card {
  padding: 48px;
  text-align: center;
  border: 1px dashed var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  color: var(--text-3);
}

.empty-title {
  font-size: 20px;
  color: var(--text);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-2);
  max-width: 58ch;
  margin: 0 0 8px;
}

/* Vault Snippets Grid */
.vault-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
}

.vault-grid.layout-list-mode {
  grid-template-columns: minmax(0, 1fr);
}

@media (max-width: 1080px) {
  .vault-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Card Styling */
.vault-card {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 13px;
  transition: border-color 0.12s ease;
  min-width: 0;
}

.vault-card:hover {
  border-color: var(--rule-strong);
}

.vault-card.is-bookmarked {
  border-color: rgba(245, 158, 11, 0.5);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  padding: 2px 8px;
  border-radius: var(--radius);
}

.cat-badge {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

.card-top-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.card-action-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px;
  height: 26px !important;
  width: auto !important;
  min-width: 0;
  padding: 0 9px !important;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box !important;
  transition: all 0.12s ease;
}

.card-action-btn:hover {
  color: var(--text);
  border-color: var(--rule-strong);
  background-color: var(--hover);
}

.card-action-btn.btn-scaffold {
  border-color: rgba(249, 115, 22, 0.45);
  color: var(--accent);
}

.card-action-btn.btn-scaffold:hover {
  border-color: var(--accent);
  background-color: rgba(249, 115, 22, 0.12);
}

.card-action-btn.btn-bookmark {
  width: 26px !important;
  height: 26px !important;
  padding: 0 !important;
}

.card-action-btn.btn-bookmark.active,
.card-action-btn.btn-copy.active {
  color: var(--accent);
  border-color: var(--accent);
}

.card-action-btn span {
  white-space: nowrap;
}

.card-title {
  font-size: 20px;
  line-height: 1.25;
  color: var(--text);
  margin: 0;
}

.card-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
}

/* Ergonomic Card Tabs (4 tabs) */
.card-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8px;
  flex-wrap: wrap;
}

.card-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-3);
  font-size: 11.5px;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.12s ease;
}

.card-tab-btn:hover {
  color: var(--text);
  background-color: var(--elevated);
}

.card-tab-btn.active {
  background-color: var(--elevated);
  border-color: var(--rule-strong);
  color: var(--accent);
}

.tab-btn-gotcha.active {
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.4);
}

.tab-pill-badge {
  font-size: 10px;
  background-color: rgba(255, 255, 255, 0.07);
  padding: 0 5px;
  border-radius: 3px;
}

.gotcha-count {
  background-color: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

/* Setup Steps Box */
.setup-steps-box {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setup-box-header {
  font-size: 10.5px;
  color: var(--accent);
  letter-spacing: 0.06em;
  font-weight: 600;
}

.setup-steps-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-2);
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  color: var(--accent);
  font-size: 11px;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

/* CLI Section */
.cli-section {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cli-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cli-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 0.06em;
}

.mini-link-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0;
}

.mini-link-btn:hover {
  text-decoration: underline;
}

.cli-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cli-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  transition: background-color 0.1s ease;
}

.cli-row:hover {
  background-color: var(--hover);
}

.cli-row-label {
  color: var(--text-3);
  width: 110px;
  flex-shrink: 0;
}

.cli-code {
  flex: 1;
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cli-copy-indicator {
  font-size: 9px;
  color: var(--text-3);
  text-transform: uppercase;
}

/* Code Viewport with Syntax Highlighting */
.code-viewport {
  background-color: #070809;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
  min-width: 0;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--rule);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
}

.code-lang-tag {
  color: var(--accent);
  font-weight: 600;
}

.code-content {
  padding: 14px;
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #e5e7eb;
  overflow-x: auto;
  max-height: 290px;
  tab-size: 2;
}

/* Syntax Highlighting Token Styles */
:deep(.syn-kw) {
  color: #fb923c; /* Warm Orange / Amber keyword */
  font-weight: 600;
}

:deep(.syn-str) {
  color: #34d399; /* Mint / Emerald String */
}

:deep(.syn-comm) {
  color: #6b7280; /* Gray italic Comment */
  font-style: italic;
}

:deep(.syn-type) {
  color: #38bdf8; /* Sky Blue Types */
}

:deep(.syn-fn) {
  color: #facc15; /* Yellow Functions */
}

:deep(.syn-num) {
  color: #c084fc; /* Purple Numbers */
}

.folder-tree-pre {
  color: #93c5fd;
  max-height: 320px;
}

/* Takeaways Box */
.takeaways-box {
  background-color: var(--elevated);
  border-left: 2px solid var(--accent);
  padding: 10px 14px;
  border-radius: 0 var(--radius) var(--radius) 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.takeaways-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 0.06em;
}

.takeaways-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Gotchas & Anti-Patterns Box */
.gotchas-box {
  background-color: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-left: 3px solid #f59e0b;
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gotchas-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #fbbf24;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.gotchas-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gotcha-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-2);
}

.gotcha-bullet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  font-size: 10px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
}

.gotcha-text {
  flex: 1;
}

/* Tags Row */
.tags-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 4px;
}

.tag-pill {
  font-size: 10px;
  color: var(--text-3);
  background-color: var(--elevated);
  border: 1px solid transparent;
  padding: 2px 7px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.tag-pill:hover {
  border-color: var(--rule-strong);
  color: var(--accent);
}

/* Focus Modal Overlay */
.focus-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.focus-modal-card {
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  width: 92vw;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}

.focus-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 14px;
}

.focus-title {
  font-size: 26px;
  margin: 6px 0 0;
  color: var(--text);
}

.focus-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}

.focus-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-modal-btn {
  background: var(--elevated);
  border: 1px solid var(--rule);
  color: var(--text-2);
  border-radius: var(--radius);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-modal-btn:hover {
  color: var(--text);
  border-color: var(--rule-strong);
}

.focus-code-content {
  max-height: 55vh;
  font-size: 13px;
}

/* Floating Back-to-Top */
.back-to-top-btn {
  position: fixed;
  bottom: 28px;
  right: 28px;
  height: 40px;
  padding: 0 14px;
  background-color: var(--elevated);
  border: 1px solid var(--rule-strong);
  border-radius: 20px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  z-index: 900;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  transition: all 0.12s ease;
}

.back-to-top-btn:hover {
  background-color: var(--hover);
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}
</style>
