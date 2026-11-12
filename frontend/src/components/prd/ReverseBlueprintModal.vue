<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  RotateCcw,
  X,
  Database,
  FileCode2,
  FileText,
  Boxes,
  UploadCloud,
  Sparkles,
} from 'lucide-vue-next'
import {
  reverseEngineerToBlueprint,
  type ReverseSourceFormat,
} from '@/lib/prd/reverseBlueprint'
import type { PrdModel } from '@/lib/prd/sections'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply-model', model: Partial<PrdModel>): void
}>()

const activeTab = ref<ReverseSourceFormat>('sql')
const rawInput = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const SAMPLE_SQL = `-- E-Commerce SQL DDL Sample
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);`

const SAMPLE_PRISMA = `// Prisma Schema Sample
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String   @default("member")
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  authorId  String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
}`

const SAMPLE_OPENAPI = `# OpenAPI 3.0 REST Specification
openapi: 3.0.3
info:
  title: Task Management API
  version: 1.0.0
paths:
  /api/v1/auth/login:
    post:
      summary: User authentication and JWT exchange
  /api/v1/tasks:
    get:
      summary: List assigned user tasks with pagination
    post:
      summary: Create a new operational task
  /api/v1/tasks/{id}:
    get:
      summary: Get task details by ID
    put:
      summary: Update task status and assignee
    delete:
      summary: Archive task`

const SAMPLE_DOCKER = `# Docker Compose Infrastructure
version: '3.8'
services:
  web-app:
    image: node:20-alpine
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  api-service:
    image: golang:1.22-alpine
    ports:
      - "8080:8080"
  postgres-db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"`

function loadSample(format: ReverseSourceFormat) {
  activeTab.value = format
  if (format === 'sql') rawInput.value = SAMPLE_SQL
  else if (format === 'prisma') rawInput.value = SAMPLE_PRISMA
  else if (format === 'openapi') rawInput.value = SAMPLE_OPENAPI
  else if (format === 'docker') rawInput.value = SAMPLE_DOCKER
}

// Initial sample
if (!rawInput.value) {
  rawInput.value = SAMPLE_SQL
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    if (text) {
      rawInput.value = text
    }
  }
  reader.readAsText(file)
}

const parseResult = computed(() => {
  return reverseEngineerToBlueprint(rawInput.value, activeTab.value)
})

