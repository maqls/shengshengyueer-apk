<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLearnStore } from '../stores/learn'
import { SUBJECT_GROUPS, SUBJECT_LABELS } from '../core/question-bank'
import { examQuestions, examYears, nextExamWithLocal, type ExamQuestion } from '../core/exam-bank'
import { store as db } from '../storage/db'
import type { Subject } from '../core/types'
import { shuffle } from '../core/random'
import { createProviders, explain } from '../llm'
import { buildExplainSystem, buildExplainUser } from '../llm/explain-prompt'
import { resolveSettings } from '../llm/resolve'

const app = useLearnStore()
const subjectGroup = ref<string | undefined>(undefined)
const subject = ref<Subject | undefined>(undefined)
const year = ref<number | undefined>(undefined)
const task = ref<ExamQuestion | null>(null)
const options = ref<string[]>([])
const selected = ref('')
const textAnswer = ref('')
const result = ref<'correct' | 'wrong' | null>(null)
const explainText = ref('')
const explainLoading = ref(false)
const historyIds = ref<string[]>([])

const YEARS = ref<number[]>([])
const total = ref(0)
const currentGroup = computed(() => SUBJECT_GROUPS.find((g) => g.key === subjectGroup.value))
const subjectsInGroup = computed<Subject[]>(() => currentGroup.value?.subjects ?? [])

async function refreshTotal(): Promise<void> {
  total.value = (await examQuestions({ subject: subject.value, year: year.value })).length
}

function chooseGroup(key: string | undefined): void {
  subjectGroup.value = key
  subject.value = undefined
}
function clearFilters(): void {
  subjectGroup.value = undefined
  subject.value = undefined
  year.value = undefined
}

async function newTask(): Promise<void> {
  const local = await db.getExamPapers()
  const next = await nextExamWithLocal({ subject: subject.value, year: year.value }, historyIds.value, local)
  task.value = next
  selected.value = ''
  textAnswer.value = ''
  result.value = null
  explainText.value = ''
  if (next) {
    historyIds.value.push(next.id)
    options.value = next.options ? shuffle(next.options) : []
  }
  await refreshTotal()
}

async function submit(): Promise<void> {
  if (!task.value || result.value) return
  const current = task.value
  const answer = current.kind === 'choice' ? selected.value : textAnswer.value.trim()
  if (!answer) return
  const norm = (s: string) => s.trim().replace(/[。．.]$/, '').replace(/\s+/g, '')
  const correct = norm(answer) === norm(current.answer)
  result.value = correct ? 'correct' : 'wrong'
  explainText.value = current.explain

  // 有模型时用模型补充讲解
  if (!app.settings) return
  const resolved = await resolveSettings(app.settings)
  const providers = createProviders(resolved)
  if (providers.length <= 1) return
  explainLoading.value = true
  try {
    const fallback = current.explain
    const user = buildExplainUser({
      question: current.prompt,
      answer: current.answer,
      userAnswer: answer,
      correct
    })
    const outcome = await explain(providers, user, fallback, buildExplainSystem())
    if (task.value?.id === current.id) explainText.value = outcome.text
  } finally {
    explainLoading.value = false
  }
}

watch([subject, year], () => {
  historyIds.value = []
  void newTask()
})

onMounted(async () => {
  if (!app.settings) await app.init()
  const local = await db.getExamPapers()
  YEARS.value = Array.from(new Set([...(await examYears()), ...local.map((q) => q.year)])).sort((a, b) => b - a)
  await newTask()
})
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📅 历年真题</h1>
        <div class="sub">内置 1573 道高考原题（2010-2022）· 教材版本：{{ app.settings?.textbookVersion ?? '人教版' }}</div>
      </div>
    </div>

    <div class="card">
      <div class="source-tag">
        题目与答案解析来自 GAOKAO-Bench 开源真题库（原题），讲解可由电脑模型补充。
      </div>
      <h2 style="margin-top:12px">学科（当前 {{ total }} 道）</h2>
      <div class="chips">
        <button class="chip" :class="{ on: subjectGroup === undefined }" @click="chooseGroup(undefined)">不限</button>
        <button
          v-for="g in SUBJECT_GROUPS"
          :key="g.key"
          class="chip"
          :class="{ on: subjectGroup === g.key }"
          @click="chooseGroup(g.key)"
        >{{ g.label }}</button>
      </div>
      <div v-if="currentGroup" class="chips" style="margin-top:8px">
        <button class="chip" :class="{ on: subject === undefined }" @click="subject = undefined">全类</button>
        <button
          v-for="s in subjectsInGroup"
          :key="s"
          class="chip"
          :class="{ on: subject === s }"
          @click="subject = s"
        >{{ SUBJECT_LABELS[s] }}</button>
      </div>

      <h2 style="margin-top:14px">真题年份</h2>
      <div class="chips">
        <button class="chip" :class="{ on: year === undefined }" @click="year = undefined">不限年份</button>
        <button
          v-for="y in YEARS"
          :key="y"
          class="chip"
          :class="{ on: year === y }"
          @click="year = y"
        >{{ y }}</button>
      </div>

      <button class="btn ghost small block" style="margin-top:12px" @click="clearFilters">重置筛选</button>
    </div>

    <div v-if="task" class="card">
      <div class="row tight" style="justify-content:space-between;align-items:center">
        <span class="badge ok">真题 {{ task.year }} · {{ task.category }}</span>
        <span class="badge">{{ SUBJECT_LABELS[task.subject] }}</span>
      </div>
      <div class="question-text" style="margin-top:10px;white-space:pre-wrap">{{ task.prompt }}</div>
      <div v-if="options.length" class="options">
        <div
          v-for="opt in options"
          :key="opt"
          class="option"
          :class="{ selected: selected === opt }"
          @click="selected = opt"
        >{{ opt }}</div>
      </div>
      <input
        v-else
        class="answer-input"
        v-model="textAnswer"
        placeholder="输入答案"
        @keyup.enter="submit"
      />
      <div class="row" style="margin-top:14px">
        <button class="btn primary" style="flex:1" :disabled="!!result || (!selected && !textAnswer.trim())" @click="submit">提交答案</button>
        <button class="btn ghost small" @click="newTask">换一题</button>
      </div>
      <div v-if="result" class="explain">
        <div class="row tight" style="align-items:center">
          <span class="badge" :class="result === 'correct' ? 'ok' : 'err'">
            {{ result === 'correct' ? '答对了！' : `正确答案是：${task.answer}` }}
          </span>
        </div>
        <div style="margin-top:8px;white-space:pre-wrap">{{ explainText }}<span v-if="explainLoading">（模型讲解中…）</span></div>
        <button class="btn primary block" style="margin-top:12px" @click="newTask">下一题</button>
      </div>
    </div>
    <div v-else class="card empty">该筛选条件下暂无真题，换一个学科或年份试试</div>
  </div>
</template>
