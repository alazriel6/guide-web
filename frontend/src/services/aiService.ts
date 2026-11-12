import api, { type AIGenerateRequest, type AIGenerateResponse } from './api'
import { useAiConfigStore } from '@/stores/aiConfig'

export interface GenerateOptions {
  systemPrompt?: string
  userPrompt: string
  maxTokens?: number
}

/**
 * Unified AI Generation Service:
 * Routes requests either directly from the browser (when configured or when backend is down)
 * or through the Go backend proxy POST /api/v1/ai/generate.
 */
export async function generateWithAI(options: GenerateOptions): Promise<AIGenerateResponse> {
  const aiStore = useAiConfigStore()
  const cfg = aiStore.state

  const systemPrompt =
    options.systemPrompt ||
    'You are a Principal Full-Stack Software Architect and Technical Prompt Engineer. Produce crisp, deterministic, production-grade technical specifications and prompts without generic filler.'

  const timeoutMs = (cfg.timeoutSeconds && cfg.timeoutSeconds >= 10 ? cfg.timeoutSeconds : 300) * 1000
  const maxTokens = options.maxTokens || 2048

  // Mode 1A: Direct browser fetch to local Ollama / LM Studio / Local Custom
  if (cfg.mode === 'local' && cfg.directLocalFetch) {
    return directLocalInference(
      cfg.localProvider,
      cfg.localBaseUrl,
      cfg.localModel,
      systemPrompt,
      options.userPrompt,
      timeoutMs,
      maxTokens,
    )
  }

  // Primary: Route through Go Backend Unified Proxy POST /api/v1/ai/generate
  const payload: AIGenerateRequest = {
    provider: aiStore.activeProvider,
    model: aiStore.activeModel,
    api_key: aiStore.activeApiKey,
    base_url: aiStore.activeBaseUrl,
    system_prompt: systemPrompt,
    user_prompt: options.userPrompt,
    max_tokens: maxTokens,
  }

  try {
    const response = await api.post<AIGenerateResponse>('/ai/generate', payload, {
      headers: aiStore.activeApiKey
        ? {
            'X-API-Key': aiStore.activeApiKey,
          }
        : undefined,
      timeout: timeoutMs,
    })
    return response.data
  } catch (backendErr) {
    // If backend proxy failed (e.g. backend not running or network error),
    // and we have an API key or local endpoint, attempt direct client-side fallback
    try {
      if (cfg.mode === 'cloud') {
        return await directCloudInference(
          cfg.cloudProvider,
          cfg.cloudModel,
          aiStore.activeApiKey,
          cfg.cloudBaseUrl,
          systemPrompt,
          options.userPrompt,
          timeoutMs,
          maxTokens,
        )
      } else {
        return await directLocalInference(
          cfg.localProvider,
          cfg.localBaseUrl,
          cfg.localModel,
          systemPrompt,
          options.userPrompt,
          timeoutMs,
          maxTokens,
        )
      }
    } catch {
      // If direct fallback also failed, throw original backend error with clear message
      const msg = backendErr instanceof Error ? backendErr.message : 'AI request failed'
      throw new Error(`AI Gateway Error: ${msg}`)
    }
  }
}

