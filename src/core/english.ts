import { ENGLISH_WORDS, wordsByGrade, type EnglishWord } from './english-data'
import { pick, uid } from './random'
import type { AnswerRecord } from './types'

export type EnglishMode = 'card' | 'dictation'

export interface EnglishTask {
  id: string
  subject: 'english'
  mode: EnglishMode
  word: string
  phonetic: string
  meaning: string
  grade: number
  sentence: string
  answer: string
  prompt: string
}

function toTask(item: EnglishWord, mode: EnglishMode): EnglishTask {
  return {
    id: uid(),
    subject: 'english',
    mode,
    word: item.word,
    phonetic: item.phonetic,
    meaning: item.meaning,
    grade: item.grade,
    sentence: item.sentence,
    answer: item.word,
    prompt:
      mode === 'dictation' ? `听读音，写出单词（中文提示：${item.meaning}）` : `认识这个单词：${item.word}`,
  }
}

export function nextEnglishTask(
  mode: EnglishMode,
  grade: number | undefined = undefined,
  excludeWords: string[] = []
): EnglishTask {
  let pool = grade === undefined ? ENGLISH_WORDS : wordsByGrade(grade)
  if (!pool.length) {
    for (let g = (grade ?? 1) - 1; g >= 0 && !pool.length; g--) {
      pool = wordsByGrade(g)
    }
  }
  if (!pool.length) pool = ENGLISH_WORDS
  const filtered = pool.filter((w) => !excludeWords.includes(w.word))
  const source = filtered.length ? filtered : pool
  return toTask(pick(source), mode)
}

export function checkEnglish(task: EnglishTask, userAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === task.answer.toLowerCase()
}

export function makeEnglishRecord(
  task: EnglishTask,
  userAnswer: string,
  elapsedMs: number
): AnswerRecord {
  const correct = checkEnglish(task, userAnswer)
  return {
    id: uid(),
    questionId: task.id,
    templateId: `english_${task.mode}`,
    subject: 'english',
    knowledge: [`english:${task.word}`],
    correct,
    userAnswer,
    answer: task.answer,
    prompt: task.prompt,
    elapsedMs,
    at: Date.now(),
    errorType: correct ? undefined : task.mode === 'dictation' ? 'spelling' : 'recall'
  }
}

export function englishReviewWords(records: AnswerRecord[], limit = 5): string[] {
  const wrong = records
    .filter((r) => r.subject === 'english' && !r.correct)
    .map((r) => String(r.answer))
  return Array.from(new Set(wrong)).slice(0, limit)
}
