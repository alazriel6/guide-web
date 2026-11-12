import type { PromptTemplate } from '@/services/api'
import type { PrdModel } from './sections'

export type AgentTargetId = 'antigravity' | 'cursor' | 'copilot' | 'hermes' | 'claude' | 'raw'

export interface AgentTargetDef {
  id: AgentTargetId
  name: string
  filename: string
  recommendedPath: string
  badge: string
  description: string
}

export const AGENT_TARGETS: AgentTargetDef[] = [
  {
    id: 'antigravity',
    name: 'Antigravity Agent',
    filename: 'AGENTS.md',
    recommendedPath: './AGENTS.md or .agent/rules',
    badge: 'Antigravity',
    description: 'Operational directives & guardrails for Google Antigravity & Agentic Coding',
  },
  {
    id: 'cursor',
    name: 'Cursor Rules',
    filename: '.cursorrules',
    recommendedPath: './.cursorrules',
    badge: 'Cursor',
    description: 'Context rules injected into Cursor IDE Composer and chat sessions',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot & Codex',
    filename: 'copilot-instructions.md',
    recommendedPath: './.github/copilot-instructions.md',
    badge: 'Copilot / Codex',
    description: 'Workspace context instructions indexed by GitHub Copilot & OpenAI Codex',
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    filename: 'HERMES.md',
    recommendedPath: './HERMES.md',
    badge: 'Hermes',
    description: 'XML-structured operational prompt for Nous Research Hermes agents',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    filename: 'CLAUDE.md',
    recommendedPath: './CLAUDE.md',
    badge: 'Claude',
    description: 'Repository guide and execution conventions for Claude Code CLI',
  },
  {
    id: 'raw',
    name: 'Standard Prompt',
    filename: 'prompt.md',
    recommendedPath: 'System / User Prompt',
    badge: 'Standard',
    description: 'Standard technical prompt for ChatGPT, Claude, DeepSeek, or local LLMs',
  },
]

export function getAgentTarget(id: AgentTargetId): AgentTargetDef {
  return AGENT_TARGETS.find((t) => t.id === id) || AGENT_TARGETS[0]!
}

/**
 * Specialist AI Agent Roles for SKILL.md generation
 */
export type SpecialistRole = 'frontend' | 'backend' | 'qa' | 'devops' | 'fullstack'

export interface SpecialistRoleDef {
  id: SpecialistRole
  name: string
  shortLabel: string
  skillName: string
  filename: string
  description: string
  color: string
}

export const SPECIALIST_ROLES: SpecialistRoleDef[] = [
  {
    id: 'frontend',
    name: 'Frontend Architect & UI Engineer',
    shortLabel: 'Frontend (FE)',
    skillName: 'frontend-architect',
    filename: 'frontend.SKILL.md',
    description: 'Expertise in modern reactive UI, state management, API consumption, responsive layout, and UX micro-interactions.',
    color: '#38bdf8',
  },
  {
    id: 'backend',
    name: 'Backend Architect & API Engineer',
    shortLabel: 'Backend (BE)',
    skillName: 'backend-architect',
    filename: 'backend.SKILL.md',
    description: 'Expertise in relational database schemas, transactional integrity, REST/gRPC endpoints, auth guards, and query performance.',
    color: '#34d399',
  },
  {
    id: 'qa',
    name: 'QA & Test Automation Specialist',
    shortLabel: 'QA & Testing',
    skillName: 'qa-automation-engineer',
    filename: 'qa.SKILL.md',
    description: 'Expertise in automated test pyramid, boundary fuzzing, integration journeys, regression testing, and security sanity checks.',
    color: '#fbbf24',
  },
  {
    id: 'devops',
    name: 'DevOps & SRE Cloud Engineer',
    shortLabel: 'DevOps & CI/CD',
    skillName: 'devops-sre-engineer',
    filename: 'devops.SKILL.md',
    description: 'Expertise in multi-stage Docker containerization, Docker Compose orchestration, CI/CD pipeline automation, and production observability.',
    color: '#a78bfa',
  },
  {
    id: 'fullstack',
    name: 'Principal Fullstack Architect',
    shortLabel: 'Fullstack Principal',
    skillName: 'fullstack-principal-engineer',
    filename: 'fullstack.SKILL.md',
    description: 'Holistic system orchestration spanning end-to-end type safety, frontend-backend contract synchronization, and scalable production architecture.',
    color: '#ff7a45',
  },
]

