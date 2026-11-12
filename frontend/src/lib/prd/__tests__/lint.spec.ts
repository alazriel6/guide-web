import { describe, it, expect } from 'vitest'
import { lint, getCompleteness, extractEntities } from '../lint'
import { createBlankModel } from '../sections'

describe('PRD Linter', () => {
  it('detects required-empty error in simple and advanced mode', () => {
    const emptyModel = createBlankModel('Test Document', 'SaaS Web App')
    const simpleIssues = lint(emptyModel, 'simple')

    const requiredEmptySimple = simpleIssues.filter((i) => i.ruleId === 'required-empty')
    // In simple mode: overview, problem, personas, features, non_goals are required
    expect(requiredEmptySimple.length).toBe(5)
    expect(requiredEmptySimple.some((i) => i.sectionId === 'overview')).toBe(true)
    expect(requiredEmptySimple.some((i) => i.sectionId === 'features')).toBe(true)
    expect(requiredEmptySimple.some((i) => i.sectionId === 'stack')).toBe(false) // stack is technical group

    const advancedIssues = lint(emptyModel, 'advanced')
    const requiredEmptyAdv = advancedIssues.filter((i) => i.ruleId === 'required-empty')
    // In advanced mode: product (4) + technical (3: stack, data_models, api_contract) + boundaries (1: non_goals) = 8
    expect(requiredEmptyAdv.length).toBe(8)
    expect(requiredEmptyAdv.some((i) => i.sectionId === 'stack')).toBe(true)
  })

  it('detects too-short warning when section is below minChars', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.overview = 'Short overview' // minChars is 50
    const issues = lint(model, 'simple')

    const shortIssue = issues.find((i) => i.ruleId === 'too-short' && i.sectionId === 'overview')
    expect(shortIssue).toBeDefined()
    expect(shortIssue?.severity).toBe('warn')
    expect(shortIssue?.message).toContain('too short')
  })

  it('detects vague-words warning with line number', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.overview =
      'This platform delivers ultra high-availability feature evaluations for microservices.\nIt provides a fast and robust engine for engineers.\nEnsuring high reliability.'
    const issues = lint(model, 'simple')

    const vagueIssues = issues.filter((i) => i.ruleId === 'vague-words')
    expect(vagueIssues.length).toBeGreaterThan(0)
    expect(vagueIssues[0]?.message).toContain('State a number or criterion')
    expect(vagueIssues[0]?.line).toBe(2) // "fast and robust" is on line 2
  })

  it('detects metrics-unmeasurable warning when lines lack digits', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.metrics = '- Higher developer velocity\n- P99 latency under 15ms\n- Improved user happiness'
    const issues = lint(model, 'simple')

    const metricIssues = issues.filter((i) => i.ruleId === 'metrics-unmeasurable')
    expect(metricIssues.length).toBe(2) // line 1 and line 3 have no digits
    expect(metricIssues[0]?.line).toBe(1)
    expect(metricIssues[1]?.line).toBe(3)
  })

  it('detects features-no-mvp error when all features are later', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.features = [
      { name: 'Analytics', priority: 'later', description: 'Metrics visualizer' },
      { name: 'Export', priority: 'later', description: 'CSV download' },
    ]
    const issues = lint(model, 'simple')

    const noMvpIssue = issues.find((i) => i.ruleId === 'features-no-mvp')
    expect(noMvpIssue).toBeDefined()
    expect(noMvpIssue?.severity).toBe('error')
  })

  it('detects features-too-many-mvp warning when MVP items exceed 7', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.features = Array.from({ length: 9 }, (_, i) => ({
      name: `Feature ${i + 1}`,
      priority: 'mvp',
      description: `Description ${i + 1}`,
    }))
    const issues = lint(model, 'simple')

    const tooManyIssue = issues.find((i) => i.ruleId === 'features-too-many-mvp')
    expect(tooManyIssue).toBeDefined()
    expect(tooManyIssue?.severity).toBe('warn')
    expect(tooManyIssue?.message).toContain('9 MVP items')
  })

  it('detects non-goals-missing warning when features > 5 and non_goals is empty', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.features = Array.from({ length: 6 }, (_, i) => ({
      name: `Feature ${i + 1}`,
      priority: i === 0 ? 'mvp' : 'later',
      description: `Description ${i + 1}`,
    }))
    model.non_goals = ''
    const issues = lint(model, 'simple')

    const nonGoalsIssue = issues.find((i) => i.ruleId === 'non-goals-missing')
    expect(nonGoalsIssue).toBeDefined()
    expect(nonGoalsIssue?.severity).toBe('warn')
  })

  it('detects api-malformed warning when endpoint line starts with verb but has invalid format', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.api_contract = 'POST /api/v1/valid\nGET invalid-route-without-slash\nPUT /api/v1/update'
    const issues = lint(model, 'advanced')

    const apiIssues = issues.filter((i) => i.ruleId === 'api-malformed')
    expect(apiIssues.length).toBe(1)
    expect(apiIssues[0]?.line).toBe(2)
  })

  it('detects entity-unreferenced info when data model entity is not in API contract', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.data_models = '### organizations\n- id: uuid\n\n### audit_logs\n- id: int'
    model.api_contract = 'GET /api/v1/organizations\nPOST /api/v1/organizations'
    const issues = lint(model, 'advanced')

    const entityIssues = issues.filter((i) => i.ruleId === 'entity-unreferenced')
    expect(entityIssues.length).toBe(1)
    expect(entityIssues[0]?.severity).toBe('info')
    expect(entityIssues[0]?.message).toContain('audit_logs')
  })

  it('extractEntities helper identifies headings, bold names, and SQL statements', () => {
    const sample = `
### feature_flags
- **user_tokens**: auth tokens
CREATE TABLE billing_records (id int);
`
    const entities = extractEntities(sample)
    expect(entities).toContain('feature_flags')
    expect(entities).toContain('user_tokens')
    expect(entities).toContain('billing_records')
  })

  it('getCompleteness returns correct ratio string without ring or percentage', () => {
    const model = createBlankModel('Test', 'SaaS')
    model.overview = 'Valid overview text with enough characters to be filled'
    model.problem = 'Valid problem text'

    const simple = getCompleteness(model, 'simple')
    expect(simple.filled).toBe(2)
    expect(simple.total).toBe(5)
    expect(simple.label).toBe('2 / 5 sections')
  })
})
