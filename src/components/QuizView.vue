<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import { nextQuiz, checkQuiz, makeQuizRecord, type QuizTask } from '../core/quiz'
import { SUBJECT_LABELS, GRADE_LABELS, availableGrades } from '../core/question-bank'
import type { Subject } from '../core/types'
import { shuffle } from '../core/random'
import { createProviders, explain } from '../llm'
import { generateQuizByLLM } from '../llm/quiz-generator'
import type { LLMProvider } from '../llm/provider'

const app = useLearnStore()
const subject = ref<Subject | undefined>(undefined)
const grade = ref<number | undefined>(undefined)
const task = ref<QuizTask | null>(null)
const input = ref('')
const selected = ref('')
const result = ref<'correct' | 'wrong' | null>(null)
const historyIds = ref<string[]>([])
const historyPrompts = ref<string[]>([])
const source = ref<'llm' | 'bank'>('bank')
const explainText = ref('')
const explainSource = ref('')
const generating = ref(false)
const llmStatus = ref('')
const llmConfigured = computed(() => {
  return !!app.settings && app.settings.llmMode !== 'off'
})

const allSubjects: (Subject | undefined)[] = [
  undefined, 'math', 'chinese', 'english', 'literacy', 'science', 'history', 'geography', 'thinking'
]
const grades = computed(() => availableGrades())

function subjectLabel(s: Subject | undefined): string {
  return s ? SUBJECT_LABELS[s] : '全部学科'
}
function gradeLabel(g: number | undefined): string {
  return g === undefined ? '不限年级' : (GRADE_LABELS[g] ?? `${g}年级`)
}
function llmProviders(): LLMProvider[] {
  return app.settings ? createProviders(app.settings) : []
}

async function newTask(): Promise<void> {
  generating.value = true
  input.value = ''
  selected.value = ''
  result.value = null
  explainText.value = ''
  explainSource.value = ''
  try {
    const providers = llmProviders()
    let next: QuizTask | null = null
    if (providers.length > 1) {
      const resultGen = await generateQuizByLLM(providers, subject.value, grade.value, historyPrompts.value)
      next = resultGen.task
      if (next) {
        source.value = 'llm'
        llmStatus.value = `已通过 ${resultGen.provider} 出题`
      } else {
        source.value = 'bank'
        llmStatus.value = `模型出题失败，已用离线题库：${resultGen.reason}`
      }
    } else {
      source.value = 'bank'
      llmStatus.value = !app.settings
        ? '设置尚未加载完成，已用离线题库'
        : app.settings.llmMode === 'off'
          ? '已设为纯离线模式，不调用模型'
          : '未配置模型，已用离线题库'
    }
    if (!next) {
      next = nextQuiz(subject.value, grade.value, historyIds.value)
    }
    task.value = next
    if (next) {
      historyIds.value.push(next.id)
      historyPrompts.value.push(next.prompt)
    }
  } finally {
    generating.value = false
  }
}

function choose(option: string): void {
  selected.value = option
}

async function submit(): Promise<void> {
  if (!task.value || result.value) return
  const currentTask = task.value
  const answer = task.value.kind === 'choice' ? selected.value : input.value
  if (!answer.trim()) {
    app.notify('请先作答')
    return
  }
  const correct = checkQuiz(currentTask, answer)
  result.value = correct ? 'correct' : 'wrong'
  app.applyTextRecord(makeQuizRecord(currentTask, answer, 3000))

  const fallback = currentTask.explain + (correct ? '' : ` 正确答案是：${currentTask.answer}。`)
  explainText.value = fallback
  explainSource.value = 'preset'

  const providers = llmProviders()
  if (providers.length > 1) {
    const prompt = [
      '请用学生能听懂的话，分步讲解下面这道题。',
      `题目：${currentTask.prompt}`,
      `正确答案：${currentTask.answer}`,
      `学生答案：${answer}`,
      correct ? '学生答对了，讲清为什么对。' : '学生答错了，指出错在哪里并讲正确思路。',
      '只输出讲解内容，不要输出 JSON。'
    ].join('\n')
    const outcome = await explain(providers, prompt, fallback)
    if (task.value?.id === currentTask.id) {
      explainText.value = outcome.text
      explainSource.value = outcome.provider
    }
  }
}

