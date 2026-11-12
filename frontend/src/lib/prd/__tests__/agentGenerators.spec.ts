import { describe, it, expect } from 'vitest'
import {
  AGENT_TARGETS,
  getAgentTarget,
  generateAgentInstructions,
  generateAgentFromPrd,
  SPECIALIST_ROLES,
  getSpecialistRole,
  generateRoleSkillMd,
  type AgentTargetId,
  type SpecialistRole,
} from '../agentGenerators'
import type { PromptTemplate } from '@/services/api'
import { createBlankModel } from '../sections'

describe('agentGenerators', () => {
  const samplePrompt: PromptTemplate = {
    title: 'Distributed Event Bus SaaS',
    role_category: 'Backend',
    tech_stack_tags: ['Go 1.22+', 'PostgreSQL 16', 'Redis', 'Gin'],
    is_preset: false,
    system_role: 'Act as a Principal Distributed Systems Engineer.',
    technical_constraints: '- Enforce zero-allocation event serialization via Protobuf.\n- Max p99 latency < 10ms.',
    architecture_rules: '- Clean architecture separation between transport and domain.\n- Use sync.Pool for buffer reuse.',
    point_by_point_instructions: '1. Initialize Go module.\n2. Implement ring buffer queue.\n3. Add HTTP ingestion handlers.',
    edge_cases_to_handle: '- Handle burst traffic spikes gracefully.\n- Backpressure on buffer overflow.',
    output_format: 'Deliver complete, production-grade Go source code.',
    compiled_prompt: '',
  }

  it('provides metadata for all 6 target agents', () => {
    expect(AGENT_TARGETS).toHaveLength(6)
    const ids: AgentTargetId[] = ['antigravity', 'cursor', 'copilot', 'hermes', 'claude', 'raw']
    for (const id of ids) {
      const def = getAgentTarget(id)
      expect(def.id).toBe(id)
      expect(def.name).toBeTruthy()
      expect(def.filename).toBeTruthy()
      expect(def.recommendedPath).toBeTruthy()
    }
  })

  it('generates Antigravity Agent directives (AGENTS.md)', () => {
    const output = generateAgentInstructions('antigravity', samplePrompt)
    expect(output).toContain('# Antigravity Agent Directives: Distributed Event Bus SaaS')
    expect(output).toContain('## Inviolable Technical Boundaries & Constraints')
    expect(output).toContain('Maintain documentation integrity: preserve existing comments and docstrings.')
    expect(output).toContain('Zero-regression policy')
    expect(output).toContain('Go 1.22+ | PostgreSQL 16 | Redis | Gin')
    expect(output).toContain('Max p99 latency < 10ms.')
  })

  it('generates Cursor Rules (.cursorrules)', () => {
    const output = generateAgentInstructions('cursor', samplePrompt)
    expect(output).toContain('# Cursor Rules: Distributed Event Bus SaaS')
    expect(output).toContain('## Critical Constraints & Coding Standards')
    expect(output).toContain('## Architectural Guardrails')
    expect(output).toContain('Enforce zero-allocation event serialization')
  })

  it('generates Copilot & Codex instructions (copilot-instructions.md)', () => {
    const output = generateAgentInstructions('copilot', samplePrompt)
    expect(output).toContain('<!-- Placement: .github/copilot-instructions.md -->')
    expect(output).toContain('# GitHub Copilot & Codex Instructions: Distributed Event Bus SaaS')
    expect(output).toContain('## Coding Conventions & Constraints')
  })

  it('generates Hermes Agent directives (HERMES.md)', () => {
    const output = generateAgentInstructions('hermes', samplePrompt)
    expect(output).toContain('<system_identity>')
    expect(output).toContain('</system_identity>')
    expect(output).toContain('<technical_constraints>')
    expect(output).toContain('<step_by_step_plan>')
  })

  it('generates Claude Code guidelines (CLAUDE.md)', () => {
    const output = generateAgentInstructions('claude', samplePrompt)
    expect(output).toContain('# Claude Code Instructions: Distributed Event Bus SaaS')
    expect(output).toContain('## Summary & Role')
    expect(output).toContain('## Architecture')
  })

  it('generates Raw standard prompt', () => {
    const output = generateAgentInstructions('raw', samplePrompt)
    expect(output).toContain('# ROLE & OBJECTIVE')
    expect(output).toContain('# TARGET ROLE & TECH STACK MATRIX')
    expect(output).toContain('# TECH STACK CONSTRAINTS')
  })

  it('compiles directly from PrdModel into agent format', () => {
    const model = createBlankModel()
    model.title = 'Real-Time Audio Collaboration'
    model.category = 'Desktop Media App'
    model.overview = 'Collaborative DAW in the browser.'
    model.problem = 'Latency is too high in existing web DAWs.'
    model.stack = '- Web Audio API\n- WebAssembly\n- Rust'
    model.features = [
      { name: 'Audio Engine', description: 'Low-latency DSP loop', priority: 'mvp' },
      { name: 'Cloud Sync', description: 'Background project sync', priority: 'later' },
    ]
    model.flows = 'User joins session -> audio streams over WebRTC.'
    model.data_models = 'Projects: id, name, tempo'
    model.api_contract = 'POST /api/v1/sessions'
    model.nfr = 'Buffer underrun < 0.01%'
    model.constraints = 'Must run on Chrome 120+'
    model.non_goals = 'No VST3 plugin hosting in v1.'
    model.open_questions = 'Which audio worklet ring buffer size?'

    const antigravityOutput = generateAgentFromPrd('antigravity', model)
    expect(antigravityOutput).toContain('# Antigravity Agent Directives: Real-Time Audio Collaboration')
    expect(antigravityOutput).toContain('Low-latency DSP loop')
    expect(antigravityOutput).toContain('No VST3 plugin hosting in v1.')
    expect(antigravityOutput).toContain('Buffer underrun < 0.01%')

    const cursorOutput = generateAgentFromPrd('cursor', model)
    expect(cursorOutput).toContain('# Cursor Rules: Real-Time Audio Collaboration')
    expect(cursorOutput).toContain('Audio Engine')
  })

  describe('Specialist SKILL.md Generators (FE, BE, QA, DevOps, Fullstack)', () => {
    const model = createBlankModel()
    model.title = 'Payment Gateway Microservice'
    model.category = 'REST Microservice'
    model.overview = 'High-throughput payment orchestration engine.'
    model.stack = '- Go 1.22+\n- PostgreSQL 16\n- Vue 3 + Vite\n- Docker'
    model.features = [
      { name: 'Payment Capture', description: 'Idempotent card capture API', priority: 'mvp' },
      { name: 'Webhook Dispatcher', description: 'Retry queue for merchant webhooks', priority: 'later' },
    ]
    model.data_models = '- payments: id (PK), amount INT, status VARCHAR\n- merchants: id (PK), api_key VARCHAR'
    model.api_contract = 'POST /api/v1/payments -> Process charge\nGET /api/v1/payments/:id -> Get status'
    model.nfr = '- p99 latency < 80ms\n- 99.999% availability'
    model.constraints = '- Zero plaintext card storage (PCI-DSS)\n- Strict idempotent requests'

    it('provides all 5 specialist role definitions', () => {
      expect(SPECIALIST_ROLES).toHaveLength(5)
      const roles: SpecialistRole[] = ['frontend', 'backend', 'qa', 'devops', 'fullstack']
      for (const r of roles) {
        const def = getSpecialistRole(r)
        expect(def.id).toBe(r)
        expect(def.filename).toContain('.SKILL.md')
        expect(def.skillName).toBeTruthy()
      }
    })

    it('generates standard YAML frontmatter in SKILL.md for Frontend', () => {
      const skill = generateRoleSkillMd('frontend', model)
      expect(skill).toContain('---')
      expect(skill).toContain('name: frontend-architect')
      expect(skill).toContain('# Frontend Architect & UI Engineer: Payment Gateway Microservice')
      expect(skill).toContain('### Frontend Architectural Guardrails')
      expect(skill).toContain('Component Architecture')
      expect(skill).toContain('POST /api/v1/payments')
    })

    it('generates standard YAML frontmatter in SKILL.md for Backend', () => {
      const skill = generateRoleSkillMd('backend', model)
      expect(skill).toContain('name: backend-architect')
      expect(skill).toContain('# Backend Architect & API Engineer: Payment Gateway Microservice')
      expect(skill).toContain('### Backend Architectural Guardrails')
      expect(skill).toContain('Layered Architecture')
      expect(skill).toContain('- payments: id (PK)')
    })

    it('generates standard YAML frontmatter in SKILL.md for QA', () => {
      const skill = generateRoleSkillMd('qa', model)
      expect(skill).toContain('name: qa-automation-engineer')
      expect(skill).toContain('# QA & Test Automation Specialist: Payment Gateway Microservice')
      expect(skill).toContain('### QA & Test Automation Guardrails')
      expect(skill).toContain('Test Pyramid')
      expect(skill).toContain('Payment Capture')
    })

    it('generates standard YAML frontmatter in SKILL.md for DevOps', () => {
      const skill = generateRoleSkillMd('devops', model)
      expect(skill).toContain('name: devops-sre-engineer')
      expect(skill).toContain('# DevOps & SRE Cloud Engineer: Payment Gateway Microservice')
      expect(skill).toContain('### DevOps & SRE Guardrails')
      expect(skill).toContain('Multi-stage Docker builds')
      expect(skill).toContain('docker-compose.yml')
    })

    it('generates standard YAML frontmatter in SKILL.md for Fullstack Principal', () => {
      const skill = generateRoleSkillMd('fullstack', model)
      expect(skill).toContain('name: fullstack-principal-engineer')
      expect(skill).toContain('# Principal Fullstack Architect: Payment Gateway Microservice')
      expect(skill).toContain('Contract Parity')
      expect(skill).toContain('Definition of Done (DoD)')
    })
  })
})
