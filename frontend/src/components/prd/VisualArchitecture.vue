<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Database,
  Layers,
  Copy,
  Check,
  Download,
  ExternalLink,
  ArrowRight,
  GitCompare,
  Globe,
} from 'lucide-vue-next'
import type { PrdModel } from '@/lib/prd/sections'
import {
  parseDataModels,
  extractRelationships,
  parseUserFlows,
  parseApiEndpoints,
  generateMermaidErDiagram,
  generateMermaidSequenceDiagram,
  type ParsedEntity,
} from '@/lib/prd/diagramParser'
import {
  generateOpenApiDocument,
  stringifyYaml,
  generatePostmanCollection,
  downloadSpecFile,
} from '@/lib/prd/openapiGenerator'

interface Props {
  model: PrdModel
}

const props = defineProps<Props>()

// Sub-view: 'erd' | 'flow' | 'openapi' | 'mermaid'
const activeSubView = ref<'erd' | 'flow' | 'openapi' | 'mermaid'>('erd')
const openApiFormat = ref<'yaml' | 'json' | 'postman'>('yaml')
const copiedNotice = ref(false)
const hoveredFkTarget = ref<string | null>(null)

// Parsed structures
const entities = computed<ParsedEntity[]>(() => parseDataModels(props.model.data_models || ''))
const relationships = computed(() => extractRelationships(entities.value))
const flows = computed(() => parseUserFlows(props.model.flows || ''))
const endpoints = computed(() => parseApiEndpoints(props.model.api_contract || ''))

// Generated OpenAPI & Postman specifications
const openApiDoc = computed(() => generateOpenApiDocument(props.model))
const openApiYaml = computed(() => stringifyYaml(openApiDoc.value))
const openApiJson = computed(() => JSON.stringify(openApiDoc.value, null, 2))
const postmanJson = computed(() => generatePostmanCollection(props.model))

const currentSpecCode = computed(() => {
  if (openApiFormat.value === 'json') return openApiJson.value
  if (openApiFormat.value === 'postman') return postmanJson.value
  return openApiYaml.value
})

// Generated Mermaid strings
const mermaidEr = computed(() => generateMermaidErDiagram(entities.value))
const mermaidSeq = computed(() => generateMermaidSequenceDiagram(flows.value, endpoints.value))
const activeMermaidCode = computed(() => {
  return activeSubView.value === 'flow' ? mermaidSeq.value : mermaidEr.value
})

const copyCurrentText = async (text: string) => {
  await navigator.clipboard.writeText(text)
  copiedNotice.value = true
  setTimeout(() => {
    copiedNotice.value = false
  }, 1600)
}

const downloadOpenApiFile = (format: 'yaml' | 'json' | 'postman') => {
  const slug = (props.model.title || 'api-spec')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'api'

  if (format === 'yaml') {
    downloadSpecFile(openApiYaml.value, `${slug}-openapi.yaml`, 'application/x-yaml')
  } else if (format === 'json') {
    downloadSpecFile(openApiJson.value, `${slug}-openapi.json`, 'application/json')
  } else {
    downloadSpecFile(postmanJson.value, `${slug}-postman-collection.json`, 'application/json')
  }
}

const downloadMermaidFile = () => {
  const slug = (props.model.title || 'diagram')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const filename = `${slug || 'architecture'}-${activeSubView.value === 'flow' ? 'sequence' : 'erd'}.mmd`

  const blob = new Blob([activeMermaidCode.value], { type: 'text/vnd.mermaid;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const openMermaidLive = () => {
  const code = activeMermaidCode.value
  const state = {
    code,
    mermaid: { theme: 'dark' },
    autoSync: true,
    updateDiagram: true,
  }
  const jsonStr = JSON.stringify(state)
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)))
  window.open(`https://mermaid.live/edit#base64:${base64}`, '_blank')
}
</script>

