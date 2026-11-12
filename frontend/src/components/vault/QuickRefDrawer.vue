<script setup lang="ts">
import { HTTP_STATUS_CHEATSHEET, BIG_O_CHEATSHEET } from '@/lib/vault/vaultData'

interface Props {
  show: boolean
}

defineProps<Props>()
</script>

<template>
  <div v-if="show" class="quick-ref-drawer" data-testid="quick-ref-drawer">
    <div class="quick-ref-col">
      <div class="quick-ref-header font-mono">
        <span>KODE STATUS HTTP</span>
      </div>
      <div class="quick-table-wrap">
        <table class="quick-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Status</th>
              <th>Kapan Digunakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="st in HTTP_STATUS_CHEATSHEET" :key="st.code">
              <td>
                <span
                  class="status-code-badge font-mono"
                  :class="{
                    's-2xx': st.code >= 200 && st.code < 300,
                    's-4xx': st.code >= 400 && st.code < 500,
                    's-5xx': st.code >= 500,
                  }"
                >
                  {{ st.code }}
                </span>
              </td>
              <td class="font-mono status-name-cell">{{ st.name }}</td>
              <td class="status-desc-cell">{{ st.whenToUse }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="quick-ref-col">
      <div class="quick-ref-header font-mono">
        <span>KOMPLEKSITAS ALGORITMA (BIG-O)</span>
      </div>
      <div class="quick-table-wrap">
        <table class="quick-table">
          <thead>
            <tr>
              <th>Notasi</th>
              <th>Operasi (N=1 Juta)</th>
              <th>Contoh Kasus Nyata</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bo in BIG_O_CHEATSHEET" :key="bo.notation">
              <td>
                <span
                  class="bigo-badge font-mono"
                  :class="`verdict-${bo.verdict}`"
                >
                  {{ bo.notation }}
                </span>
              </td>
              <td class="font-mono status-name-cell">{{ bo.opsAtOneMillion }}</td>
              <td class="status-desc-cell">{{ bo.realWorldExample }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-ref-drawer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  margin-top: 10px;
}

.quick-ref-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-ref-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.quick-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background-color: var(--elevated);
  max-height: 280px;
}

.quick-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.quick-table th {
  position: sticky;
  top: 0;
  background-color: var(--surface);
  color: var(--text-2);
  text-align: left;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
  border-bottom: 1px solid var(--rule);
  z-index: 1;
}

.quick-table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--text-2);
}

.status-code-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--radius);
  font-size: 11px;
  font-weight: 600;
}

.s-2xx {
  background-color: rgba(62, 207, 142, 0.15);
  color: var(--ok);
}

.s-4xx {
  background-color: rgba(229, 167, 58, 0.15);
  color: var(--warn);
}

.s-5xx {
  background-color: rgba(240, 106, 98, 0.15);
  color: var(--danger);
}

.bigo-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--radius);
  font-size: 11px;
  font-weight: 600;
}

.verdict-excellent,
.verdict-good {
  color: var(--ok);
  background-color: rgba(62, 207, 142, 0.15);
}

.verdict-fair {
  color: var(--warn);
  background-color: rgba(229, 167, 58, 0.15);
}

.verdict-bad,
.verdict-horrible {
  color: var(--danger);
  background-color: rgba(240, 106, 98, 0.15);
}

.status-name-cell {
  font-weight: 500;
  color: var(--text);
}

.status-desc-cell {
  font-size: 11.5px;
}

@media (max-width: 900px) {
  .quick-ref-drawer {
    grid-template-columns: 1fr;
  }
}
</style>
