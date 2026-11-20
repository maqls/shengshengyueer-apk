import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { store, resetDBForTest } from './db'

describe('IndexedDB 存储', () => {
  beforeEach(async () => {
    resetDBForTest()
    const req = indexedDB.deleteDatabase('shengshengyueer-learn')
    await new Promise<void>((resolve) => {
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  })

  it('读写设置', async () => {
    const settings = await store.getSettings()
    expect(settings.dailyGoal).toBe(20)
    settings.dailyGoal = 30
    await store.saveSettings(settings)
    expect((await store.getSettings()).dailyGoal).toBe(30)
  })

  it('保存并读取答题记录', async () => {
    const record = {
      id: 'x1',
      questionId: 'q1',
      templateId: 'mul_table',
      subject: 'math' as const,
      knowledge: ['multiplication_table'],
      correct: true,
      userAnswer: 12,
      answer: 12,
      prompt: '3 × 4 = ?',
      elapsedMs: 1000,
      at: Date.now()
    }
    await store.addRecord(record)
    const all = await store.getRecords()
    expect(all).toHaveLength(1)
    expect(all[0].answer).toBe(12)
  })

  it('讲解缓存', async () => {
    await store.saveExplanation('q1', '讲解内容', 'ollama')
    expect(await store.getExplanation('q1')).toBe('讲解内容')
    expect(await store.getExplanation('missing')).toBeNull()
  })
})
