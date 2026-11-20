import { describe, it, expect } from 'vitest'
import { ENGLISH_WORDS, wordsByGrade, wordByName } from './english-data'
import { nextEnglishTask, checkEnglish, makeEnglishRecord, englishReviewWords } from './english'

describe('英语词库', () => {
  it('词库字段完整', () => {
    expect(ENGLISH_WORDS.length).toBeGreaterThan(20)
    for (const w of ENGLISH_WORDS) {
      expect(w.word.length).toBeGreaterThan(0)
      expect(w.phonetic.length).toBeGreaterThan(0)
      expect(w.meaning.length).toBeGreaterThan(0)
      expect(w.sentence.length).toBeGreaterThan(0)
    }
  })

  it('按年级筛选与按词查找', () => {
    expect(wordsByGrade(1).length).toBeGreaterThan(0)
    expect(wordsByGrade(2).length).toBeGreaterThan(0)
    expect(wordByName('apple')?.meaning).toBe('苹果')
    expect(wordByName('notexist')).toBeUndefined()
  })
})

describe('英语引擎', () => {
  it('生成单词卡与听写任务', () => {
    const card = nextEnglishTask('card', 1)
    expect(card.subject).toBe('english')
    expect(card.answer).toBe(card.word)
    const dictation = nextEnglishTask('dictation', 1)
    expect(dictation.prompt).toContain(dictation.meaning)
  })

  it('判题大小写不敏感', () => {
    const task = nextEnglishTask('dictation', 1)
    expect(checkEnglish(task, task.answer.toUpperCase())).toBe(true)
    expect(checkEnglish(task, 'wrong')).toBe(false)
  })

  it('记录与复习提取', () => {
    const task = nextEnglishTask('dictation', 1)
    const record = makeEnglishRecord(task, 'wrong', 500)
    expect(record.subject).toBe('english')
    expect(record.errorType).toBe('spelling')
    expect(englishReviewWords([record])).toEqual([task.word])
  })
})
