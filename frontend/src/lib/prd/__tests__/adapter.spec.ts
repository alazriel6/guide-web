import { describe, it, expect } from 'vitest'
import type { PrdDocument } from '@/services/api'
import {
  fromLegacy,
  fromPayload,
  toPayload,
  toMarkdown,
  parseFeatures,
  serializeFeatures,
} from '../adapter'
import { createBlankModel, type PrdModel } from '../sections'

describe('PRD Adapter', () => {
  const legacyDoc: PrdDocument = {
    id: 101,
    title: 'Multi-Tenant B2B Telemetry & Feature Flag SaaS',
    category: 'SaaS Web App',
    is_preset: true,
    overview:
      'Build a low-latency feature flag evaluation and real-time product telemetry platform for engineering organizations.',
    target_users:
      '- **Release Engineers & SREs:** Need instant kill-switches.\n- **Full-Stack Teams:** Need type-safe SDK evaluation.',
    core_features:
      '- **Rule Evaluation Engine:** Deterministic SHA-256 user bucketing.\n- **Environment Matrix:** Immutable audit trail.\n- **Real-Time Streaming:** SSE endpoint.',
    tech_stack:
      '- **Frontend:** Vue 3, TypeScript\n- **Backend:** Go 1.22, Gin, GORM\n- **Database:** PostgreSQL 16',
    architecture_specs:
      '### Core Entities\n- organizations: id, name\n- feature_flags: id, key\n\n### Key REST Endpoints\nPOST /api/v1/flags\nGET /api/v1/flags/:key',
    edge_cases:
      '- No multi-region replication in v1.\n- Storing plaintext keys is out of scope.',
    compiled_markdown: '',
  }

  it('fromLegacy: maps old 6 sections accurately into new 13 sections', () => {
    const model = fromLegacy(legacyDoc)

    expect(model.id).toBe(101)
    expect(model.title).toBe(legacyDoc.title)
    expect(model.category).toBe(legacyDoc.category)
    expect(model.is_preset).toBe(true)

    // 01 -> overview (problem empty)
    expect(model.overview).toBe(legacyDoc.overview)
    expect(model.problem).toBe('')

    // 02 -> personas
    expect(model.personas).toBe(legacyDoc.target_users)

    // 03 -> features (parsed with priority defaulting to 'mvp')
    expect(model.features.length).toBe(3)
    expect(model.features[0]!.name).toBe('Rule Evaluation Engine')
    expect(model.features[0]!.priority).toBe('mvp')
    expect(model.features[0]!.description).toBe('Deterministic SHA-256 user bucketing.')

    // 04 -> stack
    expect(model.stack).toBe(legacyDoc.tech_stack)

    // 05 -> split on ### Key REST Endpoints into data_models + api_contract
    expect(model.data_models).toContain('### Core Entities')
    expect(model.api_contract).toContain('POST /api/v1/flags')
    expect(model.api_contract).toContain('GET /api/v1/flags/:key')

    // 06 -> non_goals
    expect(model.non_goals).toBe(legacyDoc.edge_cases)

    // Optional sections default to empty
    expect(model.flows).toBe('')
    expect(model.metrics).toBe('')
    expect(model.nfr).toBe('')
    expect(model.constraints).toBe('')
    expect(model.open_questions).toBe('')
  })

  it('parseFeatures and serializeFeatures round-trip correctly with priorities', () => {
    const raw = `- **Flag Evaluator** [MVP]: Low-latency evaluation engine\n- **Audit Logger** [Later]: Long term cold storage`
    const parsed = parseFeatures(raw)
    expect(parsed).toEqual([
      { name: 'Flag Evaluator', priority: 'mvp', description: 'Low-latency evaluation engine' },
      { name: 'Audit Logger', priority: 'later', description: 'Long term cold storage' },
    ])

    const serialized = serializeFeatures(parsed)
    expect(serialized).toBe(raw)

    expect(parseFeatures('')).toEqual([])
    expect(serializeFeatures([])).toBe('')
  })

  it('toMarkdown generates complete document with sentence-case headings', () => {
    const model = createBlankModel('Test Platform', 'AI Tooling')
    model.overview = 'Building an AI evaluation engine.'
    model.problem = 'Lack of standardized benchmark pipelines.'
    model.features = [{ name: 'Eval Runner', priority: 'mvp', description: 'Runs 100 test prompts' }]

    const md = toMarkdown(model)
    expect(md).toContain('# Test Platform')
    expect(md).toContain('## 1. Project overview\n\nBuilding an AI evaluation engine.')
    expect(md).toContain('## 2. Problem statement\n\nLack of standardized benchmark pipelines.')
    expect(md).toContain('## 4. Core features\n\n- **Eval Runner** [MVP]: Runs 100 test prompts')
    // Empty sections skipped
    expect(md).not.toContain('## 5. Key user flows')
  })

  it('Round-trip lossless: fromPayload(toPayload(x)) deep-equals x', () => {
    const fullModel: PrdModel = {
      id: 42,
      title: 'Full Lossless Suite',
      category: 'Desktop Media App',
      is_preset: false,
      overview: 'Full project overview details here.',
      problem: 'Detailed operational problem description.',
      personas: '- Lead Audio Architect: Needs low latency mastering DSP.',
      features: [
        { name: 'Waveform Rendering', priority: 'mvp', description: 'GPU accelerated spectrogram' },
        { name: 'Cloud Backup', priority: 'later', description: 'S3 cold storage archival' },
      ],
      flows: '1. Load sample -> 2. Process DSP graph -> 3. Export WAV',
      metrics: '- Latency under 10ms.\n- Zero sample buffer underruns.',
      stack: '- Rust, WebGPU, WebAssembly',
      data_models: '### tracks\n- id: uuid\n- sample_rate: int',
      api_contract: 'POST /api/v1/tracks/render\nGET /api/v1/tracks/:id',
      nfr: '- 60 FPS UI rendering under full DSP load.',
      non_goals: '- No MP3 encoding in v1 release.',
      constraints: '- WebAssembly memory capped at 2GB.',
      open_questions: '- Should we use shared array buffers across web workers?',
      created_at: '2026-11-09T00:00:00Z',
      updated_at: '2026-11-09T01:00:00Z',
    }

    const payload = toPayload(fullModel)
    const reconstituted = fromPayload(payload)

    expect(reconstituted).toEqual(fullModel)
  })

  it('fromPayload correctly handles legacy docs without v2 subsection headers', () => {
    const reconstituted = fromPayload(legacyDoc)
    expect(reconstituted.overview).toBe(legacyDoc.overview)
    expect(reconstituted.problem).toBe('')
    expect(reconstituted.personas).toBe(legacyDoc.target_users)
    expect(reconstituted.stack).toBe(legacyDoc.tech_stack)
    expect(reconstituted.data_models).toContain('### Core Entities')
    expect(reconstituted.api_contract).toContain('POST /api/v1/flags')
    expect(reconstituted.non_goals).toBe(legacyDoc.edge_cases)
  })
})
