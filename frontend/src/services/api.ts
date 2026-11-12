import axios, { type AxiosInstance, type AxiosError } from 'axios'

export interface PrdDocument {
  id?: number
  title: string
  category: string
  is_preset: boolean
  overview: string
  target_users: string
  tech_stack: string
  core_features: string
  architecture_specs: string
  edge_cases: string
  compiled_markdown: string
  created_at?: string
  updated_at?: string
}

export interface PromptTemplate {
  id?: number
  title: string
  role_category: string
  tech_stack_tags: string[]
  is_preset: boolean
  system_role: string
  technical_constraints: string
  architecture_rules: string
  point_by_point_instructions: string
  edge_cases_to_handle: string
  output_format: string
  compiled_prompt: string
  source_prd_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface PrdFilterParams {
  category?: string
  is_preset?: boolean
  search?: string
}

export interface PromptFilterParams {
  role_category?: string
  stack?: string
  is_preset?: boolean
  search?: string
}

export interface AIGenerateRequest {
  provider: string
  model: string
  api_key?: string
  base_url?: string
  system_prompt?: string
  user_prompt: string
  max_tokens?: number
}

export interface AIGenerateResponse {
  content: string
  provider: string
  model: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; details?: string }>) => {
    const serverMsg =
      error.response?.data?.details ||
      error.response?.data?.error ||
      error.message ||
      'Unexpected network error'
    return Promise.reject(new Error(serverMsg))
  },
)

export function compilePrdMarkdownClient(doc: PrdDocument): string {
  const targetUsers =
    doc.target_users?.trim() ||
    '- Solo Engineers, Tech Leads, and Product Teams requiring deterministic architecture specs.'
  return `# ${doc.title || 'Untitled PRD'}
**Category:** ${doc.category || 'SaaS Web App'} | **Preset Template:** ${doc.is_preset ? 'Yes' : 'No'}

---

## 1. Project Overview & Problem Statement
${doc.overview || '_No overview specified._'}

## 2. Target Users & Core Personas
${targetUsers}

## 3. Core Features & Functional Scope
${doc.core_features || '_No core features specified._'}

## 4. Tech Stack & System Architecture
${doc.tech_stack || '_No tech stack specified._'}

## 5. API Endpoints & Data Models
${doc.architecture_specs || '_No API or schema specs specified._'}

## 6. Non-Goals, Constraints & Edge Cases
${doc.edge_cases || '_No edge cases specified._'}
`
}

export function compileTechnicalPromptClient(pt: PromptTemplate): string {
  const tags =
    pt.tech_stack_tags && pt.tech_stack_tags.length > 0
      ? pt.tech_stack_tags.join(' | ')
      : 'General Full-Stack'
  const archRules =
    pt.architecture_rules?.trim() ||
    '- Maintain strict separation of concerns across transport, service, and persistence layers.\n- Ensure deterministic error propagation with typed error envelopes.'
  const edgeCases =
    pt.edge_cases_to_handle?.trim() ||
    '- Handle empty states, network timeouts, concurrent write races, and malformed payload inputs gracefully.'

  return `# ROLE & OBJECTIVE
${pt.system_role || 'Act as a Principal Software Architect and Staff Engineer.'}

# TARGET ROLE & TECH STACK MATRIX
- **Role Category:** ${pt.role_category || 'Fullstack'}
- **Active Stack Lexicon:** ${tags}

# TECH STACK CONSTRAINTS
${pt.technical_constraints || '- Follow strict typing and modular architecture practices.'}

# ARCHITECTURE RULES
${archRules}

# POINT-BY-POINT EXECUTION INSTRUCTIONS
${pt.point_by_point_instructions || '1. Inspect workspace dependencies.\n2. Implement core models and services.\n3. Verify compilation.'}

# EDGE CASES TO HANDLE
${edgeCases}

# OUTPUT FORMAT SPECIFICATION
${pt.output_format || 'Return complete, production-grade source files with zero placeholders.'}
`
}

export const prdApi = {
  async list(params?: PrdFilterParams): Promise<PrdDocument[]> {
    const response = await api.get<PrdDocument[]>('/prds', { params })
    return response.data
  },
  async getById(id: number): Promise<PrdDocument> {
    const response = await api.get<PrdDocument>(`/prds/${id}`)
    return response.data
  },
  async create(payload: PrdDocument): Promise<PrdDocument> {
    const response = await api.post<PrdDocument>('/prds', payload)
    return response.data
  },
  async update(id: number, payload: PrdDocument): Promise<PrdDocument> {
    const response = await api.put<PrdDocument>(`/prds/${id}`, payload)
    return response.data
  },
  async remove(id: number): Promise<{ message: string; id: number }> {
    const response = await api.delete<{ message: string; id: number }>(`/prds/${id}`)
    return response.data
  },
}

export const promptApi = {
  async list(params?: PromptFilterParams): Promise<PromptTemplate[]> {
    const response = await api.get<PromptTemplate[]>('/prompts', { params })
    return response.data
  },
  async getById(id: number): Promise<PromptTemplate> {
    const response = await api.get<PromptTemplate>(`/prompts/${id}`)
    return response.data
  },
  async create(payload: PromptTemplate): Promise<PromptTemplate> {
    const response = await api.post<PromptTemplate>('/prompts', payload)
    return response.data
  },
  async update(id: number, payload: PromptTemplate): Promise<PromptTemplate> {
    const response = await api.put<PromptTemplate>(`/prompts/${id}`, payload)
    return response.data
  },
  async remove(id: number): Promise<{ message: string; id: number }> {
    const response = await api.delete<{ message: string; id: number }>(`/prompts/${id}`)
    return response.data
  },
}

export const healthApi = {
  async check(): Promise<{ status: string; service: string }> {
    const response = await api.get<{ status: string; service: string }>('/health')
    return response.data
  },
}

export default api
