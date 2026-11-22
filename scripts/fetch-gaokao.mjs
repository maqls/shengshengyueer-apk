/**
 * 从 GAOKAO-Bench 开源数据集拉取历年高考真题，转换成 App 题库结构。
 * 数据源（均为开源评测数据集，公开可下载）：
 *   - OpenLMLab/GAOKAO-Bench          2010-2022
 *   - OpenLMLab/GAOKAO-Bench-Updates  2023+
 * 用法：node scripts/fetch-gaokao.mjs [输出文件]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const OUT = process.argv[2] || 'src/data/gaokao-exam.json'
const RAW = 'https://raw.githubusercontent.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 仓库 -> 客观题文件 -> 学科映射
const SOURCES = [
  {
    repo: 'OpenLMLab/GAOKAO-Bench',
    branch: 'main',
    dir: 'Data/Objective_Questions',
    files: [
      ['2010-2022_Math_I_MCQs.json', 'math'],
      ['2010-2022_Math_II_MCQs.json', 'math'],
      ['2010-2022_Chinese_Lang_and_Usage_MCQs.json', 'chinese'],
      ['2010-2022_Chinese_Modern_Lit.json', 'chinese'],
      ['2010-2022_English_MCQs.json', 'english'],
      ['2010-2022_English_Cloze_Test.json', 'english'],
      ['2010-2022_English_Reading_Comp.json', 'english'],
      ['2010-2022_English_Fill_in_Blanks.json', 'english'],
      ['2010-2022_Physics_MCQs.json', 'science'],
      ['2010-2022_Chemistry_MCQs.json', 'science'],
      ['2010-2022_Biology_MCQs.json', 'science'],
      ['2010-2022_History_MCQs.json', 'history'],
      ['2010-2022_Geography_MCQs.json', 'geography'],
      ['2010-2022_Political_Science_MCQs.json', 'thinking']
    ]
  }
]

async function getJson(url) {
  let last
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(40000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      last = e
      await sleep(2000)
    }
  }
  throw last
}

// 从题干文本中分离选项：支持一行一个，也支持一行多个（A. xx  B. xx）
function parseQuestion(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const options = []
  const promptLines = []
  const optRe = /([A-D])[.、．:：]\s*/
  for (const line of lines) {
    const matches = [...line.matchAll(new RegExp(optRe, 'g'))]
    const valid = matches.filter((m) => {
      const start = m.index
      const before = start === 0 ? '' : line.slice(Math.max(0, start - 2), start)
      return start === 0 || /[\s\n]/.test(before)
    })
    if (valid.length >= 2) {
      for (let i = 0; i < valid.length; i++) {
        const m = valid[i]
        const content = line.slice(m.index + m[0].length, i + 1 < valid.length ? valid[i + 1].index : line.length).trim()
        if (content) options.push(`${m[1]}. ${content}`)
      }
    } else if (valid.length === 1 && /^[A-D][.、．:：]/.test(line)) {
      options.push(line)
    } else {
      promptLines.push(line)
    }
  }
  const letters = options.map((o) => o[0])
  return { prompt: promptLines.join('\n'), options, letters }
}

// 答案数组 -> 选项文本（只取单个字母，多选题跳过）
function answerFrom(raw, options, letters) {
  const first = Array.isArray(raw) ? raw[0] : raw
  if (first === undefined || first === null) return null
  const s = String(first).trim()
  const lettersFound = s.match(/[A-D]/g) ?? []
  if (lettersFound.length === 1) {
    const idx = letters.indexOf(lettersFound[0])
    return idx >= 0 ? options[idx] : null
  }
  // 答案直接是完整选项文本且唯一匹配
  if (options.includes(s)) return s
  return null
}

async function main() {
  const all = []
  const seen = new Set()
  for (const src of SOURCES) {
    for (const [file, subject] of src.files) {
      const url = `${RAW}/${src.repo}/${src.branch}/${src.dir}/${file}`
      try {
        const data = await getJson(url)
        const items = data.example ?? []
        let kept = 0
        for (const item of items) {
          const year = Number(String(item.year ?? '').match(/20\d{2}/)?.[0])
          if (!year) continue
          const { prompt, options, letters } = parseQuestion(String(item.question ?? ''))
          if (options.length < 2 || !prompt) continue
          const answer = answerFrom(item.answer, options, letters)
          if (!answer || !options.includes(answer)) continue
          // 去重：年份+学科+题号+题干全文（避免前缀相同的题被误判重复）
          const dedupeKey = `${year}|${subject}|${item.index ?? ''}|${prompt.replace(/\s+/g, '')}`
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)
          all.push({
            id: `gk-${file.replace(/\W/g, '')}-${item.index ?? all.length}`,
            subject,
            kind: 'choice',
            prompt,
            options,
            answer,
            explain: String(item.analysis ?? '').trim() || '暂无解析',
            knowledge: `真题:${subject}:${year}:${item.category ?? ''}`,
            grades: [10, 11, 12],
            year,
            category: item.category ?? '',
            source: 'GAOKAO-Bench'
          })
          kept++
        }
        console.error(`${file}: ${items.length} -> 保留 ${kept}`)
        await sleep(200)
      } catch (e) {
        console.error(`失败 ${file}: ${e.message}`)
      }
    }
  }
  all.sort((a, b) => b.year - a.year)
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(all, null, 2), 'utf8')
  console.error(`完成：${all.length} 道真题 -> ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
