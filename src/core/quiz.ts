import { bankQuestions, checkBankAnswer, type BankQuestion } from './question-bank'
import { pick, uid } from './random'
import type { AnswerRecord, Subject } from './types'

export interface QuizTask {
  id: string
  subject: Subject
  kind: BankQuestion['kind']
  prompt: string
  options?: string[]
  answer: string
  explain: string
  knowledge: string
  grades: number[]
}

function toTask(item: BankQuestion): QuizTask {
  return {
    id: item.id,
    subject: item.subject,
    kind: item.kind,
    prompt: item.prompt,
    options: item.options ? item.options.slice() : undefined,
    answer: item.answer,
    explain: item.explain,
    knowledge: item.knowledge,
    grades: item.grades.slice()
  }
}

export function nextQuiz(
  subject?: Subject | Subject[],
  grade?: number | number[],
  excludeIds: string[] = []
): QuizTask | null {
  const subjects = subject === undefined ? undefined : Array.isArray(subject) ? subject : [subject]
  const grades = grade === undefined ? undefined : Array.isArray(grade) ? grade : [grade]
  let pool = bankQuestions()
  if (subjects) pool = pool.filter((q) => subjects.includes(q.subject))
  if (grades) pool = pool.filter((q) => q.grades.some((g) => grades.includes(g)))
  const filtered = pool.filter((q) => !excludeIds.includes(q.id))
  if (filtered.length) pool = filtered
  if (!pool.length) {
    pool = bankQuestions()
    if (subjects) pool = pool.filter((q) => subjects.includes(q.subject))
  }
  if (!pool.length) return null
  return toTask(pick(pool))
}

export function checkQuiz(task: QuizTask, userAnswer: string): boolean {
  return checkBankAnswer(
    { id: task.id, subject: task.subject, grades: task.grades, kind: task.kind,
      prompt: task.prompt, options: task.options, answer: task.answer,
      explain: task.explain, knowledge: task.knowledge },
    userAnswer
  )
}

export function makeQuizRecord(
  task: QuizTask,
  userAnswer: string,
  elapsedMs: number
): AnswerRecord {
  const correct = checkQuiz(task, userAnswer)
  return {
    id: uid(),
    questionId: task.id,
    templateId: `quiz_${task.subject}`,
    subject: task.subject,
    knowledge: [task.knowledge],
    correct,
    userAnswer,
    answer: task.answer,
    prompt: task.prompt,
    elapsedMs,
    at: Date.now(),
    errorType: correct ? undefined : 'recall'
  }
}
