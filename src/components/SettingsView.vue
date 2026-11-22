<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useLearnStore } from '../stores/learn'
import { store as db, DEFAULT_SETTINGS, exportAll, importAll } from '../storage/db'
import { OllamaProvider, CloudProvider } from '../llm'
import { probeOllama, listOllamaModels } from '../llm/diagnose'
import type { Settings } from '../core/types'
import { TEXTBOOK_VERSIONS } from '../core/question-bank'
import type { ExamQuestion } from '../core/exam-bank'

const app = useLearnStore()
const form = reactive<Settings>({ ...DEFAULT_SETTINGS })
const saved = reactive({ value: false })
const fileInput = ref<HTMLInputElement | null>(null)
const testResult = ref('')
const testing = ref(false)
const models = ref<string[]>([])
const loadingModels = ref(false)

async function refreshModels(): Promise<void> {
  if (form.llmMode !== 'local') return
  loadingModels.value = true
  try {
    models.value = await listOllamaModels(form.ollamaBaseUrl)
    if (models.value.length && !models.value.includes(form.ollamaModel)) {
      form.ollamaModel = models.value[0]
      await db.saveSettings({ ...form })
      app.settings = { ...form }
      app.notify(`已自动选用模型：${form.ollamaModel}`)
    }
  } finally {
    loadingModels.value = false
  }
}

onMounted(async () => {
  const settings = await db.getSettings()
  Object.assign(form, settings)
  await refreshModels()
})

async function doExport(): Promise<void> {
  const bundle = await exportAll()
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shengshengyueer-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  app.notify('备份已导出')
}

async function doImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const bundle = JSON.parse(await file.text())
    await importAll(bundle)
    await app.init()
    Object.assign(form, await db.getSettings())
    app.notify('数据已导入')
  } catch (e) {
    app.notify('导入失败：文件格式不正确')
  } finally {
    input.value = ''
  }
}

async function save(): Promise<void> {
  await db.saveSettings({ ...form })
  app.settings = { ...form }
  saved.value = true
  app.notify('设置已保存')
  setTimeout(() => (saved.value = false), 2000)
}

// 导入爬虫抓来的题库 JSON（数组，字段同 ExamQuestion），按题目 id 去重存本地
const importingBank = ref(false)
async function importBank(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importingBank.value = true
  testResult.value = '正在导入题库…'
  try {
    const raw = JSON.parse(await file.text()) as unknown
    const items = (Array.isArray(raw) ? raw : (raw as { exam?: unknown[] }).exam ?? []) as Record<string, unknown>[]
    if (!items.length) throw new Error('文件里没有题目')
    const valid = items.filter((q) =>
      typeof q.prompt === 'string' && Array.isArray(q.options) ? true
        : typeof q.prompt === 'string' && typeof q.answer === 'string'
    ).map((q, i) => ({
      id: String(q.id ?? `import-${Date.now()}-${i}`),
      subject: (['math', 'chinese', 'english', 'science', 'history', 'geography', 'thinking'].includes(String(q.subject)) ? q.subject : 'math') as ExamQuestion['subject'],
      kind: (['choice', 'judge', 'fill'].includes(String(q.kind)) ? q.kind : 'fill') as ExamQuestion['kind'],
      prompt: String(q.prompt),
      options: Array.isArray(q.options) ? (q.options as unknown[]).filter((o): o is string => typeof o === 'string') : undefined,
      answer: String(q.answer ?? ''),
      explain: String(q.explain ?? '暂无解析'),
      knowledge: String(q.knowledge ?? '导入题库'),
      grades: Array.isArray(q.grades) ? (q.grades as unknown[]).filter((g): g is number => typeof g === 'number') : [10, 11, 12],
      year: Number(q.year) || new Date().getFullYear(),
      category: String(q.category ?? ''),
      source: String(q.source ?? '导入')
    }))
    const added = await db.saveExamPapers(valid)
    testResult.value = `题库导入完成：文件 ${items.length} 题，有效 ${valid.length} 题，新增 ${added} 题（按 ID 去重，重复的跳过）。本地题库共 ${await db.examPaperCount()} 题。`
  } catch (e) {
    testResult.value = `题库导入失败：${e instanceof Error ? e.message : String(e)}`
  } finally {
    importingBank.value = false
    input.value = ''
  }
}

