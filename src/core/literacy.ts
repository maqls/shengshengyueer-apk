import { LITERACY_CHARS, charsByGrade, type LiteracyChar } from './literacy-data'

import { pick, shuffle, uid } from './random'
import type { AnswerRecord } from './types'

export type LiteracyMode = 'card' | 'dictation'

export interface LiteracyTask {
  id: string
  subject: 'literacy'
  mode: LiteracyMode
  char: string
  pinyin: string
  grade: number
  words: string[]
  sentence: string
  answer: string
  prompt: string
}

function toTask(item: LiteracyChar, mode: LiteracyMode): LiteracyTask {
  return {
    id: uid(),
    subject: 'literacy',
    mode,
    char: item.char,
    pinyin: item.pinyin,
    grade: item.grade,
    words: item.words.slice(),
    sentence: item.sentence,
    answer: item.char,
    prompt: mode === 'dictation' ? `听读音，写出汉字：${item.pinyin}` : `认识这个字：${item.char}`,
  }
}

export function nextLiteracyTask(
  mode: LiteracyMode,
  grade: number | undefined = undefined,
  excludeIds: string[] = []
): LiteracyTask {
  let pool = grade === undefined ? LITERACY_CHARS : charsByGrade(grade)
  if (!pool.length) {
    // 向下就近回退：选高年级但该年级无字时，用最近低年级的字
    for (let g = (grade ?? 1) - 1; g >= 0 && !pool.length; g--) {
      pool = charsByGrade(g)
    }
  }
  if (!pool.length) pool = LITERACY_CHARS
  const filtered = pool.filter((c) => !excludeIds.includes(c.char))
  const source = filtered.length ? filtered : pool
  return toTask(pick(source), mode)
}

export function checkLiteracy(task: LiteracyTask, userAnswer: string): boolean {
  return userAnswer.trim() === task.answer
}

export function makeLiteracyRecord(
  task: LiteracyTask,
  userAnswer: string,
  elapsedMs: number
): AnswerRecord {
  const correct = checkLiteracy(task, userAnswer)
  return {
    id: uid(),
    questionId: task.id,
    templateId: `literacy_${task.mode}`,
    subject: 'literacy',
    knowledge: [`literacy:${task.char}`],
    correct,
    userAnswer,
    answer: task.answer,
    prompt: task.prompt,
    elapsedMs,
    at: Date.now(),
    errorType: correct ? undefined : task.mode === 'dictation' ? 'spelling' : 'recall'
  }
}

export function literacyReviewChars(records: AnswerRecord[], limit = 5): string[] {
  const wrong = records
    .filter((r) => r.subject === 'literacy' && !r.correct)
    .map((r) => String(r.answer))
  return Array.from(new Set(wrong)).slice(0, limit)
}

export function allCharCount(): number {
  return LITERACY_CHARS.length
}
