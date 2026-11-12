<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, ArrowRight, FileText } from 'lucide-vue-next'
import { prdApi, type PrdDocument } from '@/services/api'
import { FALLBACK_PRD_PRESETS } from '@/services/defaultPresets'
import StatusDot from '@/components/primitives/StatusDot.vue'
import SkeletonRow from '@/components/primitives/SkeletonRow.vue'
import EmptyState from '@/components/primitives/EmptyState.vue'

const router = useRouter()

const prds = ref<PrdDocument[]>([])
const loading = ref(true)
const selectedPrd = ref<PrdDocument | null>(null)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'Recently'
  }
}

const fetchDocuments = async () => {
  loading.value = true
  try {
    const list = await prdApi.list()
    prds.value = list
    if (list.length > 0) {
      selectedPrd.value = list[0] ?? null
    }
  } catch {
    prds.value = [...FALLBACK_PRD_PRESETS]
    if (prds.value.length > 0) {
      selectedPrd.value = prds.value[0] ?? null
    }
  } finally {
    loading.value = false
  }
}

const selectDocument = (doc: PrdDocument) => {
  selectedPrd.value = doc
}

const openStudioWithDoc = (doc?: PrdDocument | null) => {
  if (doc && doc.id) {
    sessionStorage.setItem('bridge_prd_draft', JSON.stringify(doc))
  }
  router.push('/prd-studio')
}

const createNewPrd = () => {
  router.push('/prd-studio')
}

onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div class="workspace-page">
    <!-- Workspace Header -->
    <header class="workspace-header">
      <div>
        <h1 class="page-title font-serif">Workspace</h1>
        <p class="page-sub">Kelola spesifikasi produk dan rancangan teknis aplikasi Anda</p>
      </div>

      <button type="button" class="btn-primary" @click="createNewPrd">
        <Plus :size="16" :stroke-width="1.5" />
        <span>Blueprint Baru</span>
      </button>
    </header>

    <!-- Asymmetric 8/4 Grid (Left = Document Table, Right = Sticky Preview) -->
    <div class="workspace-grid">
      <!-- Left Column: Document Table (8 Cols) -->
      <section class="docs-column" aria-label="Recent documents">
        <div class="column-header">
          <h2 class="column-title">Dokumen Spesifikasi</h2>
          <span class="count-label">{{ prds.length }} dokumen</span>
        </div>

        <div v-if="loading">
          <SkeletonRow :count="6" />
        </div>

        <div v-else-if="prds.length === 0">
          <EmptyState
            title="Belum ada dokumen"
            description="Mulai rancang arsitektur aplikasi Anda dengan membuat cetak biru pertama."
            action-label="Buat Blueprint Baru"
            @action="createNewPrd"
          />
        </div>

        <div v-else class="table-container">
          <table class="table-workbench">
            <thead>
              <tr>
                <th class="th-title">Judul</th>
                <th class="th-category">Kategori</th>
                <th class="th-date">Diperbarui</th>
                <th class="th-status">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in prds"
                :key="item.id || item.title"
                :class="{ active: selectedPrd?.id === item.id }"
                @click="selectDocument(item)"
              >
                <td class="cell-title">
                  <span class="doc-name">{{ item.title }}</span>
                </td>
                <td class="cell-category">{{ item.category }}</td>
                <td class="cell-date font-mono">{{ formatDate(item.updated_at) }}</td>
                <td class="cell-status">
                  <StatusDot
                    :variant="item.is_preset ? 'neutral' : 'ok'"
                    :label="item.is_preset ? 'Preset' : 'Draft'"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Right Column: Real Document Preview (4 Cols) -->
      <aside class="preview-column" aria-label="Document reader">
        <div v-if="selectedPrd" class="reader-container">
          <div class="reader-meta-bar">
            <div class="reader-info">
              <span class="reader-category">{{ selectedPrd.category }}</span>
              <StatusDot
                :variant="selectedPrd.is_preset ? 'neutral' : 'ok'"
                :label="selectedPrd.is_preset ? 'Preset' : 'Draft'"
              />
            </div>
            <button
              type="button"
              class="btn-secondary btn-sm"
              @click="openStudioWithDoc(selectedPrd)"
            >
              <span>Buka Editor</span>
              <ArrowRight :size="13" :stroke-width="1.5" />
            </button>
          </div>

          <article class="document-article">
            <h2 class="doc-heading font-serif">{{ selectedPrd.title }}</h2>

            <!-- Numbered sections with 48px serif numerals -->
            <div class="document-section">
              <div class="numeral-header">
                <span class="serif-numeral font-serif">01</span>
                <h3 class="section-heading">Ringkasan Proyek</h3>
              </div>
              <p class="section-body">{{ selectedPrd.overview }}</p>
            </div>

            <div v-if="selectedPrd.target_users" class="document-section">
              <div class="numeral-header">
                <span class="serif-numeral font-serif">02</span>
                <h3 class="section-heading">Target Pengguna</h3>
              </div>
              <div class="section-body pre-line">{{ selectedPrd.target_users }}</div>
            </div>

            <div v-if="selectedPrd.core_features" class="document-section">
              <div class="numeral-header">
                <span class="serif-numeral font-serif">03</span>
                <h3 class="section-heading">Fitur Utama</h3>
              </div>
              <div class="section-body pre-line">{{ selectedPrd.core_features }}</div>
            </div>

            <div v-if="selectedPrd.tech_stack" class="document-section">
              <div class="numeral-header">
                <span class="serif-numeral font-serif">04</span>
                <h3 class="section-heading">Teknologi &amp; Arsitektur</h3>
              </div>
              <div class="section-body pre-line font-mono">{{ selectedPrd.tech_stack }}</div>
            </div>

            <div v-if="selectedPrd.architecture_specs" class="document-section">
              <div class="numeral-header">
                <span class="serif-numeral font-serif">05</span>
                <h3 class="section-heading">Model Data &amp; Kontrak API</h3>
              </div>
              <div class="section-body pre-line font-mono">{{ selectedPrd.architecture_specs }}</div>
            </div>

            <div v-if="selectedPrd.edge_cases" class="document-section">
              <div class="numeral-header">
                <span class="serif-numeral font-serif">06</span>
                <h3 class="section-heading">Non-goals &amp; edge cases</h3>
              </div>
              <div class="section-body pre-line">{{ selectedPrd.edge_cases }}</div>
            </div>
          </article>
        </div>

        <div v-else class="empty-reader">
          <FileText :size="32" :stroke-width="1.5" />
          <p>Select a document on the left to preview its specification</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.workspace-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.workspace-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--rule);
}

