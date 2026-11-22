/**
 * 统一登录态管理：一次登录，长期复用，过期只需重跑一条命令。
 *
 * 用法：
 *   node scripts/login.mjs jyeoo     打开菁优网登录页，你在浏览器里登录，脚本自动存 Cookie
 *   node scripts/login.mjs zujuan    同上，组卷网
 *   node scripts/login.mjs status    查看两个站点的登录态是否有效
 *
 * 原理：用 Playwright 持久化浏览器 profile（scripts/.browser-profiles/），
 * 登录后 Cookie 自动保存在 profile 里，爬虫读取同一个 profile 即可免登录。
 * 登录过期时重跑对应命令，浏览器弹出来登录一次即可。
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const PROFILE_DIR = join(ROOT, 'scripts', '.browser-profiles')
mkdirSync(PROFILE_DIR, { recursive: true })

const SITES = {
  jyeoo: {
    name: '菁优网',
    home: 'https://www.jyeoo.com/',
    login: 'https://www.jyeoo.com/account/loginform',
    checkUrl: 'https://www.jyeoo.com/sj/58c418e0-7db4-4462-8ba0-3656c2b97882',
    // 试卷页未登录返回 403「警告」页；登录后可看到题目
    loggedIn: (html) => !html.includes('警告 403') && html.includes('ques-list')
  },
  zujuan: {
    name: '组卷网',
    home: 'https://www.zujuan.com/',
    login: 'https://www.zujuan.com/login',
    // 首页游客也显示 VIP 字样，不可靠；用详情页判断（未登录会跳转登录页）
    checkUrl: 'https://www.zujuan.com/question/detail-77971675.shtml',
    loggedIn: (html) => !html.includes('用户登录') && !html.includes('login.min.css') && html.includes('question')
  }
}

// 复用 agent-browser 已安装的 Chromium，或系统 Chrome
function findChrome() {
  // agent-browser 下载的 Chromium（版本号动态）
  const abDir = join(process.env.USERPROFILE || '', '.agent-browser', 'browsers')
  const abChrome = existsSync(abDir)
    ? readdirSync(abDir).filter((d) => d.startsWith('chrome-')).map((d) => join(abDir, d, 'chrome.exe')).find(existsSync)
    : undefined
  const candidates = [
    process.env.CHROME_PATH,
    abChrome,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ].filter(Boolean)
  for (const p of candidates) if (existsSync(p)) return p
  return undefined // 让 playwright 用默认查找
}

async function openBrowser(siteKey) {
  return chromium.launchPersistentContext(join(PROFILE_DIR, siteKey), {
    ...(findChrome() ? { executablePath: findChrome() } : {}),
    headless: false,
    viewport: { width: 1280, height: 800 }
  })
}

async function checkStatus(siteKey) {
  const site = SITES[siteKey]
  const ctx = await openBrowser(siteKey)
  try {
    const page = ctx.pages()[0] || await ctx.newPage()
    await page.goto(site.checkUrl || site.home, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const html = await page.content()
    return site.loggedIn(html)
  } finally {
    await ctx.close()
  }
}

/** Cookie 缓存文件路径（爬虫直接读，无需每次启动浏览器） */
function cookieFile(siteKey) {
  return join(ROOT, 'scripts', `.cookie-${siteKey}.txt`)
}

async function doLogin(siteKey) {
  const site = SITES[siteKey]
  console.log(`\n=== ${site.name} 登录 ===`)
  console.log('即将打开浏览器，请在浏览器里完成登录（扫码/账号密码均可）。')
  console.log('登录成功后，回到这个窗口按回车键继续…\n')
  const ctx = await openBrowser(siteKey)
  try {
    const page = ctx.pages()[0] || await ctx.newPage()
    await page.goto(site.login, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
    // 等待用户在浏览器里按回车
    await new Promise((resolve) => {
      process.stdin.setEncoding('utf8')
      process.stdin.once('data', resolve)
      console.log('（浏览器已打开，登录好后按回车）')
    })
    // 验证登录态
    await page.goto(site.home, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const html = await page.content()
    const ok = site.loggedIn(html)
    if (ok) {
      const cookies = await ctx.cookies()
      writeFileSync(cookieFile(siteKey), cookies.map((c) => `${c.name}=${c.value}`).join('; '), 'utf8')
      console.log(`✓ ${site.name} 登录态已保存，后续爬虫自动复用。`)
    } else {
      console.log(`⚠ ${site.name} 登录态未检测到，请确认是否登录成功。`)
    }
    return ok
  } finally {
    await ctx.close()
  }
}

/** 供爬虫调用：从持久化 profile 读取指定站点的 Cookie 字符串 */
export async function getCookies(siteKey) {
  if (!SITES[siteKey]) return ''
  const ctx = await openBrowser(siteKey)
  try {
    const page = ctx.pages()[0] || await ctx.newPage()
    await page.goto(SITES[siteKey].home, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {})
    const cookies = await ctx.cookies()
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  } finally {
    await ctx.close()
  }
}

async function main() {
  const cmd = process.argv[2] || 'status'
  if (cmd === 'status') {
    for (const key of Object.keys(SITES)) {
      const ok = await checkStatus(key)
      console.log(`${SITES[key].name}: ${ok ? '已登录 ✓' : '未登录/已过期 ✗'}`)
    }
    return
  }
  if (!SITES[cmd]) {
    console.error(`未知站点：${cmd}。可选：jyeoo / zujuan / status`)
    process.exit(1)
  }
  await doLogin(cmd)
}

main().catch((e) => { console.error(e); process.exit(1) })
