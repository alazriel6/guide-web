import {
  PRD_SECTIONS,
  isSectionRequired,
  type PrdModel,
  type PrdStudioMode,
} from './sections'

export interface Issue {
  sectionId: string
  severity: 'error' | 'warn' | 'info'
  ruleId: string
  message: string
  line?: number
}

const VAGUE_WORDS_REGEX = /\b(fast|easy|modern|scalable|robust|user-friendly|seamless|intuitive|etc\.?)\b/i
const HTTP_VERB_LINE_START = /^(?:[-*]\s*)?(GET|POST|PUT|PATCH|DELETE)\b/i
const VALID_API_ENDPOINT = /^(?:[-*]\s*)?(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/i

/**
 * Extracts candidate table/entity names from data_models markdown.
 * Matches:
 * - ### table_name
 * - - **table_name**
 * - CREATE TABLE table_name
 */
export function extractEntities(dataModelsText: string): string[] {
  if (!dataModelsText || !dataModelsText.trim()) return []

  const entities = new Set<string>()
  const lines = dataModelsText.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    // 1. Heading: ### users or ### organizations
    const h3Match = trimmed.match(/^###\s+([a-zA-Z_][a-zA-Z0-9_]*)/)
    if (h3Match) {
      entities.add(h3Match[1]!.toLowerCase())
      continue
    }

    // 2. Bold list item: - **users**: or - **organizations**
    const boldMatch = trimmed.match(/^[-*]\s+\*\*([a-zA-Z_][a-zA-Z0-9_]*):?\*\*/)
    if (boldMatch) {
      entities.add(boldMatch[1]!.toLowerCase())
      continue
    }

    // 3. SQL: CREATE TABLE users
    const sqlMatch = trimmed.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/i)
    if (sqlMatch) {
      entities.add(sqlMatch[1]!.toLowerCase())
      continue
    }
  }

  // Filter out generic markdown noise words
  const ignore = new Set(['entity', 'entities', 'schema', 'schemas', 'table', 'tables', 'model', 'models'])
  return Array.from(entities).filter((e) => !ignore.has(e) && e.length > 2)
}

/**
 * Pure deterministic linter for PrdModel.
 */
