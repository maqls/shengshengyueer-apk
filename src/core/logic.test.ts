import { describe, it, expect } from 'vitest'
import { checkAnswer, makeRecord } from './judge'
import { updateMastery, applyRecords, weakestKnowledge, DEFAULT_BKT } from './mastery'
import { buildReviewItems, makeVariant, nextInterval } from './review'
import { generateFromTemplate } from './generator'
import type { AnswerRecord, Mastery } from './types'

function record(correct: boolean, at: number, templateId = 'mul_table'): AnswerRecord {
  return {
    id: `r-${at}`,
    questionId: `q-${at}`,
    templateId,
    subject: 'math',
    knowledge: ['multiplication_table'],
    correct,
    userAnswer: correct ? 12 : 11,
    answer: 12,
    prompt: '3 × 4 = ?',
    elapsedMs: 1000,
    at,
    errorType: correct ? undefined : 'calculation'
  }
}

describe('判题引擎', () => {
  it('正确/错误/null 判定', () => {
    const q = generateFromTemplate('mul_table')
    expect(checkAnswer(q, q.answer)).toBe(true)
    expect(checkAnswer(q, q.answer + 1)).toBe(false)
    expect(checkAnswer(q, null)).toBe(false)
  })

  it('生成答题记录', () => {
    const q = generateFromTemplate('mul_table')
    const r = makeRecord(q, q.answer, 1234)
    expect(r.correct).toBe(true)
    expect(r.elapsedMs).toBe(1234)
    expect(r.knowledge).toEqual(q.knowledge)
  })
})

describe('BKT 掌握度', () => {
  it('答对提升掌握度，答错降低', () => {
    const start = 0.3
    expect(updateMastery(start, true)).toBeGreaterThan(start)
    expect(updateMastery(start, false)).toBeLessThan(start)
  })

  it('掌握度始终在 0..1', () => {
    let p = 0.5
    for (let i = 0; i < 50; i++) p = updateMastery(p, i % 2 === 0)
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThanOrEqual(1)
  })

  it('批量应用记录', () => {
    const next = applyRecords({}, [record(true, 1), record(true, 2)])
    expect(next.multiplication_table.attempts).toBe(2)
    expect(next.multiplication_table.value).toBeGreaterThan(DEFAULT_BKT.pInit)
  })

  it('薄弱知识点排序', () => {
    const masteries: Record<string, Mastery> = {
      a: { knowledge: 'a', value: 0.1, attempts: 1, updatedAt: 0 },
      b: { knowledge: 'b', value: 0.9, attempts: 1, updatedAt: 0 }
    }
    expect(weakestKnowledge(masteries)).toEqual(['a', 'b'])
  })
})

describe('错题复习', () => {
  it('间隔计算随重复次数递增', () => {
    expect(nextInterval(2, 0.5)).toBeGreaterThan(nextInterval(0, 0.5))
    expect(nextInterval(4, 0.9)).toBeGreaterThan(nextInterval(4, 0.3))
  })

  it('只返回到期的错题', () => {
    const now = 1_000_000
    const records = [record(false, now - 10 * 24 * 3600 * 1000), record(true, now - 1000)]
    const items = buildReviewItems(records, {}, now)
    expect(items.length).toBe(1)
    expect(items[0].record.correct).toBe(false)
  })

  it('变式题保持同一知识点且题干不同', () => {
    const q = generateFromTemplate('mul_table')
    const variant = makeVariant(q)
    expect(variant.templateId).toBe(q.templateId)
    expect(variant.id).not.toBe(q.id)
  })
})
