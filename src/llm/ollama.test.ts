import { describe, it, expect, vi, afterEach } from 'vitest'
import { OllamaProvider } from './ollama'

class FakeXHR {
  static handler: (url: string, body: unknown) => { status: number; text: string }
  static instances: FakeXHR[] = []
  method = ''
  url = ''
  body = ''
  timeout = 0
  headers: Record<string, string> = {}
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeout: (() => void) | null = null
  onabort: (() => void) | null = null
  status = 200
  responseText = ''

  constructor() {
    FakeXHR.instances.push(this)
  }
  open(method: string, url: string): void {
    this.method = method
    this.url = url
  }
  setRequestHeader(key: string, value: string): void {
    this.headers[key] = value
  }
  send(body: string | null): void {
    this.body = body ?? ''
    const result = FakeXHR.handler(this.url, JSON.parse(this.body || '{}'))
    this.status = result.status
    this.responseText = result.text
    setTimeout(() => this.onload?.(), 0)
  }
}

describe('Ollama 多端点兼容', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    FakeXHR.instances = []
  })

  function stub(handler: (url: string, body: unknown) => { status: number; text: string }) {
    FakeXHR.handler = handler
    vi.stubGlobal('XMLHttpRequest', FakeXHR)
  }

  function okChat(content: string) {
    return { status: 200, text: JSON.stringify({ message: { content } }) }
  }

  it('OpenAI 端点可用时直接使用', async () => {
    stub((url) => {
      if (url.includes('/v1/chat/completions')) {
        return { status: 200, text: JSON.stringify({ choices: [{ message: { content: '正常' } }] }) }
      }
      return okChat('不应使用')
    })
    const p = new OllamaProvider('http://192.168.0.42:11434', 'qwen2.5:7b')
    expect(await p.complete('你好')).toBe('正常')
    expect(p.lastEndpoint()).toBe('openai')
    expect(FakeXHR.instances[0].url).toContain('/v1/chat/completions')
  })

  it('OpenAI 与 chat 均 404 时降级到 /api/generate', async () => {
    stub((url) => {
      if (url.includes('/api/generate')) {
        return { status: 200, text: JSON.stringify({ response: '生成正常' }) }
      }
      return { status: 404, text: '404 page not found' }
    })
    const p = new OllamaProvider('http://192.168.0.42:11434', 'qwen2.5:7b')
    expect(await p.complete('你好')).toBe('生成正常')
    expect(p.lastEndpoint()).toBe('generate')
    expect(FakeXHR.instances.some((x) => x.url.includes('/api/generate'))).toBe(true)
  })

  it('全部端点失败时抛出含各端点的错误', async () => {
    stub(() => ({ status: 404, text: '404' }))
    const p = new OllamaProvider('http://x:11434', 'm')
    await expect(p.complete('hi')).rejects.toThrow(/openai.*native.*generate/)
  })
})