<template>
  <div class="visual-arch-container">
    <!-- Visual Sub-Toolbar -->
    <div class="arch-toolbar">
      <div class="view-toggles">
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: activeSubView === 'erd' }"
          @click="activeSubView = 'erd'"
        >
          <Database :size="13" />
          <span>Database ERD ({{ entities.length }} tables)</span>
        </button>

        <button
          type="button"
          class="toggle-btn"
          :class="{ active: activeSubView === 'flow' }"
          @click="activeSubView = 'flow'"
        >
          <GitCompare :size="13" />
          <span>System &amp; API flows ({{ endpoints.length }} routes)</span>
        </button>

        <button
          type="button"
          class="toggle-btn"
          :class="{ active: activeSubView === 'openapi' }"
          @click="activeSubView = 'openapi'"
        >
          <Globe :size="13" />
          <span>OpenAPI 3.1 &amp; Postman</span>
        </button>

        <button
          type="button"
          class="toggle-btn"
          :class="{ active: activeSubView === 'mermaid' }"
          @click="activeSubView = 'mermaid'"
        >
          <Layers :size="13" />
          <span>Mermaid code</span>
        </button>
      </div>

      <div class="arch-actions">
        <template v-if="activeSubView === 'openapi'">
          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Download OpenAPI YAML"
            @click="downloadOpenApiFile('yaml')"
          >
            <Download :size="12" />
            <span>openapi.yaml</span>
          </button>
          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Download Postman Collection"
            @click="downloadOpenApiFile('postman')"
          >
            <Download :size="12" />
            <span>Postman</span>
          </button>
          <button
            type="button"
            class="btn-secondary btn-xs"
            @click="copyCurrentText(currentSpecCode)"
          >
            <Check v-if="copiedNotice" :size="12" />
            <Copy v-else :size="12" />
            <span>{{ copiedNotice ? 'Copied' : 'Copy Spec' }}</span>
          </button>
        </template>

        <template v-else>
          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Copy Mermaid.js source"
            @click="copyCurrentText(activeMermaidCode)"
          >
            <Check v-if="copiedNotice" :size="12" />
            <Copy v-else :size="12" />
            <span>{{ copiedNotice ? 'Copied' : 'Copy Mermaid' }}</span>
          </button>

          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Download Mermaid (.mmd) file"
            @click="downloadMermaidFile"
          >
            <Download :size="12" />
            <span>.mmd</span>
          </button>

          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Open in Mermaid Live Editor"
            @click="openMermaidLive"
          >
            <ExternalLink :size="12" />
            <span>Live Editor</span>
          </button>
        </template>
      </div>
    </div>

    <!-- 1. Database ERD View -->
    <div v-if="activeSubView === 'erd'" class="erd-view-wrapper">
      <!-- Relationships Banner -->
      <div v-if="relationships.length > 0" class="relationships-banner">
        <span class="rel-header font-mono">RELATIONAL SCHEMAS:</span>
        <div class="rel-chips">
          <div
            v-for="(rel, idx) in relationships"
            :key="idx"
            class="rel-chip font-mono"
            @mouseenter="hoveredFkTarget = rel.fromTable"
            @mouseleave="hoveredFkTarget = null"
          >
            <span class="table-tag pk-tag">{{ rel.fromTable }}</span>
            <span class="arrow-sym">1 ── N</span>
            <span class="table-tag fk-tag">{{ rel.toTable }}</span>
            <span class="via-sub">({{ rel.fromField }})</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="entities.length === 0" class="empty-diagram-box font-mono">
        No structured tables detected in Section 08 (Data models &amp; schemas).
        <br />
        Format each entity as: <code>- **table_name**: id (PK), field (VARCHAR), other_id (FK)...</code>
      </div>

      <!-- Grid of Database Schema Cards -->
      <div v-else class="entities-grid">
        <div
          v-for="entity in entities"
          :key="entity.name"
          class="entity-card"
          :class="{ 'highlight-target': hoveredFkTarget === entity.name }"
        >
          <div class="card-header">
            <div class="table-title-group">
              <Database :size="13" class="table-icon" />
              <span class="table-name font-mono">{{ entity.name }}</span>
            </div>
            <span class="col-count font-mono">{{ entity.fields.length }} cols</span>
          </div>

          <div class="card-table-body">
            <div
              v-for="field in entity.fields"
              :key="field.name"
              class="field-row font-mono"
              :class="{ 'is-pk': field.isPk, 'is-fk': field.isFk }"
            >
              <div class="field-meta-left">
                <span v-if="field.isPk" class="badge-key badge-pk">PK</span>
                <span v-else-if="field.isFk" class="badge-key badge-fk">FK</span>
                <span v-else class="key-placeholder">·</span>
                <span class="field-name">{{ field.name }}</span>
              </div>
              <span class="field-type">{{ field.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. System Sequence & API Flows View -->
    <div v-else-if="activeSubView === 'flow'" class="flow-view-wrapper">
      <div class="flow-section-block">
        <h3 class="flow-block-title font-mono">1. REST API CONTRACT &amp; DISPATCH MATRIX</h3>
        <div v-if="endpoints.length === 0" class="empty-diagram-box font-mono">
          No endpoints found in Section 09 (API contract &amp; endpoints).
          <br />
          Example: <code>- GET /api/v1/flags -> Returns evaluated flag manifest</code>
        </div>
        <div v-else class="endpoints-table">
          <div
            v-for="(ep, idx) in endpoints"
            :key="idx"
            class="endpoint-row font-mono"
          >
            <span
              class="method-badge"
              :class="`method-${ep.method.toLowerCase()}`"
            >{{ ep.method }}</span>
            <span class="endpoint-path">{{ ep.path }}</span>
            <span class="endpoint-desc font-sans">{{ ep.description }}</span>
          </div>
        </div>
      </div>

      <div class="flow-section-block">
        <h3 class="flow-block-title font-mono">2. SYSTEM SEQUENCE TRANSITIONS</h3>
        <div v-if="flows.length === 0" class="empty-diagram-box font-mono">
          No sequence flows found in Section 05 (Key user flows).
          <br />
          Example: <code>1. User Request -> 2. Service Logic -> 3. DB Mutation</code>
        </div>
        <div v-else class="steps-timeline">
          <div
            v-for="step in flows"
            :key="step.stepNumber"
            class="step-card"
          >
            <div class="step-num-circle font-mono">{{ step.stepNumber }}</div>
            <div class="step-content">
              <div class="step-route-row font-mono">
                <span class="step-actor">{{ step.actor }}</span>
                <ArrowRight :size="12" class="arrow-icon" />
                <span class="step-target">{{ step.target }}</span>
              </div>
              <p class="step-details">{{ step.details }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. OpenAPI 3.1 & Postman Exporter View -->
    <div v-else-if="activeSubView === 'openapi'" class="openapi-view-wrapper">
      <div class="spec-format-bar">
        <div class="format-chips">
          <button
            type="button"
            class="format-chip font-mono"
            :class="{ active: openApiFormat === 'yaml' }"
            @click="openApiFormat = 'yaml'"
          >
            OpenAPI 3.1 (YAML)
          </button>
          <button
            type="button"
            class="format-chip font-mono"
            :class="{ active: openApiFormat === 'json' }"
            @click="openApiFormat = 'json'"
          >
            OpenAPI 3.1 (JSON)
          </button>
          <button
            type="button"
            class="format-chip font-mono"
            :class="{ active: openApiFormat === 'postman' }"
            @click="openApiFormat = 'postman'"
          >
            Postman Collection v2.1
          </button>
        </div>

        <div class="format-actions">
          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Download OpenAPI YAML"
            @click="downloadOpenApiFile('yaml')"
          >
            <Download :size="12" />
            <span>.yaml</span>
          </button>
          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Download OpenAPI JSON"
            @click="downloadOpenApiFile('json')"
          >
            <Download :size="12" />
            <span>.json</span>
          </button>
          <button
            type="button"
            class="btn-secondary btn-xs"
            title="Download Postman Collection"
            @click="downloadOpenApiFile('postman')"
          >
            <Download :size="12" />
            <span>Postman</span>
          </button>
          <button
            type="button"
            class="btn-secondary btn-xs"
            @click="copyCurrentText(currentSpecCode)"
          >
            <Check v-if="copiedNotice" :size="12" />
            <Copy v-else :size="12" />
            <span>{{ copiedNotice ? 'Copied' : 'Copy' }}</span>
          </button>
        </div>
      </div>

      <div class="spec-meta-strip font-mono">
        <span class="spec-title-tag">{{ openApiFormat === 'postman' ? 'Postman Collection v2.1.0' : 'OpenAPI Specification 3.1.0' }}</span>
        <span>•</span>
        <span>{{ endpoints.length }} operations</span>
        <span>•</span>
        <span>{{ entities.length }} component schemas</span>
      </div>

      <pre class="code-block font-mono"><code>{{ currentSpecCode }}</code></pre>
    </div>

    <!-- 4. Mermaid Source Code View -->
    <div v-else class="mermaid-code-wrapper">
      <div class="mermaid-code-header">
        <span class="font-mono text-muted">Generated Mermaid.js v11 Specification</span>
      </div>
      <pre class="code-block font-mono"><code>{{ activeMermaidCode }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.visual-arch-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--rule);
}

.arch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rule);
}