.page-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.1;
  color: var(--text);
}

.page-sub {
  margin: 6px 0 0;
  font-size: 15px;
  color: var(--text-2);
}

/* Asymmetric 5/7 Grid */
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(460px, 5fr) minmax(540px, 7fr);
  gap: 32px;
  align-items: start;
}

.docs-column {
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
}

.column-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--rule);
}

.column-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.count-label {
  font-size: 13px;
  color: var(--text-3);
}

.table-container {
  overflow-x: auto;
}

.th-title {
  width: auto;
}

.th-category {
  width: 160px;
}

.th-date {
  width: 120px;
}

.th-status {
  width: 120px;
}

.cell-title {
  font-weight: 500;
  color: var(--text);
}

.doc-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-category {
  color: var(--text-2);
}

.cell-date {
  color: var(--text-3);
  font-size: 13px;
}

.cell-status {
  white-space: nowrap;
}

/* Right column preview */
.preview-column {
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--surface);
  padding: 24px 28px;
  position: sticky;
  top: 32px;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
}

.reader-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reader-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--rule);
}

.reader-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reader-category {
  font-size: 13px;
  color: var(--text-2);
}

.document-article {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.doc-heading {
  margin: 0;
  font-size: 28px;
  color: var(--text);
  line-height: 1.2;
}

.document-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--rule);
}

.numeral-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.serif-numeral {
  font-size: 40px;
  line-height: 1;
  color: var(--text-3);
  user-select: none;
}

.section-heading {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.section-body {
  margin: 0;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.65;
}

.pre-line {
  white-space: pre-line;
}

.empty-reader {
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-3);
  gap: 12px;
}

@media (max-width: 1040px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
  .preview-column {
    position: static;
    max-height: 600px;
  }
}
</style>
