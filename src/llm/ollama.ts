import type { LLMOptions, LLMProvider } from './provider'
import { LLMError, withTimeout } from './provider'

type Endpoint = 'openai' | 'native'

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
      const res = await withTimeout(fetch(`${this.base}/api/tags`), 2500, this.name)
      return res.ok
    } catch {
      return false
    }
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const system = options.system ?? '你是耐心的小学老师，用孩子能听懂的话分步讲解题目，只讲题目相关内容。'
    const order: Endpoint[] = this.preferred === 'openai' ? ['openai', 'native'] : ['native', 'openai']
    let lastErr: LLMError | null = null
    for (const endpoint of order) {
      try {
        const text = endpoint === 'openai'
          ? await this.completeOpenAI(system, prompt, options)
          : await this.completeNative(system, prompt, options)
        this.preferred = endpoint
        return text
      } catch (err) {
        const le = err instanceof LLMError
          ? err
          : new LLMError(err instanceof Error ? err.message : String(err), this.name)
        if (le.message.includes('404') || le.message.includes('不包含')) {
          lastErr = le
          continue
        }
        throw le
      }
    }
    throw lastErr ?? new LLMError('所有接口均不可用', this.name)
  }

  private async completeOpenAI(system: string, prompt: string, options: LLMOptions): Promise<string> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: options.maxTokens ?? 500,
      stream: false
    }
    const res = await withTimeout(
      fetch(`${this.base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }),
      options.timeoutMs ?? 15000,
      this.name
    )
    if (!res.ok) throw new LLMError(`HTTP ${res.status}`, this.name)
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
      error?: string
    }
    if (data.error) throw new LLMError(data.error, this.name)
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new LLMError('返回内容为空', this.name)
    return content.trim()
  }

  private async completeNative(system: string, prompt: string, options: LLMOptions): Promise<string> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: { temperature: 0.3, num_predict: options.maxTokens ?? 500 }
    }
    const res = await withTimeout(
      fetch(`${this.base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }),
      options.timeoutMs ?? 15000,
      this.name
    )
    if (!res.ok) throw new LLMError(`HTTP ${res.status}`, this.name)
    const data = (await res.json()) as {
      message?: { content?: string }
      error?: string
    }
    if (data.error) throw new LLMError(data.error, this.name)
    const content = data.message?.content
    if (!content) throw new LLMError('返回内容为空', this.name)
    return content.trim()
  }
}
