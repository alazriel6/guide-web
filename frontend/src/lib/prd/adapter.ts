import type { PrdDocument } from '@/services/api'
import {
  PRD_SECTIONS,
  type PrdModel,
  type FeatureItem,
  createBlankModel,
} from './sections'

const HDR_PROBLEM = '### Problem Statement'
const HDR_FLOWS = '### Key User Flows'
const HDR_METRICS = '### Success Metrics'
const HDR_ENDPOINTS = '### Key REST Endpoints'
const HDR_NFR = '### Non-Functional Requirements'
const HDR_CONSTRAINTS = '### Constraints'
const HDR_OPEN_QUESTIONS = '### Open Questions'

/**
 * Splits text into a base section and named subsections based on markdown headers.
 */
function splitSectionContent(
  source: string,
  headerDefs: Array<{ header: string; id: string }>,
): Record<string, string> {
  const result: Record<string, string> = {}
  if (!source || !source.trim()) return result

  // Find occurrences and positions of each header
  interface HeaderMatch {
    id: string
    header: string
    index: number
    endIndex: number
  }

  const matches: HeaderMatch[] = []
  for (const def of headerDefs) {
    const idx = source.indexOf(def.header)
    if (idx !== -1) {
      matches.push({
        id: def.id,
        header: def.header,
        index: idx,
        endIndex: idx + def.header.length,
      })
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index)

  if (matches.length === 0) {
    result.base = source.trim()
    return result
  }

  // Base content is everything before the first header
  result.base = source.substring(0, matches[0]!.index).trim()

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!
    const nextIndex = i + 1 < matches.length ? matches[i + 1]!.index : source.length
    const body = source.substring(current.endIndex, nextIndex).trim()
    result[current.id] = body
  }

  return result
}

/**
 * Parses markdown list items into structured FeatureItem array.
 * Supports:
 * - **Name** [MVP]: Description
 * - **Name** [Later]: Description
 * - **Name:** Description (legacy)
 * - **Name**: Description (legacy)
 */
export function parseFeatures(text: string): FeatureItem[] {
  if (!text || !text.trim()) return []

  const items: FeatureItem[] = []
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) continue

    // Regex for: - **Name** [MVP|Later]: Description
    // or legacy: - **Name:** Description / - **Name**: Description
    const match = trimmed.match(/^[-*]\s+\*\*(.+?)\*\*\s*(?:\[(MVP|Later)\])?\s*:?\s*(.*)$/i)
    if (match) {
      let rawName = match[1]!.trim()
      // If trailing colon inside the bold e.g. **Rule Engine:**
      if (rawName.endsWith(':')) {
        rawName = rawName.slice(0, -1).trim()
      }
      const rawPriority = match[2]?.toLowerCase()
      const priority: 'mvp' | 'later' = rawPriority === 'later' ? 'later' : 'mvp'
      const description = match[3] ? match[3].trim() : ''

      if (rawName) {
        items.push({
          name: rawName,
          description,
          priority,
        })
      }
    }
  }

  return items
}

/**
 * Serializes FeatureItem array into markdown list.
 */
export function serializeFeatures(features: FeatureItem[]): string {
  if (!features || features.length === 0) return ''
  return features
    .filter((f) => f.name.trim().length > 0)
    .map(
      (f) =>
        `- **${f.name.trim()}** [${f.priority === 'later' ? 'Later' : 'MVP'}]: ${f.description.trim()}`,
    )
    .join('\n')
}

/**
 * fromLegacy: maps legacy 6-section document into new 13-section PrdModel.
 * - 01 -> overview (problem empty)
 * - 02 -> personas
 * - 03 -> features (parsed with priority defaulting to 'mvp')
 * - 04 -> stack
 * - 05 -> split on '### Key REST Endpoints' into data_models + api_contract
 * - 06 -> non_goals
 */
export function fromLegacy(doc: PrdDocument): PrdModel {
  const model = createBlankModel(doc.title, doc.category)
  model.id = doc.id
  model.is_preset = Boolean(doc.is_preset)
  model.created_at = doc.created_at
  model.updated_at = doc.updated_at

  model.overview = (doc.overview || '').trim()
  model.problem = ''
  model.personas = (doc.target_users || '').trim()
  model.features = parseFeatures(doc.core_features || '')
  model.stack = (doc.tech_stack || '').trim()

  // 05 split on ### Key REST Endpoints
  const archParts = splitSectionContent(doc.architecture_specs || '', [
    { header: HDR_ENDPOINTS, id: 'api_contract' },
  ])
  model.data_models = archParts.base || ''
  model.api_contract = archParts.api_contract || ''

  // 06 -> non_goals
  model.non_goals = (doc.edge_cases || '').trim()

  return model
}

/**
 * fromPayload: converts existing PrdDocument payload into new PrdModel.
 * Automatically detects whether payload contains serialized v2 subsections or is a legacy document.
 */