function resetFilter(): void {
  subject.value = undefined
  grade.value = undefined
  historyIds.value = []
  historyPrompts.value = []
  newTask()
}

const options = computed(() => {
  if (!task.value?.options) return []
  return shuffle(task.value.options)
})

onMounted(async () => {
  if (!app.settings) await app.init()
  await newTask()
})
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📚 综合学习</h1>
        <div class="sub">全年级 · 多学科 · 电脑模型动态出题</div>
      </div>
    </div>

    <div class="card" style="padding:10px 12px">
      <div class="source-tag" style="line-height:1.7">
        模型状态：{{ llmConfigured ? '已配置' : '未配置/纯离线' }} · {{ llmStatus || '点击出题后将调用模型' }}
      </div>
    </div>

    <div class="card">
      <h2>选择学科</h2>
      <div class="chips">
        <button
          v-for="s in allSubjects"
          :key="s ?? 'all'"
          class="chip"
          :class="{ on: subject === s }"
          @click="subject = s; newTask()"
        >{{ subjectLabel(s) }}</button>
      </div>
      <h2 style="margin-top:14px">选择年级</h2>
      <div class="chips">
        <button class="chip" :class="{ on: grade === undefined }" @click="grade = undefined; newTask()">不限</button>
        <button
          v-for="g in grades"
          :key="g"
          class="chip"
          :class="{ on: grade === g }"
          @click="grade = g; newTask()"
        >{{ gradeLabel(g) }}</button>
      </div>
    </div>

    <div v-if="generating" class="card empty">电脑模型正在出题…</div>

    <div v-else-if="task" class="card">
      <div class="row tight" style="justify-content:space-between;align-items:center">
        <span class="badge">{{ SUBJECT_LABELS[task.subject] }}</span>
        <span class="badge">{{ task.kind === 'choice' ? '选择题' : task.kind === 'judge' ? '判断题' : '填空题' }}</span>
        <span class="badge" :class="source === 'llm' ? 'ok' : ''">
          {{ source === 'llm' ? '电脑模型出题' : '离线题库' }}
        </span>
      </div>

      <div style="font-size:18px;line-height:1.7;margin:16px 0">{{ task.prompt }}</div>

      <div v-if="task.kind === 'choice' && options.length" class="options">
        <div
          v-for="(opt, i) in options"
          :key="i"
          class="option"
          :class="{ selected: selected === opt }"
          @click="choose(opt)"
        >{{ opt }}</div>
      </div>
      <div v-else-if="task.kind === 'judge'" class="options">
        <div class="option" :class="{ selected: selected === '对' }" @click="choose('对')">对</div>
        <div class="option" :class="{ selected: selected === '错' }" @click="choose('错')">错</div>
      </div>
      <input
        v-else
        class="answer-input"
        v-model="input"
        placeholder="输入答案"
        @keyup.enter="submit"
      />

      <div class="row" style="margin-top:14px">
        <button class="btn primary" style="flex:1" :disabled="!!result" @click="submit">提交答案</button>
        <button class="btn ghost small" @click="newTask">换一题</button>
      </div>

      <div v-if="result" class="explain">
        <div class="row tight" style="align-items:center">
          <span class="badge" :class="result === 'correct' ? 'ok' : 'err'">
            {{ result === 'correct' ? '答对了！' : `正确答案是：${task.answer}` }}
          </span>
        </div>
        <div style="margin-top:8px">{{ explainText }}</div>
        <div class="source-tag">
          讲解来源：{{ { ollama: '电脑本地模型', cloud: '云端模型', preset: '预设解析', fallback: '预设解析', cache: '缓存' }[explainSource] ?? explainSource }}
        </div>
        <button class="btn primary block" style="margin-top:12px" @click="newTask">下一题</button>
      </div>
    </div>

    <div v-else class="card">
      <div class="empty">当前筛选条件下暂无题目</div>
      <button class="btn ghost block" @click="resetFilter">重置筛选</button>
    </div>

    <div class="card">
      <button class="btn ghost block" @click="resetFilter">重置筛选与答题记录</button>
    </div>
  </div>
</template>
