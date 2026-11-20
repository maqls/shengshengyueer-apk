import { describe, it, expect } from 'vitest'
import { explain, FallbackProvider } from './index'
import { LLMError, type LLMProvider } from './provider'

class StubProvider implements LLMProvider {
  constructor(
    readonly name: string,
    private works: boolean,
    private text = 'stub'
  ) {}
  async isAvailable(): Promise<boolean> {
    return this.works
  }
  async complete(): Promise<string> {
    if (!this.works) throw new LLMError('fail', this.name)
    return this.text
  }
}

describe('LLM 降级链', () => {
  it('本地不可用时回退到下一个可用提供方', async () => {
    const providers: LLMProvider[] = [
      new StubProvider('ollama', false),
      new StubProvider('cloud', true, '云端讲解'),
      new FallbackProvider()
    ]
    const result = await explain(providers, '题目prompt', '预设讲解')
    expect(result.text).toBe('云端讲解')
    expect(result.provider).toBe('cloud')
  })

  it('全部失败时使用预设文案', async () => {
    const providers: LLMProvider[] = [
      new StubProvider('ollama', false),
      new FallbackProvider()
    ]
    const result = await explain(providers, '题目prompt', '预设讲解')
    expect(result.text).toBe('预设讲解')
    expect(result.provider).toBe('fallback')
  })

  it('fallback 提供方总是可用', async () => {
    const fb = new FallbackProvider()
    expect(await fb.isAvailable()).toBe(true)
    expect(await fb.complete('内置文案')).toBe('内置文案')
  })

  it('超时错误被 LLMError 包装', () => {
    const err = new LLMError('请求超时', 'ollama')
    expect(err.message).toContain('ollama')
    expect(err.name).toBe('LLMError')
  })
})