async function directLocalInference(
  provider: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs = 300000,
  maxTokens = 2048,
): Promise<AIGenerateResponse> {
  if (provider === 'ollama') {
    const endpoint = baseUrl.trim() || 'http://localhost:11434/api/generate'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'qwen2.5-coder:7b',
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: 0.4,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama request failed (${res.status}): ${errText}`)
    }
    const data = (await res.json()) as { response?: string; message?: { content?: string } }
    return {
      content: (data.response || data.message?.content || '').trim(),
      provider: 'ollama',
      model: model || 'qwen2.5-coder:7b',
    }
  }

  // LM Studio / Custom Local (OpenAI-compatible)
  let endpoint = baseUrl.trim() || 'http://localhost:1234/v1/chat/completions'
  endpoint = endpoint.replace(/\/+$/, '')
  if (endpoint.endsWith('/chat/completions')) {
    // Already full path
  } else if (endpoint.endsWith('/v1')) {
    endpoint += '/chat/completions'
  } else {
    endpoint += '/v1/chat/completions'
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'local-model',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string } | string
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>
  }

  if (data.error) {
    const errMsg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error)
    throw new Error(`LM Studio / Local Provider Error: ${errMsg}`)
  }

  if (!res.ok) {
    throw new Error(`Local inference failed (${res.status})`)
  }

  const choice = data.choices?.[0]?.message
  const content = (choice?.content || choice?.reasoning_content || '').trim()
  if (!content) {
    throw new Error('Local provider returned zero completion choices. Make sure the specified model is loaded in LM Studio.')
  }

  return {
    content,
    provider: provider,
    model: model,
  }
}

/**
 * Discover models running on a local or remote provider.
 * Queries the Go backend proxy first to avoid browser CORS restrictions,
 * with graceful fallback to direct client-side fetch.
 */
export async function fetchAvailableModels(
  provider: string,
  baseUrl: string,
  apiKey?: string,
): Promise<string[]> {
  // 1. Try Go backend proxy first
  try {
    const resp = await api.post<{ models: string[] }>(
      '/ai/models',
      {
        provider,
        base_url: baseUrl,
        api_key: apiKey,
      },
      { timeout: 8000 },
    )
    if (Array.isArray(resp.data?.models) && resp.data.models.length > 0) {
      return resp.data.models
    }
  } catch (backendErr) {
    console.warn('Backend proxy /ai/models call failed, attempting direct fetch:', backendErr)
  }

  // 2. Direct client fetch fallback
  if (provider === 'lmstudio' || provider === 'custom_local' || provider === 'openai') {
    let url = baseUrl.trim() || 'http://127.0.0.1:1234'
    url = url.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '')
    if (!url.endsWith('/v1')) {
      url += '/v1'
    }
    url += '/models'

    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errText}`)
    }
    const json = (await res.json()) as { data?: Array<{ id: string }> }
    if (Array.isArray(json.data)) {
      return json.data.map((m) => m.id).filter(Boolean)
    }
  } else if (provider === 'ollama') {
    let url = baseUrl.trim() || 'http://localhost:11434'
    url = url.replace(/\/api\/generate\/?$/, '').replace(/\/+$/, '') + '/api/tags'

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errText}`)
    }
    const json = (await res.json()) as { models?: Array<{ name: string }> }
    if (Array.isArray(json.models)) {
      return json.models.map((m) => m.name).filter(Boolean)
    }
  }

  return []
}

async function directCloudInference(
  provider: string,
  model: string,
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs = 300000,
  maxTokens = 4096,
): Promise<AIGenerateResponse> {
  if (!apiKey.trim() && provider !== 'custom') {
    throw new Error(`API Key is required for ${provider.toUpperCase()}`)
  }

  if (provider === 'gemini') {
    const targetModel = model.trim() || 'gemini-2.5-flash'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.4,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini direct API failed (${res.status}): ${errText}`)
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return { content: text.trim(), provider: 'gemini', model: targetModel }
  }

  if (provider === 'openai') {
    const targetModel = model.trim() || 'gpt-4o'
    let endpoint = baseUrl.trim() || 'https://api.openai.com/v1/chat/completions'
    if (!endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions'
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI direct API failed (${res.status}): ${errText}`)
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return {
      content: (data.choices?.[0]?.message?.content || '').trim(),
      provider: 'openai',
      model: targetModel,
    }
  }

  if (provider === 'deepseek') {
    const targetModel = model.trim() || 'deepseek-chat'
    let endpoint = baseUrl.trim() || 'https://api.deepseek.com/chat/completions'
    if (!endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions'
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`DeepSeek direct API failed (${res.status}): ${errText}`)
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>
    }
    const choice = data.choices?.[0]?.message
    const text = (choice?.content || choice?.reasoning_content || '').trim()
    return {
      content: text,
      provider: 'deepseek',
      model: targetModel,
    }
  }

  if (provider === 'custom') {
    let endpoint = baseUrl.trim()
    if (!endpoint) throw new Error('Base URL is required for custom AI provider')
    if (!endpoint.endsWith('/chat/completions') && !endpoint.includes(':generate')) {
      endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions'
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey.trim()) {
      headers.Authorization = `Bearer ${apiKey.trim()}`
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'default',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Custom provider failed (${res.status}): ${errText}`)
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return {
      content: (data.choices?.[0]?.message?.content || '').trim(),
      provider: 'custom',
      model: model || 'default',
    }
  }

  throw new Error(`Direct browser fetch not supported for ${provider}; check backend proxy.`)
}
