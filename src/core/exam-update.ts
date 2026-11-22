import { store as db } from '../storage/db'
import { splitOptions, type ExamQuestion } from './exam-bank'
import { httpRequest, parseJson } from '../llm/http'

/** 增量真题数据源（GAOKAO-Bench-Updates 开源仓库，2023/2024 分学科 JSON） */
const BASE = 'https://raw.githubusercontent.com/OpenLMLab/GAOKAO-Bench-Updates/main/Data'
const SUBJECTS = ['Math', 'Chinese_Lang_and_Usage', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Political_Science']
const SOURCES = ['2023', '2024'].flatMap((year) =>
  SUBJECTS.map((s) => ({ url: `${BASE}/GAOKAO-Bench-${year}/${year}_${s}_MCQs.json`, year: Number(year), subject: s }))
)

/**
 * 手动更新真题库：拉取远程真题 JSON，按 id 去重后存本地 IndexedDB。
 * 返回 { added, total, error }，供 UI 显示结果。
 */
export async function updateExamBank(): Promise<{ added: number; total: number; error?: string }> {
  let all: ExamQuestion[] = []
  let failed = 0
  for (const src of SOURCES) {
    try {
      const res = await httpRequest(src.url, { timeoutMs: 30000 })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = parseJson<{ example?: unknown[] } | unknown[]>(res)
      const items = Array.isArray(data) ? data : (data.example ?? [])
      for (const raw of items) {
        const q = normalize(raw, src.year, src.subject)
        if (q) all.push(q)
      }
    } catch {
      failed++
    }
  }
  if (!all.length) {
    return { added: 0, total: await db.examPaperCount(), error: failed ? `${failed} 个来源拉取失败` : '远程暂无新真题' }
  }
  const added = await db.saveExamPapers(all)
  return { added, total: await db.examPaperCount(), error: failed ? `${failed} 个来源拉取失败` : undefined }
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
  return {
    id: `update-${year}-${subjectKey}-${String(r.index ?? '').replace(/\W/g, '')}`,
    subject: (subjectMap[subjectKey] ?? 'math') as ExamQuestion['subject'],
    kind: 'choice',
    prompt: parsed.prompt,
    options,
    answer,
    explain: typeof r.analysis === 'string' ? r.analysis : '暂无解析',
    knowledge: `真题更新:${year}`,
    grades: [10, 11, 12],
    year,
    category: typeof r.category === 'string' ? r.category : '',
    source: 'GAOKAO-Bench-Updates'
  }
}
