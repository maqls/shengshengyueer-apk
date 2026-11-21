import type { LLMOptions, LLMProvider } from './provider'
import { LLMError } from './provider'
import { httpRequest, parseJson } from './http'

type Endpoint = 'openai' | 'native' | 'generate'

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama'
  private preferred: Endpoint = 'openai'
  readonly lastEndpoint = (): Endpoint => this.preferred

  constructor(
    private baseUrl: string,
    private model: string
  ) {}

  private get base(): string {
    return this.baseUrl.replace(/\/$/, '')
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await httpRequest(`${this.base}/api/tags`, { timeoutMs: 2500 })
      return res.ok
    } catch {
      return false
    }
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const system = options.system ?? '你是一位耐心的老师，面向从学前到博士各学段的学生，用对方能听懂的话分步讲解题目，只讲题目相关内容。'
    // qwen3 系列默认开启思考模式，会耗尽 token 导致正文为空；/no_think 关闭思考
    const sys = `${system}\n/no_think`
    try {
      return await this.tryEndpoints(sys, prompt, options)
    } catch (firstError) {
      const msg = firstError instanceof Error ? firstError.message : String(firstError)
      if (!msg.includes('not found')) throw firstError
      const available = await this.fetchModelNames()
      if (!available.length) throw firstError
      const chosen = available.find((m) => m === this.model) ?? available[0]
      if (chosen === this.model) throw firstError
      this.model = chosen
      return await this.tryEndpoints(sys, prompt, options)
    }
  }

  private async tryEndpoints(system: string, prompt: string, options: LLMOptions): Promise<string> {
    const order: Endpoint[] = ['openai', 'native', 'generate']
    const idx = order.indexOf(this.preferred)
    const ordered = idx > 0 ? [...order.slice(idx), ...order.slice(0, idx)] : order
    const errors: string[] = []
    for (const endpoint of ordered) {
      try {
        const text = await this.call(endpoint, system, prompt, options)
        this.preferred = endpoint
        return text
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${endpoint}:${msg}`)
      }
    }
    throw new LLMError(errors.join('；'), this.name)
  }

  private async fetchModelNames(): Promise<string[]> {
    try {
      const res = await httpRequest(`${this.base}/api/tags`, { timeoutMs: 4000 })
      if (!res.ok) return []
      const data = parseJson<{ models?: { name?: string }[] }>(res)
      return (data.models ?? []).map((m) => m.name).filter((n): n is string => Boolean(n))
    } catch {
      return []
    }
  }

  private async call(endpoint: Endpoint, system: string, prompt: string, options: LLMOptions): Promise<string> {
    if (endpoint === 'generate') return this.completeGenerate(system, prompt, options)
    const body = endpoint === 'openai'
      ? {
          model: this.model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: options.maxTokens ?? 500,
          stream: false
        }
      : {
          model: this.model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
          stream: false,
          think: false,
          options: { temperature: 0.3, num_predict: options.maxTokens ?? 500 }
        }
    const url = endpoint === 'openai'
      ? `${this.base}/v1/chat/completions`
      : `${this.base}/api/chat`
    const res = await httpRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: options.timeoutMs ?? 180000
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (endpoint === 'openai') {
      const data = parseJson<{
        choices?: { message?: { content?: string; reasoning?: string; reasoning_content?: string } }[]
        error?: string
      }>(res)
      if (data.error) throw new Error(data.error)
      const message = data.choices?.[0]?.message
      const content = message?.content?.trim()
      // content 为空时兜底：思考内容里可能已含答案
      const fallback = message?.reasoning ?? message?.reasoning_content
      if (!content && !fallback) throw new Error('返回内容为空')
      return (content || fallback || '').trim()
    }
    const data = parseJson<{ message?: { content?: string; thinking?: string; reasoning?: string }; error?: string }>(res)
    if (data.error) throw new Error(data.error)
    const nativeContent = data.message?.content?.trim()
    const nativeFallback = data.message?.thinking ?? data.message?.reasoning
    if (!nativeContent && !nativeFallback) throw new Error('返回内容为空')
    return (nativeContent || nativeFallback || '').trim()
  }

  private async completeGenerate(system: string, prompt: string, options: LLMOptions): Promise<string> {
    const body = {
      model: this.model,
      prompt: `${system}\n\n${prompt}`,
      stream: false,
      think: false,
      options: { temperature: 0.3, num_predict: options.maxTokens ?? 500 }
    }
    const res = await httpRequest(`${this.base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: options.timeoutMs ?? 180000
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = parseJson<{ response?: string; thinking?: string; reasoning?: string; error?: string }>(res)
    if (data.error) throw new Error(data.error)
    const content = data.response?.trim()
    const fallback = data.thinking ?? data.reasoning
    if (!content && !fallback) throw new Error('返回内容为空')
    return (content || fallback || '').trim()
  }
}
