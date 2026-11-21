<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useLearnStore } from '../stores/learn'
import { store as db, DEFAULT_SETTINGS, exportAll, importAll } from '../storage/db'
import { OllamaProvider, CloudProvider } from '../llm'
import { probeOllama } from '../llm/diagnose'
import type { Settings } from '../core/types'

const app = useLearnStore()
const form = reactive<Settings>({ ...DEFAULT_SETTINGS })
const saved = reactive({ value: false })
const fileInput = ref<HTMLInputElement | null>(null)
const testResult = ref('')
const testing = ref(false)

onMounted(async () => {
  const settings = await db.getSettings()
  Object.assign(form, settings)
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
          <input v-model="form.ollamaBaseUrl" placeholder="http://192.168.0.42:11434" />
        </div>
        <div class="field">
          <label>模型名称</label>
          <input v-model="form.ollamaModel" placeholder="qwen2.5:7b" />
        </div>
        <div class="source-tag">
          电脑需设置 OLLAMA_HOST=0.0.0.0:11434 并放行防火墙。连接失败会自动回退到预设解析。
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

      <button class="btn primary block" @click="save">{{ saved ? '已保存 ✓' : '保存设置' }}</button>
      <button class="btn ghost block" style="margin-top:10px" :disabled="testing" @click="testLocal">
        {{ testing ? '测试中…' : '测试模型连接' }}
      </button>
      <button class="btn ghost block" style="margin-top:8px" :disabled="testing" @click="diagnoseLocal">
        详细诊断（逐个端点）
      </button>
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