function applyToBlueprint() {
  if (!parseResult.value.model.title) return
  emit('apply-model', parseResult.value.model)
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="title-wrap">
          <div class="modal-icon-badge">
            <RotateCcw :size="18" />
          </div>
          <div>
            <h2 class="modal-title font-serif">Reverse Blueprint Engine</h2>
            <p class="modal-subtitle">
              Impor skema SQL, Prisma, OpenAPI, atau Docker Compose untuk diubah menjadi spesifikasi arsitektur BlueprintDev lengkap secara otomatis.
            </p>
          </div>
        </div>
        <button
          type="button"
          class="close-btn"
          aria-label="Tutup modal"
          @click="emit('close')"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Format Selector Tabs -->
      <div class="tab-toolbar">
        <div class="format-tabs font-mono">
          <button
            type="button"
            class="format-tab"
            :class="{ active: activeTab === 'sql' }"
            @click="loadSample('sql')"
          >
            <Database :size="13" />
            <span>SQL DDL</span>
          </button>
          <button
            type="button"
            class="format-tab"
            :class="{ active: activeTab === 'prisma' }"
            @click="loadSample('prisma')"
          >
            <FileCode2 :size="13" />
            <span>Prisma Schema</span>
          </button>
          <button
            type="button"
            class="format-tab"
            :class="{ active: activeTab === 'openapi' }"
            @click="loadSample('openapi')"
          >
            <FileText :size="13" />
            <span>OpenAPI 3.x</span>
          </button>
          <button
            type="button"
            class="format-tab"
            :class="{ active: activeTab === 'docker' }"
            @click="loadSample('docker')"
          >
            <Boxes :size="13" />
            <span>Docker Compose</span>
          </button>
        </div>

        <div class="upload-trigger">
          <input
            ref="fileInputRef"
            type="file"
            accept=".sql,.prisma,.json,.yaml,.yml"
            class="hidden-file-input"
            @change="handleFileUpload"
          />
          <button
            type="button"
            class="upload-btn font-mono"
            @click="fileInputRef?.click()"
          >
            <UploadCloud :size="13" />
            <span>Unggah File Skema</span>
          </button>
        </div>
      </div>

      <!-- Editor & Live Diagnostics Split -->
      <div class="modal-body">
        <div class="editor-pane">
          <div class="pane-header font-mono">
            <span>KODE SUMBER (TEMPEL ATAU EDIT)</span>
            <span class="char-count">{{ rawInput.length }} karakter</span>
          </div>
          <textarea
            v-model="rawInput"
            class="source-textarea font-mono"
            placeholder="Tempel SQL DDL CREATE TABLE, Prisma model, OpenAPI YAML/JSON, atau Docker Compose di sini..."
            rows="14"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="diagnostics-pane">
          <div class="pane-header font-mono">
            <Sparkles :size="13" />
            <span>HASIL DETEKSI OTOMATIS</span>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label font-mono">Format</span>
              <span class="stat-value font-mono">{{ parseResult.format.toUpperCase() }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label font-mono">Tabel / Model</span>
              <span class="stat-value font-mono highlight">{{ parseResult.detectedTablesCount }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label font-mono">Endpoints API</span>
              <span class="stat-value font-mono highlight">{{ parseResult.detectedEndpointsCount }}</span>
            </div>
          </div>

          <div class="preview-box">
            <span class="box-label font-mono">Ringkasan Konversi:</span>
            <p class="summary-text">{{ parseResult.summary }}</p>

            <div v-if="parseResult.model.stack" class="snippet-preview">
              <span class="preview-heading font-mono">Tech Stack Terdeteksi:</span>
              <pre class="font-mono">{{ parseResult.model.stack }}</pre>
            </div>

            <div v-if="parseResult.model.data_models" class="snippet-preview">
              <span class="preview-heading font-mono">Data Models (ERD):</span>
              <pre class="font-mono">{{ parseResult.model.data_models }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn-secondary font-mono"
          @click="emit('close')"
        >
          Batal
        </button>

        <button
          type="button"
          class="btn-primary font-mono"
          :disabled="!parseResult.model.title"
          @click="applyToBlueprint"
        >
          <RotateCcw :size="14" />
          <span>Terapkan ke Blueprint Studio</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--rule);
}

.title-wrap {
  display: flex;
  gap: 14px;
}

.modal-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius);
  background-color: rgba(255, 122, 69, 0.12);
  border: 1px solid rgba(255, 122, 69, 0.35);
  color: var(--accent);
  flex-shrink: 0;
}

.modal-title {
  font-size: 19px;
  margin: 0;
  color: var(--text);
}

.modal-subtitle {
  font-size: 13px;
  color: var(--text-2);
  margin: 4px 0 0;
  line-height: 1.45;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  color: var(--text);
  background-color: var(--elevated);
}

.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  gap: 12px;
  flex-wrap: wrap;
}

.format-tabs {
  display: flex;
  gap: 6px;
}

.format-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background-color: transparent;
  border: 1px solid transparent;
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.format-tab:hover {
  color: var(--text);
  background-color: var(--hover);
}

.format-tab.active {
  background-color: var(--surface);
  border-color: var(--rule-strong);
  color: var(--accent);
}

.hidden-file-input {
  display: none;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: transparent;
  border: 1px dashed var(--rule-strong);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.upload-btn:hover {
  border-color: var(--accent);
  color: var(--text);
}

.modal-body {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .modal-body {
    grid-template-columns: 1fr;
  }
}

.editor-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--rule);
  background-color: var(--bg);
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  font-size: 11px;
  color: var(--text-3);
  gap: 6px;
}

.source-textarea {
  flex: 1;
  width: 100%;
  padding: 14px;
  background-color: transparent;
  border: none;
  color: var(--text);
  font-size: 12px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.diagnostics-pane {
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--rule);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

.stat-label {
  font-size: 10px;
  color: var(--text-3);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.stat-value.highlight {
  color: var(--accent);
}

.preview-box {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box-label {
  font-size: 11px;
  color: var(--text-3);
}

.summary-text {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-2);
  margin: 0;
}

.snippet-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

.preview-heading {
  font-size: 10.5px;
  color: var(--accent);
}

.snippet-preview pre {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-2);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--rule);
  background-color: var(--elevated);
}

.btn-secondary {
  padding: 7px 14px;
  background-color: transparent;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-secondary:hover {
  background-color: var(--hover);
  color: var(--text);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  background-color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-hover, #ff8c5a);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
