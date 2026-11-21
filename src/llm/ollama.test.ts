import { describe, it, expect, vi, afterEach } from 'vitest'
import { OllamaProvider } from './ollama'

describe('Ollama 双端点兼容', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function fakeFetch(handler: (url: string, init?: RequestInit) => Response) {
    const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      return handler(String(input), init)
    })
    vi.stubGlobal('fetch', fn)
    return fn
  }

  function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
  }

  it('OpenAI 端点可用时直接使用', async () => {
    const fn = fakeFetch((url) => {
      if (url.includes('/v1/chat/completions')) {
        return jsonResponse({ choices: [{ message: { content: '正常' } }] })
      }
      return jsonResponse({ message: { content: '不应使用' } })
    })
    const p = new OllamaProvider('http://192.168.0.42:11434', 'qwen2.5:7b')
    const text = await p.complete('你好')
    expect(text).toBe('正常')
    expect(p.lastEndpoint()).toBe('openai')
    expect(fn.mock.calls[0][0]).toContain('/v1/chat/completions')
  })

  it('OpenAI 端点 404 时自动降级到原生 /api/chat', async () => {
    const fn = fakeFetch((url) => {
      if (url.includes('/v1/chat/completions')) return jsonResponse({ error: 'not found' }, 404)
      if (url.includes('/api/chat')) return jsonResponse({ message: { content: '原生正常' } })
      return jsonResponse({}, 404)
    })
    const p = new OllamaProvider('http://192.168.0.42:11434', 'qwen2.5:7b')
    const text = await p.complete('你好')
    expect(text).toBe('原生正常')
    expect(p.lastEndpoint()).toBe('native')
    expect(fn.mock.calls.some((c) => String(c[0]).includes('/api/chat'))).toBe(true)
  })

  it('记住上次成功的端点，下次优先使用', async () => {
    fakeFetch((url) => {
      if (url.includes('/api/chat')) return jsonResponse({ message: { content: 'ok' } })
      return jsonResponse({ error: 'no' }, 404)
    })
    const p = new OllamaProvider('http://x:11434', 'm')
    await p.complete('1')
    expect(p.lastEndpoint()).toBe('native')
    await p.complete('2')
    expect(p.lastEndpoint()).toBe('native')
  })
})
