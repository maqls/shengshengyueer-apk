import { describe, it, expect, vi, afterEach } from 'vitest'
import { QuizPrefetcher } from './prefetch'

const fakeTask = (id: string) => ({
  id, subject: 'math' as const, kind: 'fill' as const, prompt: '题' + id,
  answer: '1', explain: '', knowledge: '', grades: [1]
})

describe('预生成缓存', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('take 在筛选变化时清空缓存', () => {
    const p = new QuizPrefetcher()
    ;(p as unknown as { cache: unknown[] }).cache = [fakeTask('a'), fakeTask('b')]
    ;(p as unknown as { key: string }).key = 'math|1'
    expect(p.take('math', 1)?.id).toBe('a')
    expect(p.size()).toBe(1)
    expect(p.take('english', 1)).toBeNull()
    expect(p.size()).toBe(0)
  })

  it('相同筛选连续取题', () => {
    const p = new QuizPrefetcher()
    ;(p as unknown as { cache: unknown[] }).cache = [fakeTask('a'), fakeTask('b')]
    ;(p as unknown as { key: string }).key = 'math|1'
    expect(p.take('math', 1)?.id).toBe('a')
    expect(p.take('math', 1)?.id).toBe('b')
    expect(p.take('math', 1)).toBeNull()
  })

  it('预热只调用真实提供方', async () => {
    const real = { name: 'ollama', complete: vi.fn().mockResolvedValue('好'), isAvailable: vi.fn() }
    const fallback = { name: 'fallback', complete: vi.fn(), isAvailable: vi.fn() }
    const p = new QuizPrefetcher()
    await p.warmup([fallback, real])
    expect(real.complete).toHaveBeenCalled()
    expect(fallback.complete).not.toHaveBeenCalled()
  })

  it('预热失败不抛出', async () => {
    const real = { name: 'ollama', complete: vi.fn().mockRejectedValue(new Error('fail')), isAvailable: vi.fn() }
    const p = new QuizPrefetcher()
    await expect(p.warmup([real])).resolves.toBeUndefined()
  })

  it('fill 忙时请求不丢弃，忙完自动补满', async () => {
    const p = new QuizPrefetcher()
    ;(p as unknown as { key: string }).key = 'math|1'
    const provider = {
      name: 'ollama',
      complete: vi.fn().mockResolvedValue(JSON.stringify({
        kind: 'fill', prompt: 'x', answer: '1', explain: 'e', knowledge: 'k'
      })),
      isAvailable: vi.fn()
    }
    // 模拟正在填充时的请求：应记录待补标记而不是丢弃
    ;(p as unknown as { filling: boolean }).filling = true
    void p.fill([provider], 'math', 1, [])
    ;(p as unknown as { filling: boolean }).filling = false
    await p.fill([provider], 'math', 1, [])
    expect((p as unknown as { cache: unknown[] }).cache.length).toBe(5)
    expect((p as unknown as { refill: boolean }).refill).toBe(false)
  })

  it('模型失败时用题库题兜底填充', async () => {
    const p = new QuizPrefetcher()
    ;(p as unknown as { key: string }).key = 'math|1'
    const provider = { name: 'ollama', complete: vi.fn().mockRejectedValue(new Error('down')), isAvailable: vi.fn() }
    await p.fill([provider], 'math', 1, [])
    expect((p as unknown as { cache: unknown[] }).cache.length).toBe(5)
  })
})
