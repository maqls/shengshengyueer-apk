/**
 * 菁优网（jyeoo.com）题目爬虫
 *
 * 合规说明：
 * - 仅抓取 robots.txt 明确 Allow 的 /sj/（试卷）与 /shiti/（试题）页面
 * - 遵守 robots.txt 禁止项：不碰 /api*、/seach*、/account/*、/physics/* 等
 * - 只取「题干 / 选项 / 答案 / 考点」；不抓取有版权声明的「解答 / 点评」原文
 * - 限速 800ms/请求，仅用于个人学习
 *
 * 用法：node scripts/crawl-jyeoo.mjs [输出文件] [抓几份试卷]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const OUT = process.argv[2] || 'src/data/jyeoo-exam.json'
const PAPER_LIMIT = Number(process.argv[3] || 30)
const BASE = 'https://www.jyeoo.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// 菁优网有频率限制，连续请求会 403；默认 3 秒/请求，建议只抓少量补充
const DELAY = 3000

function stripTags(html) {
  // MathJye 公式 DOM -> 可读文本（分式/上下标/根号近似还原）
  let out = html
    .replace(/<div class="mfrac">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="mrow">/g, '($1)/')
    .replace(/<div class="fracZi">([\s\S]*?)<\/div>/g, '$1')
    .replace(/<div class="fracMu">([\s\S]*?)<\/div>/g, '$1')
    .replace(/<div class="fracLine">[\s\S]*?<\/div>/g, '/')
    .replace(/<div class="math-letter">([^<]+)<\/div>/g, '$1')
    .replace(/<div class="mo">([^<]+)<\/div>/g, '$1')
    .replace(/<sup>([^<]*)<\/sup>/g, '^$1')
    .replace(/<sub>([^<]*)<\/sub>/g, '_$1')
  return out
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<sup>([^<]*)<\/sup>/gi, '$1')
    .replace(/<sub>([^<]*)<\/sub>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// 真实浏览器请求头 + 会话 Cookie（node fetch 不自动管理 cookie）
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
let cookie = ''

function headers(referer = BASE + '/') {
  return {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Referer': referer,
    ...(cookie ? { Cookie: cookie } : {})
  }
}

async function get(url, referer) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, {
        headers: headers(referer),
        redirect: 'follow',
        signal: AbortSignal.timeout(25000)
      })
      const setCookie = res.headers.get('set-cookie')
      if (setCookie) cookie = setCookie.split(';')[0]
      if (res.status === 403 || res.status === 429) {
        // 反爬退避：10s / 25s / 45s
        if (i === 3) throw new Error(`HTTP ${res.status}（反爬拦截）`)
        await sleep([0, 10000, 25000, 45000][i])
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (i === 3) throw e
      await sleep(3000)
    }
  }
}

// 先访问首页建立会话（模拟真人先打开网站）
async function initSession() {
  try {
    const html = await get(BASE + '/')
    console.error(`会话建立（首页 ${html.length} 字节）`)
  } catch (e) {
    console.error(`会话建立失败（不影响后续）: ${e.message}`)
  }
}

// 从 sitemap 取试卷 URL（sitemap 是 robots 声明的公开索引）
async function paperUrls(limit) {
  const out = []
  for (let n = 1; n <= 5 && out.length < limit; n++) {
    const xml = await get(`${BASE}/sitemap${n}.xml`)
    for (const m of xml.matchAll(/<loc>([^<]*\/sj\/[^<]+)<\/loc>/g)) {
      out.push(m[1])
      if (out.length >= limit) break
    }
    await sleep(500)
  }
  return out
}

// 解析学科/学段：从试卷标题判断
function classify(title) {
  const stage = /小学/.test(title) ? '小学' : /初中|中考/.test(title) ? '初中' : '高中'
  const subject = /数学/.test(title) ? 'math'
    : /语文/.test(title) ? 'chinese'
    : /英语/.test(title) ? 'english'
    : /物理/.test(title) ? 'science'
    : /化学/.test(title) ? 'science'
    : /生物/.test(title) ? 'science'
    : /历史/.test(title) ? 'history'
    : /地理/.test(title) ? 'geography'
    : 'thinking'
  return { stage, subject }
}

// 解析试卷页的题目列表（题干+选项+试题详情链接）
function parsePaper(html) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/)
  const title = titleMatch ? stripTags(titleMatch[1]).replace(/_.*菁优网.*$/, '') : ''
  const items = []
  const liRe = /<li class="QUES_LI">([\s\S]*?)(?=<li class="QUES_LI">|<\/ul>)/g
  for (const li of html.matchAll(liRe)) {
    const block = li[1]
    const qMatch = block.match(/<div class="pt1">[\s\S]*?<h2?>([\s\S]*?)<\/h2?>/)
    if (!qMatch) continue
    const prompt = stripTags(qMatch[1]).replace(/^\d+[．.、]\s*/, '')
    const options = []
    const letters = []
    for (const opt of block.matchAll(/<td[^>]*class="selectoption"[^>]*>([\s\S]*?)<\/td>/g)) {
      const raw = stripTags(opt[1])
      const letter = raw.match(/^[A-D]/)?.[0] ?? ''
      const text = raw.replace(/^[A-D][．.、]\s*/, '')
      if (text) { options.push(text); letters.push(letter) }
    }
    if (options.length < 2 || !prompt) continue
    const link = block.match(/href="(\/shiti\/[a-f0-9-]+)"/)
    items.push({ prompt, options, letters, detail: link ? link[1] : null })
  }
  return { title, items }
}