const updatingExam = ref(false)
async function updateExam(): Promise<void> {
  updatingExam.value = true
  testResult.value = '正在更新真题库…'
  try {
    const { updateExamBank } = await import('../core/exam-update')
    const result = await updateExamBank()
    testResult.value = `真题库更新完成：新增 ${result.added} 道，重复卷子跳过 ${result.skipped} 道，本地共 ${result.total} 道。\n（按「同一份真题卷」去重：年份+卷型+学科相同即视为同一份，整份只入库一次，重复点更新不会重复添加。）${result.error ? `\n部分来源失败：${result.error}` : ''}`
  } catch (e) {
    testResult.value = `更新失败：${e instanceof Error ? e.message : String(e)}`
  } finally {
    updatingExam.value = false
  }
}

async function diagnoseLocal(): Promise<void> {
  if (form.llmMode !== 'local') {
    testResult.value = '详细诊断仅用于电脑本地模式。'
    return
  }
  testing.value = true
  testResult.value = '正在逐个探测端点…'
  try {
    const results = await probeOllama(form.ollamaBaseUrl, form.ollamaModel)
    testResult.value = results.map((r) => [
      `${r.ok ? '✓' : '✗'} ${r.label}`,
      `   URL: ${r.url}`,
      `   状态: ${r.status ?? '无响应'}`,
      `   返回: ${r.preview}`
    ].join('\n')).join('\n\n')
  } catch (e) {
    testResult.value = `诊断出错：${e instanceof Error ? e.message : String(e)}`
  } finally {
    testing.value = false
  }
}