export function getSpecialistRole(role: SpecialistRole): SpecialistRoleDef {
  return SPECIALIST_ROLES.find((r) => r.id === role) || SPECIALIST_ROLES[0]!
}

/**
 * Compiles a PromptTemplate into a specific AI coding agent configuration format.
 */
export function generateAgentInstructions(
  targetId: AgentTargetId,
  pt: PromptTemplate,
): string {
  const title = pt.title || 'Technical Architecture & Code Generation Specification'
  const roleCategory = pt.role_category || 'Fullstack'
  const tags =
    pt.tech_stack_tags && pt.tech_stack_tags.length > 0
      ? pt.tech_stack_tags.join(' | ')
      : 'General Full-Stack'
  const systemRole =
    pt.system_role?.trim() ||
    'Act as a Principal Software Architect and Staff Engineer. Build a deterministic, production-grade implementation.'
  const constraints =
    pt.technical_constraints?.trim() ||
    '- Enforce strict typing with zero implicit any.\n- Maintain clean separation of concerns.'
  const archRules =
    pt.architecture_rules?.trim() ||
    '- Maintain strict separation of concerns across transport, service, and persistence layers.\n- Ensure deterministic error propagation with typed error envelopes.'
  const instructions =
    pt.point_by_point_instructions?.trim() ||
    '1. Inspect workspace dependencies.\n2. Implement core models and services.\n3. Verify compilation and tests.'
  const edgeCases =
    pt.edge_cases_to_handle?.trim() ||
    '- Handle empty states, network timeouts, concurrent write races, and malformed payload inputs gracefully.'
  const outputFormat =
    pt.output_format?.trim() ||
    'Deliver complete, production-grade source files with exact module paths, strict typing, and zero placeholders.'

  switch (targetId) {
    case 'antigravity':
      return `# Antigravity Agent Directives: ${title}

## System Identity & Operational Mandate
${systemRole}

## Architectural Target & Stack
- **Role Category:** ${roleCategory}
- **Active Stack Lexicon:** ${tags}

## Inviolable Technical Boundaries & Constraints
- Maintain documentation integrity: preserve existing comments and docstrings.
- Never introduce unauthorized dependencies without explicit justification.
- Strict type safety: no implicit "any"; guarantee 1:1 type parity between backend payloads and client interfaces.
- Zero-regression policy: all edits must be verified with build and unit test checks.
${constraints}

## System Architecture & Layered Rules
${archRules}

## Step-by-Step Task Execution Plan
${instructions}

## Edge Cases, Failure Modes & Defensive Engineering
${edgeCases}

## Verification Criteria & Definition of Done
- Strict Type-Check: must complete with 0 errors.
- Project Linting: must complete with 0 warnings.
- Production Build: must produce compiled binaries/bundles without warnings.
- Deliverable Expectation: ${outputFormat}
`

    case 'cursor':
      return `# Cursor Rules: ${title}

## Role
${systemRole}

## Tech Stack & Category
- Category: ${roleCategory}
- Active Technologies: ${tags}

## Critical Constraints & Coding Standards
${constraints}

## Architectural Guardrails
${archRules}

## Step-by-Step Implementation Sequence
${instructions}

## Edge Cases & Error Prevention
${edgeCases}

## Output Requirements
${outputFormat}
`

    case 'copilot':
      return `<!-- Placement: .github/copilot-instructions.md -->
# GitHub Copilot & Codex Instructions: ${title}

## Role & System Persona
${systemRole}

## Stack & Environment
- Role Category: ${roleCategory}
- Technologies: ${tags}

## Coding Conventions & Constraints
${constraints}

## Architectural Guidelines
${archRules}

## Implementation Steps
${instructions}

## Edge Cases & Error Handling
${edgeCases}

## Expected Code Output
${outputFormat}
`

    case 'hermes':
      return `<system_identity>
Project: ${title}
Role Category: ${roleCategory}
Tech Stack: ${tags}
${systemRole}
</system_identity>

<technical_constraints>
${constraints}
</technical_constraints>

<architecture_rules>
${archRules}
</architecture_rules>

<step_by_step_plan>
${instructions}
</step_by_step_plan>

<edge_cases_and_error_handling>
${edgeCases}
</edge_cases_and_error_handling>

<output_format>
${outputFormat}
</output_format>
`

    case 'claude':
      return `# Claude Code Instructions: ${title}

## Summary & Role
${systemRole}

## Tech Stack
- Category: ${roleCategory}
- Stack: ${tags}

## Architecture
${archRules}

## Constraints & Style
${constraints}

## Implementation Instructions
${instructions}

## Handling Edge Cases
${edgeCases}

## Deliverables
${outputFormat}
`

    case 'raw':
    default:
      return `# ROLE & OBJECTIVE
${systemRole}

# TARGET ROLE & TECH STACK MATRIX
- **Role Category:** ${roleCategory}
- **Active Stack Lexicon:** ${tags}

# TECH STACK CONSTRAINTS
${constraints}

# ARCHITECTURE RULES
${archRules}

# POINT-BY-POINT EXECUTION INSTRUCTIONS
${instructions}

# EDGE CASES TO HANDLE
${edgeCases}

# OUTPUT FORMAT SPECIFICATION
${outputFormat}
`
  }
}