// 从试题详情页取正确答案字母（label class=" s"）+ 考点（不抓解答/点评）
async function fetchAnswer(detail) {
  if (!detail) return { letter: '', knowledge: '' }
  const html = await get(BASE + detail, `${BASE}/sj/`)
  const correct = html.match(/<label class=" s">([^<]+)<\/label>/)
  const letter = correct ? stripTags(correct[1]).match(/^[A-D]/)?.[0] ?? '' : ''
  const point = html.match(/<div class="pt3">[\s\S]*?<a[^>]*>([^<]+)<\/a>/)
  return { letter, knowledge: point ? stripTags(point[1]) : '' }
}

async function main() {
  await initSession()
  const urls = await paperUrls(PAPER_LIMIT)
  console.error(`sitemap 取到 ${urls.length} 份试卷`)
  const all = []
  const seen = new Set()
  for (const url of urls) {
    try {
      const html = await get(url)
      const { title, items } = parsePaper(html)
      const meta = classify(title)
      const year = Number(title.match(/20\d{2}/)?.[0]) || 0
      console.error(`试卷「${title.slice(0, 30)}」: ${items.length} 题`)
      let kept = 0
      for (const item of items) {
        const dedupe = item.prompt.replace(/\s+/g, '').slice(0, 60)
        if (seen.has(dedupe)) continue
        seen.add(dedupe)
        const { letter, knowledge } = await fetchAnswer(item.detail)
        await sleep(DELAY)
        const idx = item.letters.indexOf(letter)
        const answer = idx >= 0 ? item.options[idx] : ''
        if (!answer) continue
        all.push({
          id: `jyeoo-${item.detail?.split('/').pop() || dedupe.slice(0, 12)}`,
          subject: meta.subject,
          kind: 'choice',
          prompt: item.prompt,
          options: item.options,
          answer,
          explain: '解析见菁优网原站（本题库不含版权解析原文）',
          knowledge: knowledge || `菁优网:${meta.stage}:${meta.subject}`,
          grades: meta.stage === '小学' ? [1, 2, 3, 4, 5, 6] : meta.stage === '初中' ? [7, 8, 9] : [10, 11, 12],
          year,
          source: '菁优网'
        })
        kept++
      }
      console.error(`  入库 ${kept} 题`)
      await sleep(DELAY)
    } catch (e) {
      console.error(`试卷失败 ${url}: ${e.message}`)
    }
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(all, null, 2), 'utf8')
  console.error(`完成：${all.length} 题 -> ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
