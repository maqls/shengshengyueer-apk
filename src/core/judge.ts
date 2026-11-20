import type { AnswerRecord, Question } from './types'
import { uid } from './random'

export function checkAnswer(question: Question, userAnswer: number | null): boolean {
  return userAnswer !== null && Number.isFinite(userAnswer) && userAnswer === question.answer
}

export function makeRecord(
  question: Question,
  userAnswer: number | null,
  elapsedMs: number
): AnswerRecord {
  const correct = checkAnswer(question, userAnswer)
  return {
    id: uid(),
    questionId: question.id,
    templateId: question.templateId,
    subject: 'math',
    knowledge: question.knowledge.slice(),
    correct,
    userAnswer,
    answer: question.answer,
    prompt: question.text,
    elapsedMs,
    at: Date.now(),
    errorType: correct ? undefined : 'calculation'
  }
}
