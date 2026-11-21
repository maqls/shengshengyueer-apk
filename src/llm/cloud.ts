import type { LLMOptions, LLMProvider } from './provider'
import { LLMError } from './provider'
import { httpRequest, parseJson } from './http'

export class CloudProvider implements LLMProvider {
  readonly name = 'cloud'

  constructor(
    private baseUrl: string,
    private model: string,
    private apiKey: string
  ) {}

  private get url(): string {
    const base = this.baseUrl.replace(/\/$/, '')
    return base.endsWith('/chat/completions') ? base : `${base}/v1/chat/completions`
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.baseUrl)
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const system = options.system ?? '你是一位耐心的老师，面向从学前到博士各学段的学生，用对方能听懂的话分步讲解题目，只讲题目相关内容。'
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
      const res = await httpRequest(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        timeoutMs: options.timeoutMs ?? 20000
      })
      if (!res.ok) throw new LLMError(`HTTP ${res.status}`, this.name)
      const data = parseJson<{
        choices?: { message?: { content?: string } }[]
        error?: { message?: string }
      }>(res)
      if (data.error) throw new LLMError(data.error.message ?? '未知错误', this.name)
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new LLMError('返回内容为空', this.name)
      return content.trim()
    } catch (err) {
      if (err instanceof LLMError) throw err
      throw new LLMError(err instanceof Error ? err.message : String(err), this.name)
    }
  }
}
