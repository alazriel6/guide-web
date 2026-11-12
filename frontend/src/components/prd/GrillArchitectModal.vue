<script setup lang="ts">
import { computed } from 'vue'
import {
  Flame,
  X,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Zap,
} from 'lucide-vue-next'
import {
  grillArchitecture,
  applyGrillFixesToModel,
} from '@/lib/prd/grillArchitect'
import type { PrdModel } from '@/lib/prd/sections'

const props = defineProps<{
  isOpen: boolean
  model: PrdModel
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply-fixes', updatedModel: PrdModel): void
}>()

const report = computed(() => {
  return grillArchitecture(props.model)
})

const gradeColor = computed(() => {
  if (report.value.grade === 'A+' || report.value.grade === 'A') return 'var(--success, #10b981)'
  if (report.value.grade === 'B') return 'var(--accent, #ff7a45)'
  if (report.value.grade === 'C') return '#f59e0b'
  return 'var(--danger, #ef4444)'
})

function handleApplyFixes() {
  const updated = applyGrillFixesToModel(props.model, report.value)
  emit('apply-fixes', updated)
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
            <Flame :size="18" />
          </div>
          <div>
            <div class="header-tags font-mono">
              <span class="badge-tag">STRESS-TEST ARSITEKTUR</span>
              <span class="badge-target">50.000+ RPS SIMULATION</span>
            </div>
            <h2 class="modal-title font-serif">Grill My Architecture</h2>
            <p class="modal-subtitle">
              Audit deterministik untuk menemukan potensi bottleneck konkurensi tinggi, database locking, SPOF, dan celah keamanan sebelum masuk fase coding.
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

      <!-- Scorecard Banner -->
      <div class="scorecard-banner">
        <div class="score-display">
          <div class="grade-pill font-mono" :style="{ borderColor: gradeColor, color: gradeColor }">
            {{ report.grade }}
          </div>
          <div class="score-details font-mono">
            <div class="score-number">
              <span class="val" :style="{ color: gradeColor }">{{ report.score }}</span>
              <span class="max">/100</span>
            </div>
            <span class="score-label">Resiliency Index</span>
          </div>
        </div>

        <div class="stats-counters font-mono">
          <div class="counter-item critical">
            <AlertOctagon :size="14" />
            <span class="count">{{ report.criticalCount }}</span>
            <span class="label">Kritis</span>
          </div>
          <div class="counter-item warning">
            <AlertTriangle :size="14" />
            <span class="count">{{ report.warningsCount }}</span>
            <span class="label">Peringatan</span>
          </div>
          <div class="counter-item strength">
            <CheckCircle2 :size="14" />
            <span class="count">{{ report.strengthsCount }}</span>
            <span class="label">Kekuatan</span>
          </div>
        </div>

        <div class="summary-box">
          <p class="summary-text">{{ report.summary }}</p>
        </div>
      </div>

      <!-- Findings List -->
      <div class="modal-body">
        <div class="findings-header font-mono">
          <span>TEMUAN AUDIT ARSITEKTUR &amp; REKOMENDASI SOLUSI</span>
          <span>{{ report.findings.length }} Item</span>
        </div>

        <div class="findings-list">
          <div
            v-for="finding in report.findings"
            :key="finding.id"
            class="finding-card"
            :class="`severity-${finding.severity}`"
          >
            <div class="finding-top">
              <div class="finding-badge font-mono">
                <AlertOctagon v-if="finding.severity === 'critical'" :size="12" />
                <AlertTriangle v-else-if="finding.severity === 'warning'" :size="12" />
                <CheckCircle2 v-else :size="12" />
                <span>{{ finding.severity.toUpperCase() }}</span>
              </div>
              <h4 class="finding-title font-mono">{{ finding.title }}</h4>
            </div>

            <div v-if="finding.scenario" class="finding-scenario">
              <span class="scenario-label font-mono">Skenario Stres:</span>
              <span class="scenario-text">{{ finding.scenario }}</span>
            </div>

            <div v-if="finding.vulnerability" class="finding-vuln">
              <span class="vuln-label font-mono">Risiko Kegagalan:</span>
              <p class="vuln-text">{{ finding.vulnerability }}</p>
            </div>

            <div class="finding-rec">
              <div class="rec-label font-mono">
                <Zap :size="12" />
                <span>Solusi &amp; Rekomendasi:</span>
              </div>
              <p class="rec-text">{{ finding.recommendation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer with 1-Click Fix -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn-secondary font-mono"
          @click="emit('close')"
        >
          Tutup
        </button>

        <button
          type="button"
          class="btn-primary font-mono"
          :disabled="report.suggestedNfrAdditions.length === 0 && report.suggestedConstraintAdditions.length === 0"
          @click="handleApplyFixes"
        >
          <Flame :size="14" />
          <span>Terapkan Solusi ke Blueprint</span>
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
  max-width: 920px;
  max-height: 90vh;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65);
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

.header-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.badge-tag {
  font-size: 10px;
  padding: 1px 6px;
  background-color: rgba(255, 122, 69, 0.12);
  color: var(--accent);
  border-radius: var(--radius-sm);
}

.badge-target {
  font-size: 10px;
  padding: 1px 6px;
  background-color: var(--elevated);
  color: var(--text-3);
  border-radius: var(--radius-sm);
}

.modal-title {
  font-size: 19px;
  margin: 0;
  color: var(--text);
}

.modal-subtitle {
  font-size: 12.5px;
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

.scorecard-banner {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
}

@media (max-width: 768px) {
  .scorecard-banner {
    grid-template-columns: 1fr;
  }
}

.score-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grade-pill {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  background-color: var(--surface);
}

.score-details {
  display: flex;
  flex-direction: column;
}

.score-number .val {
  font-size: 22px;
  font-weight: 700;
}

.score-number .max {
  font-size: 12px;
  color: var(--text-3);
  margin-left: 2px;
}

.score-label {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

.stats-counters {
  display: flex;
  gap: 12px;
}

.counter-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: var(--radius-sm);
  font-size: 11px;
}

.counter-item.critical {
  background-color: rgba(239, 68, 68, 0.12);
  color: var(--danger, #ef4444);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.counter-item.warning {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.counter-item.strength {
  background-color: rgba(16, 185, 129, 0.12);
  color: var(--success, #10b981);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.summary-box {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}

.summary-text {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
  margin: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
}

.findings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background-color: var(--elevated);
  border-bottom: 1px solid var(--rule);
  font-size: 11px;
  color: var(--text-3);
}

.findings-list {
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.finding-card {
  background-color: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.12s ease;
}

.finding-card.severity-critical {
  border-left: 3px solid var(--danger, #ef4444);
}

.finding-card.severity-warning {
  border-left: 3px solid #f59e0b;
}

.finding-card.severity-strength {
  border-left: 3px solid var(--success, #10b981);
}

.finding-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.finding-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.severity-critical .finding-badge {
  background-color: rgba(239, 68, 68, 0.12);
  color: var(--danger, #ef4444);
}

.severity-warning .finding-badge {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.severity-strength .finding-badge {
  background-color: rgba(16, 185, 129, 0.12);
  color: var(--success, #10b981);
}

.finding-title {
  margin: 0;
  font-size: 13px;
  color: var(--text);
}

.finding-scenario {
  font-size: 12px;
  color: var(--text-3);
  display: flex;
  gap: 6px;
}

.scenario-label {
  color: var(--accent);
}

.finding-vuln {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
}

.vuln-label {
  color: var(--danger, #ef4444);
  margin-right: 6px;
}

.vuln-text {
  margin: 0;
  display: inline;
}

.finding-rec {
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text);
}

.rec-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-size: 10.5px;
  margin-bottom: 2px;
}

.rec-text {
  margin: 0;
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