export function fromPayload(doc: PrdDocument): PrdModel {
  const model = createBlankModel(doc.title, doc.category)
  model.id = doc.id
  model.is_preset = Boolean(doc.is_preset)
  model.created_at = doc.created_at
  model.updated_at = doc.updated_at

  // Overview field -> overview, problem, flows, metrics
  const overviewParts = splitSectionContent(doc.overview || '', [
    { header: HDR_PROBLEM, id: 'problem' },
    { header: HDR_FLOWS, id: 'flows' },
    { header: HDR_METRICS, id: 'metrics' },
  ])
  model.overview = overviewParts.base || ''
  model.problem = overviewParts.problem || ''
  model.flows = overviewParts.flows || ''
  model.metrics = overviewParts.metrics || ''

  // Target users -> personas
  model.personas = (doc.target_users || '').trim()

  // Core features -> features list
  model.features = parseFeatures(doc.core_features || '')

  // Tech stack -> stack, nfr
  const stackParts = splitSectionContent(doc.tech_stack || '', [
    { header: HDR_NFR, id: 'nfr' },
  ])
  model.stack = stackParts.base || ''
  model.nfr = stackParts.nfr || ''

  // Architecture specs -> data_models, api_contract
  const archParts = splitSectionContent(doc.architecture_specs || '', [
    { header: HDR_ENDPOINTS, id: 'api_contract' },
  ])
  model.data_models = archParts.base || ''
  model.api_contract = archParts.api_contract || ''

  // Edge cases -> non_goals, constraints, open_questions
  const edgeParts = splitSectionContent(doc.edge_cases || '', [
    { header: HDR_CONSTRAINTS, id: 'constraints' },
    { header: HDR_OPEN_QUESTIONS, id: 'open_questions' },
  ])
  model.non_goals = edgeParts.base || ''
  model.constraints = edgeParts.constraints || ''
  model.open_questions = edgeParts.open_questions || ''

  return model
}

/**
 * toPayload: serializes PrdModel into existing PrdDocument payload shape.
 * Features serialize as: - **{name}** [MVP|Later]: {description}
 */
export function toPayload(model: PrdModel): PrdDocument {
  // 1. Overview field serialization
  const overviewBlocks: string[] = []
  if (model.overview.trim()) overviewBlocks.push(model.overview.trim())
  if (model.problem.trim()) overviewBlocks.push(`${HDR_PROBLEM}\n\n${model.problem.trim()}`)
  if (model.flows.trim()) overviewBlocks.push(`${HDR_FLOWS}\n\n${model.flows.trim()}`)
  if (model.metrics.trim()) overviewBlocks.push(`${HDR_METRICS}\n\n${model.metrics.trim()}`)
  const overview = overviewBlocks.join('\n\n')

  // 2. Target users field
  const target_users = model.personas.trim()

  // 3. Core features field
  const core_features = serializeFeatures(model.features)

  // 4. Tech stack field
  const stackBlocks: string[] = []
  if (model.stack.trim()) stackBlocks.push(model.stack.trim())
  if (model.nfr.trim()) stackBlocks.push(`${HDR_NFR}\n\n${model.nfr.trim()}`)
  const tech_stack = stackBlocks.join('\n\n')

  // 5. Architecture specs field
  const archBlocks: string[] = []
  if (model.data_models.trim()) archBlocks.push(model.data_models.trim())
  if (model.api_contract.trim()) archBlocks.push(`${HDR_ENDPOINTS}\n\n${model.api_contract.trim()}`)
  const architecture_specs = archBlocks.join('\n\n')

  // 6. Edge cases field
  const edgeBlocks: string[] = []
  if (model.non_goals.trim()) edgeBlocks.push(model.non_goals.trim())
  if (model.constraints.trim()) edgeBlocks.push(`${HDR_CONSTRAINTS}\n\n${model.constraints.trim()}`)
  if (model.open_questions.trim()) edgeBlocks.push(`${HDR_OPEN_QUESTIONS}\n\n${model.open_questions.trim()}`)
  const edge_cases = edgeBlocks.join('\n\n')

  const compiled_markdown = toMarkdown(model)

  return {
    id: model.id,
    title: model.title.trim(),
    category: model.category.trim() || 'SaaS Web App',
    is_preset: Boolean(model.is_preset),
    overview,
    target_users,
    tech_stack,
    core_features,
    architecture_specs,
    edge_cases,
    compiled_markdown,
    created_at: model.created_at,
    updated_at: model.updated_at,
  }
}

/**
 * toMarkdown: full document rendered with headings ## {order}. {title}, skipped when empty.
 */
export function toMarkdown(model: PrdModel): string {
  const sections: string[] = []

  // Document Title
  if (model.title.trim()) {
    sections.push(`# ${model.title.trim()}`)
  }

  for (const def of PRD_SECTIONS) {
    if (def.kind === 'list') {
      const items = model.features || []
      if (items.length > 0) {
        const serialized = serializeFeatures(items)
        if (serialized.trim()) {
          sections.push(`## ${def.order}. ${def.title}\n\n${serialized}`)
        }
      }
    } else {
      const value = (model[def.id as keyof PrdModel] as string) || ''
      if (value.trim()) {
        sections.push(`## ${def.order}. ${def.title}\n\n${value.trim()}`)
      }
    }
  }

  return sections.join('\n\n')
}