async function testLocal(): Promise<void> {
  testing.value = true
  testResult.value = '正在连接…'
  try {
    const provider = form.llmMode === 'cloud'
      ? new CloudProvider(form.cloudBaseUrl, form.cloudModel, form.cloudApiKey)
      : new OllamaProvider(form.ollamaBaseUrl, form.ollamaModel)
    if (form.llmMode === 'off') {
      testResult.value = '当前是纯离线模式，不会调用模型。请切换到电脑本地或云端。'
      return
    }
    const ok = await provider.isAvailable()
    if (!ok) {
      const url = form.llmMode === 'cloud' ? form.cloudBaseUrl : form.ollamaBaseUrl
      testResult.value = [
        `连接失败：无法访问 ${url}`,
        '',
        '排查顺序：',
        '1) 电脑 Ollama 是否运行（任务栏/服务），日志有无请求',
        '2) 电脑设置 OLLAMA_HOST=0.0.0.0:11434 并重启 Ollama',
        '3) Windows 防火墙放行 11434 端口',
        '4) 手机与电脑是否同一 WiFi、同一网段（如都是 192.168.0.x）',
        '5) 用浏览器在手机打开 ' + url + '/api/tags 看能否访问'
      ].join('\n')
      return
    }
    const text = await provider.complete('请只回复两个字：正常', { timeoutMs: 20000, maxTokens: 20 })
    const extra = provider instanceof OllamaProvider
      ? `\n接口：${provider.lastEndpoint() === 'openai' ? '/v1/chat/completions' : '/api/chat（原生，已自动降级）'}`
      : ''
    testResult.value = `成功：模型 ${form.llmMode === 'cloud' ? form.cloudModel : form.ollamaModel} 已响应。${extra}\n返回内容：${text}`
  } catch (e) {
    testResult.value = `调用出错：${e instanceof Error ? e.message : String(e)}`
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>⚙️ 设置</h1>
        <div class="sub">模型可插拔：本地 / 云端 / 纯离线</div>
      </div>
    </div>

    <div class="card">
      <h2>讲解模型</h2>
      <div class="segment">
        <button :class="{ on: form.llmMode === 'local' }" @click="form.llmMode = 'local'">电脑本地</button>
        <button :class="{ on: form.llmMode === 'cloud' }" @click="form.llmMode = 'cloud'">云端</button>
        <button :class="{ on: form.llmMode === 'off' }" @click="form.llmMode = 'off'">纯离线</button>
      </div>

      <template v-if="form.llmMode === 'local'">
        <div class="field">
          <label>电脑 Ollama 地址（同一 WiFi）</label>
          <input v-model="form.ollamaBaseUrl" placeholder="http://192.168.0.42:11434" @change="refreshModels" />
        </div>
        <div class="field">
          <label>模型名称（自动读取电脑已安装的模型）</label>
          <input v-model="form.ollamaModel" :list="'ollama-models'" placeholder="选择或输入模型名" />
          <datalist id="ollama-models">
            <option v-for="m in models" :key="m" :value="m"></option>
          </datalist>
          <button class="btn ghost small" style="margin-top:6px" :disabled="loadingModels" @click="refreshModels">
            {{ loadingModels ? '读取中…' : '刷新模型列表' }}
          </button>
        </div>
        <div class="source-tag">
          检测到 {{ models.length }} 个模型{{ models.length ? '：' + models.join('、') : '（点刷新或检查连接）' }}。已按「纯文本小模型优先」排序。
          <template v-if="models.some((m) => /vl|vision/i.test(m))">
            <br /><strong style="color:var(--err)">检测到视觉大模型（如 qwen3-vl），又慢又耗资源，做题用不到。建议在电脑执行：<code>ollama pull qwen3:4b</code>，然后在上方下拉选它，速度可快数倍。</strong>
          </template>
        </div>
      </template>

      <template v-else-if="form.llmMode === 'cloud'">
        <div class="field">
          <label>接口地址（OpenAI 兼容）</label>
          <input v-model="form.cloudBaseUrl" placeholder="https://api.deepseek.com/v1" />
        </div>
        <div class="field">
          <label>模型名称</label>
          <input v-model="form.cloudModel" placeholder="deepseek-chat" />
        </div>
        <div class="field">
          <label>API Key（仅存本机）</label>
          <input v-model="form.cloudApiKey" type="password" placeholder="sk-..." />
        </div>
      </template>

      <div v-else class="source-tag">完全离线，讲解使用内置预设文案，判题与出题照常工作。</div>

      <div class="field" style="margin-top:14px">
        <label>每日目标（题）</label>
        <input v-model.number="form.dailyGoal" type="number" min="1" max="200" />
      </div>

      <div class="field" style="margin-top:14px">
        <label>教材版本（K12 全学段统一，默认人教版）</label>
        <select v-model="form.textbookVersion">
          <option v-for="v in TEXTBOOK_VERSIONS" :key="v" :value="v">{{ v }}</option>
        </select>
        <div class="source-tag">此版本会作为模型出题的知识点范围约束；切换后请重新出题以生效。</div>
      </div>

      <button class="btn primary block" @click="save">{{ saved ? '已保存 ✓' : '保存设置' }}</button>
      <button class="btn ghost block" style="margin-top:10px" :disabled="testing" @click="testLocal">
        {{ testing ? '测试中…' : '测试模型连接' }}
      </button>
      <button class="btn ghost block" style="margin-top:8px" :disabled="testing" @click="diagnoseLocal">
        详细诊断（逐个端点）
      </button>
      <button class="btn ghost block" style="margin-top:8px" :disabled="updatingExam" @click="updateExam">
        {{ updatingExam ? '正在更新真题库…' : '更新真题库（从开源源拉取新真题）' }}
      </button>
      <div class="field" style="margin-top:12px">
        <label>导入爬取的题库 JSON（菁优网/组卷网等，按 ID 去重）</label>
        <input type="file" accept=".json,application/json" :disabled="importingBank" @change="importBank" />
      </div>
      <div v-if="testResult" class="explain" style="white-space:pre-wrap;margin-top:10px">{{ testResult }}</div>
    </div>

    <div class="card">
      <h2>数据备份与迁移</h2>
      <div class="source-tag" style="margin-bottom:10px">
        导出备份文件可复制到另一台设备导入，实现学习进度跨设备迁移。
      </div>
      <div class="row">
        <button class="btn ghost" style="flex:1" @click="doExport">导出备份</button>
        <button class="btn ghost" style="flex:1" @click="fileInput?.click()">导入备份</button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        style="display:none"
        @change="doImport"
      />
    </div>

    <div class="card">
      <h2>关于</h2>
      <div class="source-tag">
        声声悦耳学习助手 · 数学 / 识字 / 英语 三科闭环。出题与判题完全本地、数据驱动；讲解可插拔，失败自动降级。
      </div>
    </div>
  </div>
</template>