/**
 * Directly compiles a PrdModel into a specific AI coding agent configuration format.
 */
export function generateAgentFromPrd(
  targetId: AgentTargetId,
  model: PrdModel,
): string {
  const featuresList = (model.features || [])
    .map(
      (f, i) =>
        `${i + 1}. **${f.name}** [${f.priority.toUpperCase()}]: ${f.description}`,
    )
    .join('\n')

  const pt: PromptTemplate = {
    title: model.title || 'Product Requirement Document',
    role_category: model.category || 'Fullstack',
    tech_stack_tags: (model.stack || '')
      .split('\n')
      .map((l) => l.replace(/^[-*•\s]+/, '').trim())
      .filter((l) => l.length > 0 && l.length < 50)
      .slice(0, 10),
    is_preset: false,
    system_role: `Act as a Principal Software Architect and Staff Engineer. Implement "${model.title}" (${model.category}) in strict adherence to the architectural specification.\n\nPROJECT OVERVIEW:\n${model.overview}\n\nPROBLEM SOLVED:\n${model.problem}`,
    technical_constraints: `${model.stack}\n\nNon-Functional Requirements:\n${model.nfr}\n\nTechnical Constraints:\n${model.constraints}`,
    architecture_rules: `### Target Personas\n${model.personas}\n\n### Data Models & Schemas\n${model.data_models}\n\n### API Contract & Endpoints\n${model.api_contract}`,
    point_by_point_instructions: `### Core Functional Features to Build:\n${featuresList || 'Build core functional modules.'}\n\n### Key User Flows:\n${model.flows}\n\nExecution Sequence:\n1. Verify workspace dependencies and environment configuration.\n2. Implement database models, migrations, and seeders.\n3. Implement API endpoints and service business logic.\n4. Implement client interfaces, state stores, and user flows.\n5. Verify zero build, lint, and type-check errors.`,
    edge_cases_to_handle: `### Explicit Non-Goals (Out of Scope):\n${model.non_goals}\n\n### Open Questions & Risk Mitigation:\n${model.open_questions}`,
    output_format:
      'Provide complete, production-grade source files with exact module paths, strict typing, and zero placeholders.',
    compiled_prompt: '',
  }

  return generateAgentInstructions(targetId, pt)
}

/**
 * Generates a standard Agent Skill file (SKILL.md) tailored to a specialized role:
 * Frontend (FE), Backend (BE), QA, DevOps, or Fullstack.
 * Includes official YAML frontmatter for Antigravity & Agentic standards.
 */
