/**
 * 组卷网（zujuan.com）题目爬虫
 *
 * 实测：列表页 /question? 不登录即可见完整题干；详情页 /question/detail-*.shtml 需登录才见答案。
 * 合规：仅抓列表页公开题干；有 Cookie 时才请求详情页补答案，不抓解析版权正文。
 *
 * Cookie（可选，用于补答案）：环境变量 ZJ_COOKIE 或 --cookie-file cookie.txt
 * 用法：
 *   node scripts/crawl-zujuan.mjs 输出.json 每学科页数
 *   node scripts/crawl-zujuan.mjs 输出.json 3 --cookie-file cookie.txt
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

const OUT = process.argv[2] || 'src/data/zujuan-exam.json'
const PAGES_PER_SUBJECT = Number(process.argv[3] || 3)
const BASE = 'https://www.zujuan.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const DELAY = 2500

const cookieFileIdx = process.argv.indexOf('--cookie-file')
const COOKIE = process.env.ZJ_COOKIE || (cookieFileIdx >= 0 && process.argv[cookieFileIdx + 1]
  ? readFileSync(process.argv[cookieFileIdx + 1], 'utf8').trim()
  : '')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Referer': BASE + '/',
          ...(COOKIE ? { Cookie: COOKIE } : {})
        },
        signal: AbortSignal.timeout(25000)
      })
      if (res.status === 403 || res.status === 429) {
        if (i === 2) throw new Error(`HTTP ${res.status}`)
        await sleep(8000 * (i + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (i === 2) throw e
      await sleep(2000)
    }
  }
}

/** MathML -> 可读文本（上标 x^2、下标 x_1、分式 a/b、根号 √x） */
function mathmlToText(mml) {
  let s = mml
    .replace(/<msup>([\s\S]*?)<\/msup>/g, (_, inner) => {
      const parts = [...inner.matchAll(/<m[irn][^>]*>([^<]*)<\/m[irn]>/g)].map((m) => m[1])
      return parts.length >= 2 ? `${parts[0]}^${parts[1]}` : parts.join('')
    })
    .replace(/<msub>([\s\S]*?)<\/msub>/g, (_, inner) => {
      const parts = [...inner.matchAll(/<m[irn][^>]*>([^<]*)<\/m[irn]>/g)].map((m) => m[1])
      return parts.length >= 2 ? `${parts[0]}_${parts[1]}` : parts.join('')
    })
    .replace(/<mfrac>([\s\S]*?)<\/mfrac>/g, (_, inner) => {
      const parts = [...inner.matchAll(/<m[irn][^>]*>([^<]*)<\/m[irn]>/g)].map((m) => m[1])
      return parts.length >= 2 ? `(${parts[0]}/${parts[1]})` : parts.join('')
    })
    .replace(/<msqrt>([\s\S]*?)<\/msqrt>/g, (_, inner) => `√${(inner.match(/<m[irn][^>]*>([^<]*)<\/m[irn]>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join('')}`)
    .replace(/<m[irn][^>]*>([^<]*)<\/m[irn]>/g, '$1')
    .replace(/<mo[^>]*>([^<]*)<\/mo>/g, '$1')
    .replace(/<[^>]+>/g, '')
  return s.trim()
}

function cleanHtml(html) {
  // 公式图片 -> MathML 文本
  let out = html.replace(/<img[^>]*class="mathml"[^>]*src="([^"]+)"[^>]*>/g, (_, src) => {
    const encoded = src.split('mml=')[1]
    if (!encoded) return ''
    try {
      return mathmlToText(decodeURIComponent(encoded.replace(/\+/g, ' ')))
    } catch {
      return ''
    }
  })
  out = out
    .replace(/<p>/g, '\n').replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  return out.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

// 学科配置：xd(1小学/2初中/3高中) -> [{chid, subject, label}]
const SUBJECTS = {
  1: [[2, 'chinese', '语文'], [3, 'math', '数学'], [4, 'english', '英语'], [5, 'science', '科学']],
  2: [[2, 'chinese', '语文'], [3, 'math', '数学'], [4, 'english', '英语'], [6, 'science', '物理'], [7, 'science', '化学'], [8, 'history', '历史'], [9, 'thinking', '道法'], [10, 'geography', '地理'], [11, 'science', '生物']],
  3: [[2, 'chinese', '语文'], [3, 'math', '数学'], [4, 'english', '英语'], [6, 'science', '物理'], [7, 'science', '化学'], [8, 'history', '历史'], [10, 'geography', '地理'], [11, 'science', '生物']]
}

function classifyGrades(xd) {
  return xd === '1' ? [1, 2, 3, 4, 5, 6] : xd === '2' ? [7, 8, 9] : [10, 11, 12]
}

// 列表页解析：题干 + 详情 id
function parseList(html) {
  const out = []
  const re = /<div class="question-block">([\s\S]*?)(?=<div class="question-block">|<\/ul>)/g
  for (const m of html.matchAll(re)) {
    const block = m[1]
    const tit = block.match(/<div class="q-tit">([\s\S]*?)<\/div>/)
    if (!tit) continue
    const prompt = cleanHtml(tit[1]).replace(/^\d+[.．]\s*/, '').replace(/^（[^）]*）\s*/, '')
    if (!prompt || prompt.length < 6) continue
    const detail = block.match(/href="(\/question\/detail-(\d+)\.shtml)"/)
    out.push({ prompt, detail: detail ? detail[1] : null, id: detail ? detail[2] : null })
  }
  return out
}

// 详情页补答案（需 Cookie）：从页面提取答案文本，只取答案不取解析
async function fetchAnswer(detail) {
  if (!COOKIE || !detail) return ''
  try {
    const html = await get(BASE + detail)
    await sleep(DELAY)
    if (html.includes('用户登录') && html.includes('login.min.css')) return ''
    const m = html.match(/(?:正确答案|【答案】|参考答案)[：:]?\s*([^<\n]{1,80})/)
    return m ? cleanHtml(m[1]).trim() : ''
  } catch {
    return ''
  }
}

async function main() {
  if (!COOKIE) console.error('提示：未提供 Cookie，只抓题干（答案留空）。用 --cookie-file 或 ZJ_COOKIE 补答案。')
  const all = []
  const seen = new Set()
  for (const [xd, subjects] of Object.entries(SUBJECTS)) {
    for (const [chid, subject, label] of subjects) {
      for (let page = 1; page <= PAGES_PER_SUBJECT; page++) {
        const url = `${BASE}/question?tree_type=category&xd=${xd}&chid=${chid}&page=${page}&per-page=10`
        try {
          const html = await get(url)
          const items = parseList(html)
          console.error(`${xd==='1'?'小学':xd==='2'?'初中':'高中'}/${label} 第${page}页: ${items.length}题`)
          for (const item of items) {
            const key = item.prompt.replace(/\s+/g, '').slice(0, 60)
            if (seen.has(key)) continue
            seen.add(key)
            const answer = await fetchAnswer(item.detail)
            // 无答案的题无法判分，不入库（用 Cookie 跑才会抓到答案）
            if (!answer) continue
            all.push({
              id: `zj-${item.id || key.slice(0, 12)}`,
              subject,
              kind: 'fill',
              prompt: item.prompt,
              answer,
              explain: '答案来自组卷网（解析原文不入库）',
              knowledge: `组卷网:${xd}:${label}`,
              grades: classifyGrades(xd),
              source: '组卷网'
            })
          }
          await sleep(DELAY)
        } catch (e) {
          console.error(`失败 ${url}: ${e.message}`)
        }
      }
    }
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(all, null, 2), 'utf8')
  console.error(`完成：${all.length} 题 -> ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