.view-toggles {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.toggle-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.toggle-btn.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.arch-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-xs {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  font-size: 11.5px;
  font-family: var(--font-mono);
}

/* ERD View */
.erd-view-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.relationships-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.rel-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  letter-spacing: 0.5px;
}

.rel-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.rel-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 11.5px;
  color: var(--text-2);
}

.table-tag {
  font-weight: 600;
}

.pk-tag {
  color: var(--accent);
}

.fk-tag {
  color: #38bdf8;
}

.arrow-sym {
  color: var(--text-3);
  font-size: 10px;
}

.via-sub {
  color: var(--text-3);
  font-size: 10.5px;
}

/* Entities Grid */
.entities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.entity-card {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.15s ease;
}

.entity-card:hover {
  border-color: var(--rule-strong);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.entity-card.highlight-target {
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(255, 122, 69, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--hover);
  border-bottom: 1px solid var(--rule);
}

.table-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.table-icon {
  color: var(--accent);
}

.table-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
}

.col-count {
  font-size: 11px;
  color: var(--text-3);
}

.card-table-body {
  display: flex;
  flex-direction: column;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  border-bottom: 1px solid var(--rule-subtle, rgba(255, 255, 255, 0.05));
  font-size: 11.5px;
}

.field-row:last-child {
  border-bottom: none;
}