export function generateRoleSkillMd(
  role: SpecialistRole,
  model: PrdModel,
): string {
  const roleDef = getSpecialistRole(role)
  const featuresList = (model.features || [])
    .map(
      (f) =>
        `- **${f.name}** [${f.priority.toUpperCase()}]: ${f.description}`,
    )
    .join('\n')

  let roleSpecificGuidelines = ''
  let concreteDeliverables = ''
  let executionSteps = ''

  if (role === 'frontend') {
    roleSpecificGuidelines = `### Frontend Architectural Guardrails
- **Component Architecture:** Build composable, reusable UI components with single responsibility.
- **State Management:** Keep state close to where it is used. Centralize shared session/domain state with strict type contracts.
- **API Client Layer:** Never make raw unbounded fetch calls in UI views. Route all HTTP calls through strongly-typed API service functions.
- **UX & Ergonomics:** Every async action must provide instant feedback: loading spinners, skeleton placeholders, and human-friendly error toasts.
- **Form Validation:** Client-side validation must mirror backend schema rules before payload submission.
- **Responsive Layout:** Guarantee mobile, tablet, and desktop viewport compatibility.`

    concreteDeliverables = `1. View and Layout Components matching Section 06 User Flows.
2. Reactive Store modules (e.g. Pinia / Zustand / Redux) for active state.
3. Strongly-typed API client SDK mapping 1:1 to the API Contract in Section 09.
4. Client-side route guards verifying authentication and permission states.`

    executionSteps = `1. Scaffold UI component design tokens and shared base primitives.
2. Wire up client-side routing and layouts.
3. Build domain feature views adhering to user flows.
4. Connect frontend API client with optimistic updates and error boundaries.
5. Verify zero TypeScript errors and responsive layout fidelity.`
  } else if (role === 'backend') {
    roleSpecificGuidelines = `### Backend Architectural Guardrails
- **Layered Architecture:** Strict separation between Transport (Router/Controller), Service (Business Logic), and Persistence (Repository/ORM).
- **Data Integrity:** Use explicit SQL/ORM migrations. Enforce Foreign Keys, Unique constraints, and appropriate indexes.
- **API Contracts:** Strictly satisfy the contract in Section 09 with predictable JSON error envelopes ({ error: string, code: string }).
- **Security & Auth:** Hash passwords with Argon2/Bcrypt. Validate JWT signatures with short lifetimes and secure refresh tokens.
- **Sanitization & Input Defense:** Validate and sanitize every request body and query parameter before processing.
- **Concurrency & Transactions:** Wrap multi-entity updates in atomic database transactions.`

    concreteDeliverables = `1. Database migrations and model entity definitions mapping Section 08 Data Models.
2. REST / RPC Controllers implementing Section 09 API Contract.
3. Business domain services with transactional integrity.
4. Auth & authorization middleware guards.
5. Structured JSON logger with request correlation IDs.`

    executionSteps = `1. Initialize database connection pool and run migration scripts.
2. Implement repository layer with parameterized queries.
3. Build business service layer with input validation and domain errors.
4. Expose HTTP endpoints matching the API contract with JWT middleware.
5. Run automated integration checks against the database.`
  } else if (role === 'qa') {
    roleSpecificGuidelines = `### QA & Test Automation Guardrails
- **Test Pyramid:** High coverage of fast unit tests for business logic, targeted integration tests for API endpoints, and critical end-to-end user journeys.
- **Negative & Edge Cases:** Test empty states, string length overflows, SQL injection strings, expired tokens, and concurrent race conditions.
- **Deterministic Fixtures:** Never rely on flaky external live network requests. Use reproducible mock fixtures and isolated test databases.
- **Regression Prevention:** Every fixed bug must have an accompanying automated test that would have caught it.`

    concreteDeliverables = `1. Unit test suites for business validation rules and utility functions.
2. Integration API test suite asserting Section 09 HTTP endpoints, status codes, and JSON response schemas.
3. End-to-end automated browser test scenarios covering Section 06 User Flows.
4. Edge-case test matrix for unauthorized access, malformed payloads, and timeout handling.`

    executionSteps = `1. Configure test runners (e.g. Vitest / Jest / Playwright / Go test).
2. Write unit tests for core domain calculation and validation functions.
3. Write API integration tests covering positive (200/201) and negative (400/401/403/404/422) status codes.
4. Script automated end-to-end happy path user journeys.
5. Establish automated test coverage reporting in CI.`
  } else if (role === 'devops') {
    roleSpecificGuidelines = `### DevOps & SRE Guardrails
- **Containerization:** Multi-stage Docker builds to achieve minimal production image sizes and zero compiler tools in final runtime.
- **Environment Isolation:** Zero hardcoded secrets or environment variables. Provide .env.example with descriptive keys.
- **Orchestration:** Local multi-container development environment via Docker Compose (Web + API + DB + Cache).
- **Observability:** Expose /healthz and /readyz endpoints. Ensure structured stdout/stderr logging for log aggregators.
- **CI/CD Automation:** Automated workflows for Linting, Type-checking, Testing, and Container Building on every commit.`

    concreteDeliverables = `1. Production-ready multi-stage Dockerfile for all services.
2. docker-compose.yml orchestrating application services, database, and cache volumes.
3. CI/CD workflow pipeline scripts (e.g. GitHub Actions / GitLab CI).
4. Environment variable specification (.env.example).
5. Healthcheck endpoints and deployment verification scripts.`

    executionSteps = `1. Craft multi-stage Dockerfile with non-root security user.
2. Build and verify docker-compose.yml local multi-service stack.
3. Configure CI pipeline checking lint, unit tests, and build artifacts.
4. Verify environment variable propagation and database health probes.
5. Document rollout, rollback, and container restart policies.`
  } else {
    // Fullstack Principal
    roleSpecificGuidelines = `### Fullstack System Orchestration Guardrails
- **Contract Parity:** Ensure 1:1 type alignment between backend JSON payloads and frontend TypeScript interfaces.
- **Cross-Layer Traceability:** Maintain request correlation IDs from frontend action through API Gateway to SQL query logs.
- **Holistic Delivery:** Balance immediate feature velocity with long-term architectural maintainability and security.
- **Zero Technical Debt Leaks:** Enforce strict linting, zero warnings, and clean code principles across the entire repository.`

    concreteDeliverables = `1. Full end-to-end working system implementing Sections 01-13 of the Blueprint.
2. Synchronized shared types or schema-generated API contracts.
3. Complete local runnable setup script (e.g. setup.bat / setup.sh).
4. Comprehensive developer documentation and architectural decision records.`

    executionSteps = `1. Verify workspace structure and database connectivity.
2. Implement backend persistence layer and REST controllers.
3. Implement frontend UI views, state stores, and API clients.
4. Verify end-to-end user flows from browser to database.
5. Run full test suite, lint checks, and production build.`
  }

  return `---
name: ${roleDef.skillName}
description: ${roleDef.description}
---

# ${roleDef.name}: ${model.title || 'System Blueprint'}

## Executive Summary & System Context
- **Project Title:** ${model.title || 'Enterprise Application'}
- **Domain Category:** ${model.category || 'Full-Stack Application'}
- **System Overview:** ${model.overview || 'Architectural specification managed via BlueprintDev.'}
- **Core Problem Solved:** ${model.problem || 'Standardized technical implementation.'}
- **Target Audience:** ${model.personas || 'Engineering team and end users.'}

## Target Tech Stack
${model.stack || '- Modern Web & Cloud Architecture'}

## Non-Functional Requirements & Performance Targets
${model.nfr || '- p95 latency < 200ms\n- 99.9% uptime\n- Zero unhandled exceptions'}

${roleSpecificGuidelines}

## Core Features Under Scope
${featuresList || '- Implementation of core domain features.'}

## Data Models & Schema Contracts
${model.data_models || '- Relational database models with strict foreign key constraints.'}

## API Contract Specifications
${model.api_contract || 'GET /api/v1/health -> System healthcheck'}

## Concrete Deliverables Expected
${concreteDeliverables}

## Step-by-Step Implementation Sequence
${executionSteps}

## Inviolable Constraints & Out-of-Scope (Non-Goals)
### Constraints:
${model.constraints || '- Strict type-safety, zero implicit any, zero unhandled promise rejections.'}

### Out-of-Scope (Non-Goals):
${model.non_goals || '- No legacy migrations in initial sprint.'}

## Definition of Done (DoD)
- [ ] Code strictly satisfies all architectural directives above.
- [ ] Zero build warnings, zero linter errors, and 100% type-check pass.
- [ ] Automated tests pass deterministically.
- [ ] All sensitive credentials parameterized via environment variables.
`
}

/**
 * Triggers a browser file download for the specified agent configuration.
 */
export function downloadAgentFile(
  targetId: AgentTargetId,
  content: string,
  docTitle?: string,
): void {
  const target = getAgentTarget(targetId)
  let filename = target.filename

  // For raw prompt or generic markdown, prefix with slug
  if (targetId === 'raw') {
    const slug = (docTitle || 'prompt')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    filename = `${slug || 'technical-prompt'}.md`
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Triggers a browser file download for a specialized SKILL.md.
 */
export function downloadRoleSkillMd(
  role: SpecialistRole,
  content: string,
  docTitle?: string,
): void {
  const roleDef = getSpecialistRole(role)
  const slug = (docTitle || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const filename = `${slug}-${roleDef.filename}`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
