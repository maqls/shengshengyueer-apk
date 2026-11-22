import { store as db } from '../storage/db'
import { splitOptions, type ExamQuestion } from './exam-bank'
import { httpRequest, parseJson } from '../llm/http'
import { loadExamBank } from './exam-bank'

/** 增量真题数据源（GAOKAO-Bench-Updates 开源仓库，2023/2024 分学科 JSON = 一份卷子） */
const BASE = 'https://raw.githubusercontent.com/OpenLMLab/GAOKAO-Bench-Updates/main/Data'
const SUBJECTS = ['Math', 'Chinese_Lang_and_Usage', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Political_Science']
const SOURCES = ['2023', '2024'].flatMap((year) =>
  SUBJECTS.map((s) => ({ url: `${BASE}/GAOKAO-Bench-${year}/${year}_${s}_MCQs.json`, year: Number(year), subject: s }))
)

/** 卷型标准化：去括号/空白/文科理科后缀，让「（全国甲卷）」与「全国甲卷理科」视为同一卷 */
function normalizeCategory(category: string): string {
  return category.replace(/[（）()\s]/g, '').replace(/文科|理科|卷/g, '')
}

/** 卷子唯一标识：年份 + 卷型 + 学科（同一份卷子只入库一次） */
function paperKey(year: number, category: string, subject: string): string {
  return `${year}|${normalizeCategory(category)}|${subject}`
}

/**
 * 手动更新真题库：按「整份卷子」去重。
 * 若某份卷子（年份+卷型+学科）在内置库或本地库已存在，整份跳过；否则整份入库。
 * 返回 { added, skipped, total, error }。
 */
export async function updateExamBank(): Promise<{
  added: number
  skipped: number
  total: number
  error?: string
}> {
  const builtin = await loadExamBank()
  const local = await db.getExamPapers()
  // 已有的卷子集合：内置 + 本地
  const existingPapers = new Set<string>()
  for (const q of builtin) existingPapers.add(paperKey(q.year, q.category, q.subject))
  for (const q of local) existingPapers.add(paperKey(q.year, q.category, q.subject))

  let added = 0
  let skipped = 0
  let failed = 0
  const seenThisRun = new Set<string>()

  for (const src of SOURCES) {
    try {
      const res = await httpRequest(src.url, { timeoutMs: 30000 })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = parseJson<{ example?: unknown[] } | unknown[]>(res)
      const items = Array.isArray(data) ? data : (data.example ?? [])
      if (!items.length) continue

      // 这份卷子的题先全部解析出来，确认卷型
      const parsed: ExamQuestion[] = []
      for (const raw of items) {
        const q = normalize(raw, src.year, src.subject)
        if (q) parsed.push(q)
      }
      if (!parsed.length) continue

      // 用第一题的卷型代表整份卷子
      const category = parsed[0].category
      const key = paperKey(src.year, category, parsed[0].subject)
      // 已存在（内置或本地）或本次已处理过 -> 整份跳过
      if (existingPapers.has(key) || seenThisRun.has(key)) {
        skipped += parsed.length
        continue
      }
      seenThisRun.add(key)
      existingPapers.add(key)
      added += await db.saveExamPapers(parsed)
    } catch {
      failed++
    }
  }
  return {
    added,
    skipped,
    total: await db.examPaperCount(),
    error: failed ? `${failed} 个来源拉取失败` : undefined
  }
}

/** 把外部 JSON 条目规整为 ExamQuestion（字段缺失则跳过） */
function normalize(raw: unknown, fallbackYear: number, subjectKey: string): ExamQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const year = Number(String(r.year ?? '').match(/20\d{2}/)?.[0]) || fallbackYear
  const question = String(r.question ?? '')
  const parsed = splitOptions(question)
  const options = Array.isArray(r.options)
    ? r.options.filter((o): o is string => typeof o === 'string')
    : parsed.options
  if (options.length < 2 || !parsed.prompt || r.answer === undefined) return null
  const rawAnswer = Array.isArray(r.answer) ? String(r.answer[0] ?? '') : String(r.answer)
  const letter = rawAnswer.match(/^[A-D]/)?.[0]
  const answer = letter
    ? (options.find((o) => o.startsWith(letter)) ?? '')
    : (options.includes(rawAnswer) ? rawAnswer : '')
  if (!answer) return null
  const subjectMap: Record<string, string> = {
    Math: 'math', Chinese_Lang_and_Usage: 'chinese', Chinese_Modern_Lit: 'chinese',
    English: 'english', Physics: 'science', Chemistry: 'science', Biology: 'science',
    History: 'history', Geography: 'geography', Political_Science: 'thinking'
  }
  const subject = (subjectMap[subjectKey] ?? 'math') as ExamQuestion['subject']
  return {
    id: `update-${year}-${subjectKey}-${String(r.index ?? '').replace(/\W/g, '')}`,
    subject,
    kind: 'choice',
    prompt: parsed.prompt,
    options,
    answer,
    explain: typeof r.analysis === 'string' ? r.analysis : '暂无解析',
    knowledge: `真题:${subject}:${year}:${String(r.category ?? '')}`,
    grades: [10, 11, 12],
    year,
    category: typeof r.category === 'string' ? r.category : '',
    source: 'GAOKAO-Bench-Updates'
  }
}