export function lint(model: PrdModel, mode: PrdStudioMode = 'simple'): Issue[] {
  const issues: Issue[] = []
  const sectionsToCheck = PRD_SECTIONS

  // 1. Required section empty & 2. Too short
  for (const def of sectionsToCheck) {
    const required = isSectionRequired(def, mode)

    if (def.kind === 'list') {
      const items = model.features || []
      if (required && items.length === 0) {
        issues.push({
          sectionId: def.id,
          severity: 'error',
          ruleId: 'required-empty',
          message: `${def.title} is required in ${mode} mode.`,
        })
      }
    } else {
      const textVal = ((model[def.id as keyof PrdModel] as string) || '').trim()

      if (required && textVal.length === 0) {
        issues.push({
          sectionId: def.id,
          severity: 'error',
          ruleId: 'required-empty',
          message: `${def.title} is required in ${mode} mode.`,
        })
      } else if (textVal.length > 0 && def.minChars > 0 && textVal.length < def.minChars) {
        issues.push({
          sectionId: def.id,
          severity: 'warn',
          ruleId: 'too-short',
          message: `${def.title} is too short (${textVal.length}/${def.minChars} chars minimum).`,
        })
      }
    }
  }

  // 3. Vague words across all text sections & feature descriptions
  for (const def of sectionsToCheck) {
    if (def.kind === 'list') {
      for (let i = 0; i < (model.features || []).length; i++) {
        const item = model.features[i]!
        const fullItemText = `${item.name} ${item.description}`
        const vagueMatch = fullItemText.match(VAGUE_WORDS_REGEX)
        if (vagueMatch) {
          issues.push({
            sectionId: def.id,
            severity: 'warn',
            ruleId: 'vague-words',
            message: `Avoid vague word "${vagueMatch[0]}". State a number or criterion.`,
            line: i + 1,
          })
        }
      }
    } else {
      const textVal = (model[def.id as keyof PrdModel] as string) || ''
      if (textVal) {
        const lines = textVal.split(/\r?\n/)
        for (let idx = 0; idx < lines.length; idx++) {
          const line = lines[idx]!
          const match = line.match(VAGUE_WORDS_REGEX)
          if (match) {
            issues.push({
              sectionId: def.id,
              severity: 'warn',
              ruleId: 'vague-words',
              message: `Avoid vague word "${match[0]}". State a number or criterion.`,
              line: idx + 1,
            })
          }
        }
      }
    }
  }

  // 4. Metrics unmeasurable (any non-empty line without a digit)
  if (model.metrics && model.metrics.trim()) {
    const lines = model.metrics.split(/\r?\n/)
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx]!.trim()
      if (line.length > 0 && !/\d/.test(line)) {
        issues.push({
          sectionId: 'metrics',
          severity: 'warn',
          ruleId: 'metrics-unmeasurable',
          message: 'Success metric line lacks a quantifiable digit or target value.',
          line: idx + 1,
        })
      }
    }
  }

  // 5. Features: no MVP priority
  const features = model.features || []
  if (features.length > 0) {
    const mvpCount = features.filter((f) => f.priority === 'mvp').length
    if (mvpCount === 0) {
      issues.push({
        sectionId: 'features',
        severity: 'error',
        ruleId: 'features-no-mvp',
        message: 'Features exist but none has priority "mvp".',
      })
    }

    // 6. Features: too many MVP items (> 7)
    if (mvpCount > 7) {
      issues.push({
        sectionId: 'features',
        severity: 'warn',
        ruleId: 'features-too-many-mvp',
        message: `Found ${mvpCount} MVP items. More than 7 MVP features may cause delivery risk.`,
      })
    }
  }

  // 7. Non-goals missing when features > 5
  if (features.length > 5 && (!model.non_goals || !model.non_goals.trim())) {
    issues.push({
      sectionId: 'non_goals',
      severity: 'warn',
      ruleId: 'non-goals-missing',
      message: 'Feature scope exceeds 5 items but explicit non-goals section is empty.',
    })
  }

  // 8. API malformed: line starting with HTTP verb but not matching method + path
  if (model.api_contract && model.api_contract.trim()) {
    const lines = model.api_contract.split(/\r?\n/)
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx]!.trim()
      if (HTTP_VERB_LINE_START.test(line)) {
        if (!VALID_API_ENDPOINT.test(line)) {
          issues.push({
            sectionId: 'api_contract',
            severity: 'warn',
            ruleId: 'api-malformed',
            message:
              'Endpoint line must match standard method and path format (e.g. GET /api/v1/resource).',
            line: idx + 1,
          })
        }
      }
    }
  }

  // 9. Entity unreferenced: table name in data_models never mentioned in api_contract
  if (model.data_models && model.data_models.trim() && model.api_contract) {
    const entities = extractEntities(model.data_models)
    const apiTextLower = model.api_contract.toLowerCase()

    for (const entity of entities) {
      if (!apiTextLower.includes(entity)) {
        issues.push({
          sectionId: 'data_models',
          severity: 'info',
          ruleId: 'entity-unreferenced',
          message: `Table/entity "${entity}" in data models is not referenced in any API contract endpoint.`,
        })
      }
    }
  }

  return issues
}

/**
 * Calculates completeness: filled required sections / total required sections.
 * Returns { filled, total, label: "7 / 10 sections" }
 */
export function getCompleteness(
  model: PrdModel,
  mode: PrdStudioMode = 'simple',
): { filled: number; total: number; label: string } {
  const requiredSections = PRD_SECTIONS.filter((s) => isSectionRequired(s, mode))
  let filledCount = 0

  for (const def of requiredSections) {
    if (def.kind === 'list') {
      if ((model.features || []).length > 0) {
        filledCount++
      }
    } else {
      const val = ((model[def.id as keyof PrdModel] as string) || '').trim()
      if (val.length > 0) {
        filledCount++
      }
    }
  }

  return {
    filled: filledCount,
    total: requiredSections.length,
    label: `${filledCount} / ${requiredSections.length} sections`,
  }
}
