<script setup lang="ts">
import { Bot } from 'lucide-vue-next'
import {
  AGENT_TARGETS,
  SPECIALIST_ROLES,
  type AgentTargetId,
  type SpecialistRole,
  type AgentTargetDef,
  type SpecialistRoleDef,
} from '@/lib/prd/agentGenerators'

interface Props {
  categoryMode: 'skills' | 'targets'
  activeSpecialistRole: SpecialistRole
  activeAgentTarget: AgentTargetId
  currentRoleDef: SpecialistRoleDef
  currentAgentDef: AgentTargetDef
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:categoryMode', val: 'skills' | 'targets'): void
  (e: 'update:activeSpecialistRole', val: SpecialistRole): void
  (e: 'update:activeAgentTarget', val: AgentTargetId): void
}>()
</script>

<template>
  <div class="agent-target-strip">
    <!-- Category Mode Tabs: Skills vs IDE Targets -->
    <div class="agent-mode-tabs font-mono">
      <button
        type="button"
        class="agent-mode-tab"
        :class="{ active: categoryMode === 'skills' }"
        @click="emit('update:categoryMode', 'skills')"
      >
        ⭐ SPECIALIST SKILL.MD (5 ROLES)
      </button>
      <button
        type="button"
        class="agent-mode-tab"
        :class="{ active: categoryMode === 'targets' }"
        @click="emit('update:categoryMode', 'targets')"
      >
        🤖 ATURAN CODING AGENT (AGENTS.MD, CURSOR, COPILOT)
      </button>
    </div>

    <!-- 5 Roles Specialist Mode -->
    <div v-if="categoryMode === 'skills'" class="agent-role-section">
      <div class="agent-target-header">
        <span class="agent-strip-label font-mono">PILIH ROLE SPESIALIS:</span>
        <span class="agent-target-path font-mono" :style="{ color: currentRoleDef.color }">
          ● {{ currentRoleDef.name }} ({{ currentRoleDef.filename }})
        </span>
      </div>

      <div class="agent-target-buttons">
        <button
          v-for="role in SPECIALIST_ROLES"
          :key="role.id"
          type="button"
          class="agent-target-btn font-mono"
          :class="{ active: activeSpecialistRole === role.id }"
          :title="role.description"
          @click="emit('update:activeSpecialistRole', role.id)"
        >
          <span>{{ role.shortLabel }}</span>
        </button>
      </div>

      <p class="agent-desc-caption font-mono">
        {{ currentRoleDef.description }}
      </p>
    </div>

    <!-- IDE Targets Mode -->
    <div v-else class="agent-target-section">
      <div class="agent-target-header">
        <span class="agent-strip-label font-mono">TARGET AI CODING:</span>
        <span class="agent-target-path font-mono">📍 {{ currentAgentDef.recommendedPath }}</span>
      </div>

      <div class="agent-target-buttons">
        <button
          v-for="agent in AGENT_TARGETS"
          :key="agent.id"
          type="button"
          class="agent-target-btn font-mono"
          :class="{ active: activeAgentTarget === agent.id }"
          :title="agent.description"
          @click="emit('update:activeAgentTarget', agent.id)"
        >
          <Bot v-if="agent.id === 'antigravity'" :size="12" />
          <span>{{ agent.badge }}</span>
        </button>
      </div>

      <p class="agent-desc-caption font-mono">
        {{ currentAgentDef.description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.agent-target-strip {
  padding: 10px 14px;
  background-color: var(--surface);
  border-bottom: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-mode-tabs {
  display: flex;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--rule);
}

.agent-mode-tab {
  flex: 1;
  padding: 4px 8px;
  font-size: 10.5px;
  background-color: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-3);
  cursor: pointer;
  text-align: center;
  transition: all 0.12s ease;
}

.agent-mode-tab:hover {
  background-color: var(--hover);
  color: var(--text);
}

.agent-mode-tab.active {
  background-color: var(--elevated);
  border-color: var(--rule-strong);
  color: var(--accent);
}

.agent-role-section,
.agent-target-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-target-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.agent-strip-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  letter-spacing: 0.5px;
}

.agent-target-path {
  font-size: 11px;
  color: var(--accent);
}

.agent-target-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.agent-target-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  background-color: var(--elevated);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.agent-target-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.agent-target-btn.active {
  background-color: var(--hover);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.agent-desc-caption {
  font-size: 11px;
  color: var(--text-3);
  margin: 0;
  line-height: 1.4;
}
</style>
