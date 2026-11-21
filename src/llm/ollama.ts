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
    const system = options.system ?? '你是耐心的小学老师，用孩子能听懂的话分步讲解题目，只讲题目相关内容。'
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
          options: { temperature: 0.3, num_predict: options.maxTokens ?? 500 }
        }
    const url = endpoint === 'openai'
      ? `${this.base}/v1/chat/completions`
      : `${this.base}/api/chat`
    const res = await httpRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: options.timeoutMs ?? 15000
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (endpoint === 'openai') {
      const data = parseJson<{ choices?: { message?: { content?: string } }[]; error?: string }>(res)
      if (data.error) throw new Error(data.error)
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('返回内容为空')
      return content.trim()
    }
    const data = parseJson<{ message?: { content?: string }; error?: string }>(res)
    if (data.error) throw new Error(data.error)
    if (!data.message?.content) throw new Error('返回内容为空')
    return data.message.content.trim()
  }

  private async completeGenerate(system: string, prompt: string, options: LLMOptions): Promise<string> {
    const body = {
      model: this.model,
      prompt: `${system}\n\n${prompt}`,
      stream: false,
      options: { temperature: 0.3, num_predict: options.maxTokens ?? 500 }
    }
    const res = await httpRequest(`${this.base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: options.timeoutMs ?? 15000
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = parseJson<{ response?: string; error?: string }>(res)
    if (data.error) throw new Error(data.error)
    if (!data.response) throw new Error('返回内容为空')
    return data.response.trim()
  }
}
