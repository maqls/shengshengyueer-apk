import type { BankQuestion } from './question-bank'
import type { Subject } from './types'

export interface ExamQuestion extends BankQuestion {
  year: number
  category: string
  source: string
}

/** 内置历年高考真题（GAOKAO-Bench 开源数据集，2010-2022），按需加载 */
let cached: ExamQuestion[] | null = null
export async function loadExamBank(): Promise<ExamQuestion[]> {
  if (!cached) {
    const mod = await import('../data/gaokao-exam.json')
    cached = mod.default as ExamQuestion[]
  }
  return cached
}

export interface ExamFilter {
  subject?: Subject
  year?: number
  grade?: number
}

/** 按学科/年份/年级筛真题 */
export async function examQuestions(filter: ExamFilter = {}): Promise<ExamQuestion[]> {
  const bank = await loadExamBank()
  return bank.filter((q) => {
    if (filter.subject && q.subject !== filter.subject) return false
    if (filter.year !== undefined && q.year !== filter.year) return false
    if (filter.grade !== undefined && !q.grades.includes(filter.grade)) return false
    return true
  })
}

/** 真题库可用年份（降序） */
export async function examYears(): Promise<number[]> {
  const bank = await loadExamBank()
  return Array.from(new Set(bank.map((q) => q.year))).sort((a, b) => b - a)
}

/** 随机取一道真题，可排除已出题 */
export async function nextExam(
  filter: ExamFilter = {},
  excludeIds: string[] = [],
  random: () => number = Math.random
): Promise<ExamQuestion | null> {
  const pool = (await examQuestions(filter)).filter((q) => !excludeIds.includes(q.id))
  if (!pool.length) return null
  return pool[Math.floor(random() * pool.length)]
}

/** 随机取题（内置库 + 本地增量库），excludeIds 排除已出过的 */
export async function nextExamWithLocal(
  filter: ExamFilter = {},
  excludeIds: string[] = [],
  local: ExamQuestion[] = [],
  random: () => number = Math.random
): Promise<ExamQuestion | null> {
  const pool = (await examQuestions(filter)).concat(local).filter((q) => {
    if (excludeIds.includes(q.id)) return false
    if (filter.subject && q.subject !== filter.subject) return false
    if (filter.year !== undefined && q.year !== filter.year) return false
    return true
  })
  if (!pool.length) return null
  return pool[Math.floor(random() * pool.length)]
}

/** 从题干文本中分离 A/B/C/D 选项，返回纯题干与选项数组 */
export function splitOptions(text: string): { prompt: string; options: string[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const options: string[] = []
  const promptLines: string[] = []
  const optRe = /([A-D])[.、．:：]\s*/
  for (const line of lines) {
    const matches = [...line.matchAll(new RegExp(optRe, 'g'))]
    const valid = matches.filter((m) => m.index === 0 || /[\s\n]/.test(line.slice(Math.max(0, m.index - 2), m.index)))
    if (valid.length >= 2) {
      for (let i = 0; i < valid.length; i++) {
        const content = line.slice(valid[i].index! + valid[i][0].length, i + 1 < valid.length ? valid[i + 1].index! : line.length).trim()
        if (content) options.push(`${valid[i][1]}. ${content}`)
      }
    } else if (valid.length === 1 && /^[A-D][.、．:：]/.test(line)) {
      options.push(line)
    } else {
      promptLines.push(line)
    }
  }
  return { prompt: promptLines.join('\n'), options }
}

/** 按 id 合并外部导入的真题并去重（供「更新真题库」使用） */
export function mergeExamQuestions(
  existing: ExamQuestion[],
  incoming: ExamQuestion[]
): { items: ExamQuestion[]; added: number } {
  const byId = new Map(existing.map((q) => [q.id, q]))
  let added = 0
  for (const q of incoming) {
    if (byId.has(q.id)) continue
    byId.set(q.id, q)
    added++
  }
  return { items: Array.from(byId.values()), added }
}
