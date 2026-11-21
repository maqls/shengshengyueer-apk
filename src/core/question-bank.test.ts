import { describe, it, expect } from 'vitest'
import {
  BANK, bankQuestions, availableGrades, checkBankAnswer, SUBJECT_LABELS
} from './question-bank'
import { nextQuiz, checkQuiz, makeQuizRecord } from './quiz'
import type { Subject } from './types'

describe('通用题库', () => {
  it('覆盖多学科', () => {
    const subjects = new Set(BANK.map((q) => q.subject))
    const expected: Subject[] = ['math', 'chinese', 'english', 'science', 'history', 'geography', 'thinking']
    for (const s of expected) expect(subjects.has(s)).toBe(true)
  })

  it('覆盖全学段（学前到博士）', () => {
    const grades = availableGrades()
    expect(grades).toContain(0)
    expect(grades).toContain(1)
    expect(grades).toContain(6)
    expect(grades).toContain(9)
    expect(grades).toContain(12)
    expect(grades).toContain(16)
    expect(grades).toContain(18)
    expect(grades).toContain(22)
  })

  it('每道题字段完整', () => {
    for (const q of BANK) {
      expect(q.id).toBeTruthy()
      expect(q.prompt.length).toBeGreaterThan(0)
      expect(q.answer.length).toBeGreaterThan(0)
      expect(q.explain.length).toBeGreaterThan(0)
      expect(q.grades.length).toBeGreaterThan(0)
      expect(q.knowledge.length).toBeGreaterThan(0)
      if (q.kind === 'choice') expect(q.options && q.options.length >= 2).toBe(true)
    }
  })

  it('学科与年级筛选', () => {
    const math = bankQuestions({ subject: 'math' })
    expect(math.length).toBeGreaterThan(0)
    expect(math.every((q) => q.subject === 'math')).toBe(true)
    const g9 = bankQuestions({ grade: 9 })
    expect(g9.length).toBeGreaterThan(0)
    expect(g9.every((q) => q.grades.includes(9))).toBe(true)
  })

  it('判题：选择题/填空题', () => {
    const choice = BANK.find((q) => q.kind === 'choice')!
    const fill = BANK.find((q) => q.kind === 'fill')!
    expect(checkBankAnswer(choice, choice.answer)).toBe(true)
    expect(checkBankAnswer(choice, '错误答案选项')).toBe(false)
    expect(checkBankAnswer(fill, ` ${fill.answer} `)).toBe(true)
  })

  it('学科标签齐全', () => {
    for (const q of BANK) expect(SUBJECT_LABELS[q.subject]).toBeTruthy()
  })
})

describe('通用练习引擎', () => {
  it('按学科+年级出题', () => {
    const task = nextQuiz('science', 3)
    expect(task).not.toBeNull()
    expect(task!.subject).toBe('science')
    expect(task!.grades).toContain(3)
  })

  it('不限条件出题', () => {
    const task = nextQuiz()
    expect(task).not.toBeNull()
  })

  it('排除已出题', () => {
    const first = nextQuiz('math', 7)!
    const second = nextQuiz('math', 7, [first.id])!
    expect(second.id).not.toBe(first.id)
  })

  it('判题与记录', () => {
    const task = nextQuiz('chinese')!
    expect(checkQuiz(task, task.answer)).toBe(true)
    const record = makeQuizRecord(task, task.answer, 1000)
    expect(record.correct).toBe(true)
    expect(record.subject).toBe(task.subject)
    expect(record.knowledge).toEqual([task.knowledge])
  })
})
