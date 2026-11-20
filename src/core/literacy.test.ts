import { describe, it, expect } from 'vitest'
import { LITERACY_CHARS, charsByGrade, charById } from './literacy-data'
import { nextLiteracyTask, checkLiteracy, makeLiteracyRecord, literacyReviewChars } from './literacy'

describe('识字字库', () => {
  it('字库包含各年级常用字且字段完整', () => {
    expect(LITERACY_CHARS.length).toBeGreaterThan(30)
    for (const c of LITERACY_CHARS) {
      expect(c.char).toHaveLength(1)
      expect(c.pinyin.length).toBeGreaterThan(0)
      expect(c.words.length).toBeGreaterThan(0)
      expect(c.sentence.length).toBeGreaterThan(0)
    }
  })

  it('按年级筛选', () => {
    expect(charsByGrade(1).length).toBeGreaterThan(0)
    expect(charsByGrade(2).length).toBeGreaterThan(0)
    expect(charsByGrade(1).every((c) => c.grade === 1)).toBe(true)
  })

  it('按字查找', () => {
    expect(charById('一')?.pinyin).toBe('yī')
    expect(charById('不存在')).toBeUndefined()
  })
})

describe('识字引擎', () => {
  it('生成生字卡与听写任务', () => {
    const card = nextLiteracyTask('card', 1)
    expect(card.subject).toBe('literacy')
    expect(card.mode).toBe('card')
    expect(card.answer).toBe(card.char)
    const dictation = nextLiteracyTask('dictation', 1)
    expect(dictation.prompt).toContain(dictation.pinyin)
  })

  it('排除已出现过的字', () => {
    const first = nextLiteracyTask('card', 1)
    const second = nextLiteracyTask('card', 1, [first.char])
    expect(second.char).not.toBe(first.char)
  })

  it('判题与记录', () => {
    const task = nextLiteracyTask('dictation', 1)
    expect(checkLiteracy(task, task.answer)).toBe(true)
    expect(checkLiteracy(task, '错')).toBe(false)
    const record = makeLiteracyRecord(task, '错', 1000)
    expect(record.subject).toBe('literacy')
    expect(record.correct).toBe(false)
    expect(record.errorType).toBe('spelling')
    expect(record.knowledge[0]).toBe(`literacy:${task.char}`)
  })

  it('提取复习字去重', () => {
    const task = nextLiteracyTask('dictation', 1)
    const a = makeLiteracyRecord(task, '错', 1)
    const b = makeLiteracyRecord(task, '也错', 2)
    expect(literacyReviewChars([a, b])).toEqual([task.char])
  })
})
