import type { AnswerRecord, Mastery, Question, QuestionTemplate } from './types'
import { TEMPLATES } from './templates'
import { generateFromTemplate } from './generator'
import { uid } from './random'

const DAY = 24 * 60 * 60 * 1000

export interface ReviewItem {
  record: AnswerRecord
  dueAt: number
  repetitions: number
}

export function nextInterval(repetitions: number, mastery: number): number {
  const base = [1, 2, 4, 7, 15][Math.min(repetitions, 4)]
  const factor = mastery >= 0.8 ? 1.5 : 1
  return base * DAY * factor
}

export function buildReviewItems(
  records: AnswerRecord[],
  masteries: Record<string, Mastery>,
  now = Date.now()
): ReviewItem[] {
  const wrongByTemplate = new Map<string, AnswerRecord>()
  for (const record of records) {
    if (!record.correct) wrongByTemplate.set(record.templateId, record)
  }
  const templateMastery = (t: QuestionTemplate): number => {
    if (!t.knowledge.length) return 0.5
    return t.knowledge.reduce((sum, k) => sum + (masteries[k]?.value ?? 0.15), 0) / t.knowledge.length
  }
  return Array.from(wrongByTemplate.values())
    .map((record) => {
      const template = TEMPLATES.find((t) => t.id === record.templateId)
      const repetitions = records.filter((r) => r.templateId === record.templateId).length
      const mastery = template ? templateMastery(template) : 0.15
      return {
        record,
        repetitions,
        dueAt: record.at + nextInterval(repetitions, mastery),
        mastery
      }
    })
    .filter((item) => item.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .map(({ record, repetitions, dueAt }) => ({ record, repetitions, dueAt }))
}

export function makeVariant(question: Question): Question {
  const variant = generateFromTemplate(question.templateId)
  return { ...variant, id: uid() }
}
