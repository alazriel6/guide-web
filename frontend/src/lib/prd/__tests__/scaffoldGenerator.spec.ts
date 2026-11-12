import { describe, it, expect } from 'vitest'
import {
  SCAFFOLD_TARGETS,
  getScaffoldTarget,
  generateWindowsBatchScript,
  generateBashScript,
} from '../scaffoldGenerator'
import { createBlankModel } from '../sections'

describe('scaffoldGenerator', () => {
  const model = createBlankModel()
  model.title = 'Realtime Collaborative Whiteboard'
  model.category = 'SaaS Web App'
  model.overview = 'Vector-based canvas with live multiplayer cursors.'
  model.data_models = '• canvases: id (PK), name (VARCHAR)'
  model.api_contract = '- GET /api/v1/canvases -> List boards'

  it('provides all 10 scaffold targets across Full-Stack, Frontend, and BaaS', () => {
    expect(SCAFFOLD_TARGETS.length).toBeGreaterThanOrEqual(10)
    const goTarget = getScaffoldTarget('fullstack-go-vue')
    expect(goTarget.badge).toBe('Go + Vue 3')
    expect(goTarget.tags).toContain('Go')

    const pyTarget = getScaffoldTarget('fullstack-fastapi-react')
    expect(pyTarget.tags).toContain('Python')

    const rustTarget = getScaffoldTarget('fullstack-rust-axum')
    expect(rustTarget.tags).toContain('Rust')

    const laravelTarget = getScaffoldTarget('fullstack-laravel-blade')
    expect(laravelTarget.badge).toBe('Laravel 11 + Blade')
    expect(laravelTarget.tags).toContain('Laravel')
    expect(laravelTarget.tags).toContain('Blade')

    const fbTarget = getScaffoldTarget('firebase-webapp')
    expect(fbTarget.category).toBe('BaaS & Cloud')
  })

  it('generates a valid Windows batch script (setup.bat)', () => {
    const bat = generateWindowsBatchScript(model, 'fullstack-go-vue')

    expect(bat).toContain('@echo off')
    expect(bat).toContain('BLUEPRINTDEV WORKBENCH')
    expect(bat).toContain('Go 1.22+ (Gin) & Vue 3 (Vite)')
    expect(bat).toContain('AGENTS.md')
    expect(bat).toContain('.cursorrules')
    expect(bat).toContain('openapi.yaml')
    expect(bat).toContain('schema.sql')
    expect(bat).toContain('tests\\api.http')
    expect(bat).toContain('docs\\QA_TEST_PLAN.md')
    expect(bat).toContain('docker-compose.yml')
    expect(bat).toContain('dev.bat')
    expect(bat).toContain('git init -b main')
  })

  it('generates a valid Linux/macOS Bash script (setup.sh)', () => {
    const sh = generateBashScript(model, 'fullstack-fastapi-react')

    expect(sh).toContain('#!/usr/bin/env bash')
    expect(sh).toContain('mkdir -p')
    expect(sh).toContain('cat << \'EOF\' > README.md')
    expect(sh).toContain('cat << \'EOF\' > AGENTS.md')
    expect(sh).toContain('cat << \'EOF\' > tests/api.http')
    expect(sh).toContain('cat << \'EOF\' > docs/QA_TEST_PLAN.md')
    expect(sh).toContain('cat << \'EOF\' > docker-compose.yml')
    expect(sh).toContain('git commit -m')
  })
})
