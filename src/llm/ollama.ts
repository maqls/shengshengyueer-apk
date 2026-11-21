import type { LLMOptions, LLMProvider } from './provider'
import { LLMError, withTimeout } from './provider'

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama'

  constructor(
    private baseUrl: string,
    private model: string
  ) {}

  private get url(): string {
    return `${this.baseUrl.replace(/\/$/, '')}/v1/chat/completions`
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl.replace(/\/$/, '')}/api/tags`),
        2500,
        this.name
      )
      return res.ok
    } catch {
      return false
    }
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const system = options.system ?? '你是耐心的小学老师，用孩子能听懂的话分步讲解题目，只讲题目相关内容。'
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
    try {
      const res = await withTimeout(
        fetch(this.url, {
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
    } catch (err) {
      if (err instanceof LLMError) throw err
      throw new LLMError(err instanceof Error ? err.message : String(err), this.name)
    }
  }
}
