import type { LLMProvider } from './provider'
import type { Subject } from '../core/types'
import type { QuizTask } from '../core/quiz'
import { SUBJECT_LABELS, GRADE_LABELS } from '../core/question-bank'
import { uid } from '../core/random'

interface GeneratedQuestion {
  kind: 'choice' | 'judge' | 'fill'
  prompt: string
  options?: string[]
  answer: string
  explain: string
  knowledge: string
}

function extractJson(text: string): string {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('未找到 JSON 对象')
  return clean.slice(start, end + 1)
}

export function parseGeneratedQuestion(raw: string, subject: Subject, grade?: number): QuizTask | null {
  try {
    const obj = JSON.parse(extractJson(raw)) as Record<string, unknown>
    const kind = obj.kind
    const prompt = obj.prompt
    const answer = obj.answer
    const explain = obj.explain
    if (kind !== 'choice' && kind !== 'judge' && kind !== 'fill') return null
    if (typeof prompt !== 'string' || !prompt.trim()) return null
    if (typeof answer !== 'string' || !answer.trim()) return null
    if (typeof explain !== 'string' || !explain.trim()) return null

    let options: string[] | undefined
    if (kind === 'choice') {
      if (!Array.isArray(obj.options) || obj.options.length < 2) return null
      options = (obj.options as unknown[]).filter((x): x is string => typeof x === 'string')
      if (options.length < 2) return null
      if (!options.includes(answer)) return null
    } else if (kind === 'judge') {
      if (answer !== '对' && answer !== '错') return null
      options = ['对', '错']
    }

    const knowledge = typeof obj.knowledge === 'string' && obj.knowledge.trim()
      ? obj.knowledge.trim()
      : `${subject}:模型生成`

    return {
      id: `ai-${uid()}`,
      subject,
      kind,
      prompt: prompt.trim(),
      options,
      answer: answer.trim(),
      explain: explain.trim(),
      knowledge,
      grades: grade === undefined ? [] : [grade]
    }
  } catch {
    return null
  }
}

export interface GenerateResult {
  task: QuizTask | null
  provider: string
  reason: string
}

export async function generateQuizByLLM(
  providers: LLMProvider[],
  subject: Subject | undefined,
  grade: number | undefined,
  excludePrompts: string[] = []
): Promise<GenerateResult> {
  const subjectName = subject ? SUBJECT_LABELS[subject] : '各学科综合'
  const gradeName = grade === undefined ? '不限年级（覆盖小学到初中）' : (GRADE_LABELS[grade] ?? `${grade}年级`)

  const system = [
    '你是一位耐心的中小学老师，为学生的练习题生成服务。',
    '只输出一个 JSON 对象，不要输出任何解释文字、不要 markdown 代码块、不要多余前后缀。',
    '题目要准确、适合学生年龄、有教育价值。'
  ].join('')

  const user = [
    `请出一道适合【${gradeName}】的【${subjectName}】练习题。`,
    'JSON 字段要求：',
    '- kind: 只能是 "choice"（选择题）、"judge"（判断题）、"fill"（填空题）之一',
    '- prompt: 题干文字',
    '- answer: 正确答案文字',
    '- explain: 简短清楚的解析（用学生能懂的话）',
    '- knowledge: 这道题考察的知识点名称',
    '- options: 只有当 kind 为 choice 时提供，字符串数组，至少 2 项，且 answer 必须等于其中一项',
    '注意：judge 题的 answer 只能是 "对" 或 "错"；fill 题不要 options 字段。',
    '只返回 JSON 本身。',
    excludePrompts.length ? `请避免与这些题重复：${excludePrompts.slice(-5).join(' | ')}` : ''
  ].filter(Boolean).join('\n')

  const reasons: string[] = []
  for (const provider of providers) {
    if (provider.name === 'fallback') continue
    try {
      const raw = await provider.complete(user, { timeoutMs: 30000, maxTokens: 600, system })
      const task = parseGeneratedQuestion(raw, subject ?? 'math', grade)
      if (!task) {
        reasons.push(`${provider.name}:返回格式无法解析`)
        continue
      }
      if (excludePrompts.includes(task.prompt)) {
        reasons.push(`${provider.name}:题目重复`)
        continue
      }
      return { task, provider: provider.name, reason: 'ok' }
    } catch (err) {
      reasons.push(`${provider.name}:${err instanceof Error ? err.message : '调用失败'}`)
      continue
    }
  }
  return { task: null, provider: '', reason: reasons.join('；') || '未配置模型' }
}