.field-meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-key {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

.badge-pk {
  background-color: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.badge-fk {
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.key-placeholder {
  display: inline-block;
  width: 16px;
  text-align: center;
  color: var(--text-3);
}

.field-name {
  color: var(--text);
}

.is-pk .field-name {
  font-weight: 600;
  color: #eab308;
}

.is-fk .field-name {
  color: #38bdf8;
}

.field-type {
  font-size: 10.5px;
  color: var(--text-3);
  text-transform: uppercase;
}

/* Flows & API Table */
.flow-view-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.flow-section-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-block-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.5px;
  margin: 0;
}

.endpoints-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--elevated);
  overflow: hidden;
}

.endpoint-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  font-size: 12px;
}

.endpoint-row:last-child {
  border-bottom: none;
}

.method-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 2px;
  min-width: 50px;
  text-align: center;
}

.method-get {
  background-color: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.method-post {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.method-put {
  background-color: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.method-delete {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.endpoint-path {
  color: var(--text);
  font-weight: 500;
  min-width: 180px;
}

.endpoint-desc {
  color: var(--text-2);
  font-size: 12px;
}

.steps-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.step-num-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background-color: var(--hover);
  border: 1px solid var(--rule-strong);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.step-route-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
}

.step-actor {
  color: var(--accent);
  font-weight: 600;
}

.arrow-icon {
  color: var(--text-3);
}

.step-target {
  color: #38bdf8;
  font-weight: 600;
}

.step-details {
  font-size: 12px;
  color: var(--text-2);
  margin: 0;
  line-height: 1.4;
}

/* Empty State */
.empty-diagram-box {
  padding: 24px;
  text-align: center;
  color: var(--text-3);
  font-size: 12px;
  background-color: var(--elevated);
  border: 1px dashed var(--rule);
  border-radius: var(--radius);
  line-height: 1.6;
}

.empty-diagram-box code {
  color: var(--accent);
  background-color: var(--hover);
  padding: 2px 6px;
  border-radius: var(--radius);
}

/* OpenAPI View */
.openapi-view-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-format-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 12px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

.format-chips {
  display: flex;
  align-items: center;
  gap: 6px;
}

.format-chip {
  height: 26px;
  padding: 0 9px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.format-chip:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.format-chip.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.format-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spec-meta-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-3);
  padding: 0 4px;
}

.spec-title-tag {
  color: var(--accent);
  font-weight: 600;
}

/* Mermaid Code View */
.mermaid-code-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mermaid-code-header {
  font-size: 11px;
}

.code-block {
  padding: 14px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text);
  overflow-x: auto;
  margin: 0;
}
</style>
