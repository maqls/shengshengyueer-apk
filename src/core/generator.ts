import { evaluate, render, safeConstraint } from './expression'
import { pick, randInt, shuffle, uid } from './random'
import { TEMPLATES, templateById } from './templates'
import type { Difficulty, Question, QuestionTemplate } from './types'

const MAX_ATTEMPTS = 60

function generateParams(template: QuestionTemplate): Record<string, number> {
  const values: Record<string, number> = {}
  for (const [key, range] of Object.entries(template.params)) {
    values[key] = randInt(range.min, range.max, range.step ?? 1)
  }
  return values
}

function isValid(template: QuestionTemplate, values: Record<string, number>): boolean {
  if (template.constraint && !safeConstraint(template.constraint, values)) return false
  const answer = evaluate(template.answer, values)
  return Number.isFinite(answer) && Number.isInteger(answer)
}

function buildQuestion(template: QuestionTemplate, values: Record<string, number>): Question {
  const answer = evaluate(template.answer, values)
  const question: Question = {
    id: uid(),
    templateId: template.id,
    knowledge: template.knowledge.slice(),
    difficulty: template.difficulty,
    type: template.type,
    text: render(template.question, values),
    answer,
    values,
    explainPrompt: render(template.explainPrompt, values),
    fallbackExplain: render(template.fallbackExplain, values)
  }
  if (template.type === 'choice') {
    const distractors = (template.distractors ?? []).map((d) => evaluate(d, values))
    question.options = shuffle([answer, ...distractors.filter((v) => v !== answer && Number.isFinite(v))])
  }
  return question
}

export function generateFromTemplate(templateId: string): Question {
  const template = templateById(templateId)
  if (!template) throw new Error(`模板不存在: ${templateId}`)
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const values = generateParams(template)
    if (isValid(template, values)) return buildQuestion(template, values)
  }
  throw new Error(`模板 ${templateId} 无法在 ${MAX_ATTEMPTS} 次内生成合法题目`)
}

export interface QuestionFilter {
  grade?: number
  difficulty?: Difficulty
  knowledge?: string[]
  templateIds?: string[]
}

export function generateQuestion(filter: QuestionFilter = {}): Question {
  let pool = TEMPLATES
  if (filter.grade !== undefined) {
    const exact = TEMPLATES.filter((t) => t.grade === filter.grade)
    // 该年级无模板时向下就近回退，避免无题可用
    if (exact.length) {
      pool = exact
    } else {
      for (let g = filter.grade - 1; g >= 0 && pool === TEMPLATES; g--) {
        const lower = TEMPLATES.filter((t) => t.grade === g)
        if (lower.length) pool = lower
      }
    }
  }
  if (filter.difficulty !== undefined) {
    const byDiff = pool.filter((t) => t.difficulty === filter.difficulty)
    if (byDiff.length) pool = byDiff
  }
  if (filter.knowledge?.length) {
    const byK = pool.filter((t) => filter.knowledge!.some((k) => t.knowledge.includes(k)))
    if (byK.length) pool = byK
  }
  if (filter.templateIds?.length) {
    pool = pool.filter((t) => filter.templateIds!.includes(t.id))
  }
  if (!pool.length) throw new Error('没有符合筛选条件的题模板')
  return generateFromTemplate(pick(pool).id)
}

export function generateSet(count: number, filter: QuestionFilter = {}): Question[] {
  const out: Question[] = []
  let guard = 0
  while (out.length < count && guard++ < count * 20) {
    try {
      const q = generateQuestion(filter)
      if (!out.some((x) => x.text === q.text)) out.push(q)
    } catch {
      break
    }
  }
  return out
}
