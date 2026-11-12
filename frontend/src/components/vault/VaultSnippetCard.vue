<script setup lang="ts">
import {
  Copy,
  Check,
  Terminal,
  Code2,
  Sparkles,
  Bookmark,
  FolderTree,
  ExternalLink,
  Maximize2,
  ShieldAlert,
  Wand2,
} from 'lucide-vue-next'
import type { VaultSnippet } from '@/lib/vault/vaultData'
import { useVaultStore } from '@/stores/vaultStore'
import { highlightSyntax } from '@/lib/vault/syntaxHighlighter'
import type { ScaffoldTargetId } from '@/lib/prd/scaffoldGenerator'

interface Props {
  item: VaultSnippet
  copiedId: string | null
}

defineProps<Props>()
const vaultStore = useVaultStore()

const emit = defineEmits<{
  (e: 'copy-snippet', item: VaultSnippet): void
  (e: 'copy-cli', cmd: string, id: string): void
  (e: 'copy-all-cli', item: VaultSnippet): void
  (e: 'copy-folder', item: VaultSnippet): void
  (e: 'open-scaffold', targetId: ScaffoldTargetId): void
  (e: 'filter-tag', tag: string): void
}>()
</script>

<template>
  <article
    :id="`snippet-${item.id}`"
    class="vault-card"
    :class="{ bookmarked: vaultStore.isBookmarked(item.id) }"
  >
    <!-- Card Header -->
    <div class="card-header">
      <div class="card-badges font-mono">
        <span class="platform-badge">{{ item.platform }}</span>
        <span class="category-badge">{{ item.category }}</span>
        <span v-if="item.scaffoldTargetId" class="scaffold-tag">Scaffolder Ready</span>
      </div>

      <div class="card-actions">
        <!-- Direct Quick Project Scaffolder Trigger -->
        <button
          v-if="item.scaffoldTargetId"
          type="button"
          class="card-action-btn btn-scaffold font-mono"
          title="Buka Scaffolder Proyek Otomatis"
          @click="emit('open-scaffold', item.scaffoldTargetId as ScaffoldTargetId)"
        >
          <Wand2 :size="12" />
          <span>Scaffold Proyek</span>
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
          @click="emit('copy-snippet', item)"
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
            @click="emit('copy-cli', cmdItem.cmd, `${item.id}-cmd-${cIdx}`)"
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
            @click="emit('copy-all-cli', item)"
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
            @click="emit('copy-cli', cmdItem.cmd, `${item.id}-setup-cmd-${cIdx}`)"
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
            @click="emit('copy-folder', item)"
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
        @click="emit('filter-tag', tag)"
      >
        #{{ tag }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.vault-card {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.12s ease;
}

.vault-card:hover {
  border-color: var(--rule-strong);
}

.vault-card.bookmarked {
  border-left: 3px solid var(--accent);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.platform-badge {
  font-size: 11px;
  padding: 2px 7px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text);
  font-weight: 500;
}

.category-badge {
  font-size: 10.5px;
  padding: 2px 6px;
  background-color: transparent;
  color: var(--text-3);
  text-transform: uppercase;
}

.scaffold-tag {
  font-size: 10.5px;
  padding: 2px 6px;
  background-color: rgba(255, 122, 69, 0.1);
  border: 1px solid rgba(255, 122, 69, 0.3);
  border-radius: var(--radius);
  color: var(--accent);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.12s ease;
}

.card-action-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.btn-scaffold {
  color: var(--accent);
  border-color: rgba(255, 122, 69, 0.3);
}

.btn-bookmark.active {
  color: var(--accent);
  border-color: var(--accent);
}

.card-title {
  font-size: 20px;
  line-height: 1.25;
  color: var(--text);
  margin: 0;
  font-weight: 400;
}

.card-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
}

.card-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 4px;
  margin-top: 2px;
}

.card-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 11.5px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.12s ease;
}

.card-tab-btn:hover {
  color: var(--text);
  background-color: var(--hover);
}

.card-tab-btn.active {
  color: var(--accent);
  background-color: var(--elevated);
  border-color: var(--rule-strong);
  font-weight: 500;
}

.tab-pill-badge {
  font-size: 9.5px;
  padding: 0 4px;
  background-color: var(--surface);
  border-radius: 3px;
  color: var(--text-2);
}

.cli-section {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 8px 10px;
  margin-bottom: 8px;
}

.cli-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 10.5px;
}

.cli-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-weight: 600;
}

.mini-link-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  font-size: 10.5px;
  cursor: pointer;
}

.mini-link-btn:hover {
  color: var(--text);
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
  padding: 3px 6px;
  background-color: var(--surface);
  border-radius: var(--radius);
  font-size: 11.5px;
  cursor: pointer;
}

.cli-row:hover {
  background-color: var(--hover);
}

.cli-row-label {
  color: var(--text-3);
  font-size: 10.5px;
  white-space: nowrap;
}

.cli-code {
  color: var(--text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cli-copy-indicator {
  color: var(--accent);
  font-size: 10.5px;
  white-space: nowrap;
}

.code-viewport {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: var(--surface);
  border-bottom: 1px solid var(--rule);
  font-size: 11px;
  color: var(--text-3);
}

.code-content {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.55;
  overflow-x: auto;
  color: var(--text);
  max-height: 380px;
}

.takeaways-box {
  margin-top: 8px;
  padding: 8px 10px;
  background-color: var(--elevated);
  border-left: 2px solid var(--accent);
  border-radius: 0 var(--radius) var(--radius) 0;
}

.takeaways-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}

.takeaways-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}

.setup-steps-box {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 8px;
}

.setup-box-header {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 6px;
}

.setup-steps-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setup-step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  font-size: 10px;
  color: var(--text-3);
  flex-shrink: 0;
}

.gotchas-box {
  background-color: var(--elevated);
  border: 1px solid rgba(240, 106, 98, 0.3);
  border-left: 3px solid var(--danger);
  border-radius: var(--radius);
  padding: 10px 12px;
}

.gotchas-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--danger);
  margin-bottom: 6px;
}

.gotchas-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gotcha-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: var(--text-2);
}

.gotcha-bullet {
  color: var(--danger);
  font-weight: bold;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag-pill {
  padding: 2px 7px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-3);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.tag-pill:hover {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--rule-strong);
}
</style>
