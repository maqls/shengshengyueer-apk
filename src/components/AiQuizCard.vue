<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import { nextQuiz, checkQuiz, makeQuizRecord, type QuizTask } from '../core/quiz'
import type { Subject } from '../core/types'
import { shuffle } from '../core/random'
import { createProviders, explain } from '../llm'
import { buildExplainSystem, buildExplainUser } from '../llm/explain-prompt'
import { generateQuizByLLM } from '../llm/quiz-generator'
import { resolveSettings } from '../llm/resolve'
import { quizPrefetcher } from '../llm/prefetch'
import type { LLMProvider } from '../llm/provider'

const props = defineProps<{ subject: Subject; grade: number | undefined }>()

const app = useLearnStore()
const task = ref<QuizTask | null>(null)
const input = ref('')
const selected = ref('')
const result = ref<'correct' | 'wrong' | null>(null)
const historyIds = ref<string[]>([])
const historyPrompts = ref<string[]>([])
const source = ref<'llm' | 'bank'>('bank')
const explainText = ref('')
const explainLoading = ref(false)
const generating = ref(false)

const shuffled = ref<string[]>([])

async function llmProviders(): Promise<LLMProvider[]> {
  if (!app.settings) await app.init()
  const resolved = await resolveSettings(app.settings!)
  app.settings = resolved
  return createProviders(resolved)
}

async function newTask(): Promise<void> {
  generating.value = true
  input.value = ''
  selected.value = ''
  result.value = null
  explainText.value = ''
  try {
    const providers = await llmProviders()
    const hasLLM = providers.length > 1
    let next: QuizTask | null = null
    if (hasLLM) {
      next = quizPrefetcher.take(props.subject, props.grade)
      if (!next) {
        const resultGen = await generateQuizByLLM(providers, props.subject, props.grade, historyPrompts.value)
        next = resultGen.task
      }
      source.value = next?.id.startsWith('ai-') ? 'llm' : 'bank'
    } else {
      source.value = 'bank'
    }
    if (!next) next = nextQuiz(props.subject, props.grade, historyIds.value)
    task.value = next
    if (next) {
      historyIds.value.push(next.id)
      historyPrompts.value.push(next.prompt)
      shuffled.value = next.options ? shuffle(next.options) : []
    }
    if (hasLLM) {
      void quizPrefetcher.fill(providers, props.subject, props.grade, historyPrompts.value)
    }
  } finally {
    generating.value = false
  }
}

async function submit(): Promise<void> {
  if (!task.value || result.value) return
  const currentTask = task.value
  const answer = task.value.kind === 'choice' ? selected.value : input.value
  if (!answer.trim()) return
  const correct = checkQuiz(currentTask, answer)
  result.value = correct ? 'correct' : 'wrong'
  app.applyTextRecord(makeQuizRecord(currentTask, answer, 3000))

  const fallback = currentTask.explain + (correct ? '' : ` 正确答案是：${currentTask.answer}。`)
  explainText.value = fallback
  explainLoading.value = true
  try {
    const providers = await llmProviders()
    if (providers.length > 1) {
      const sys = buildExplainSystem()
      const user = buildExplainUser({
        question: currentTask.prompt,
        answer: currentTask.answer,
        userAnswer: answer,
        correct
      })
      const outcome = await explain(providers, user, fallback, sys)
      if (task.value?.id === currentTask.id) explainText.value = outcome.text
    }
  } finally {
    explainLoading.value = false
  }
}

onMounted(async () => {
  const providers = await llmProviders()
  if (providers.length > 1) {
    const cached = quizPrefetcher.take(props.subject, props.grade)
    if (cached) {
      task.value = cached
      source.value = cached.id.startsWith('ai-') ? 'llm' : 'bank'
    } else {
      task.value = nextQuiz(props.subject, props.grade, historyIds.value)
      source.value = 'bank'
    }
    if (task.value) {
      historyIds.value.push(task.value.id)
      historyPrompts.value.push(task.value.prompt)
      shuffled.value = task.value.options ? shuffle(task.value.options) : []
    }
    void quizPrefetcher.warmup(providers).then(() =>
      quizPrefetcher.fill(providers, props.subject, props.grade, historyPrompts.value)
    )
  } else {
    await newTask()
  }
})

// 年级或学科变化时重新出题
watch(
  () => [props.subject, props.grade],
  () => {
    void newTask()
  }
)

defineExpose({ newTask })
</script>

<template>
  <div>
    <div v-if="!task" class="card empty">{{ generating ? '正在出题…' : '暂无题目' }}</div>
    <div v-else class="card">
      <div class="row tight" style="justify-content:space-between;align-items:center">
        <span class="badge" :class="source === 'llm' ? 'ok' : ''">
          {{ source === 'llm' ? '电脑模型出题' : '离线题库' }}
        </span>
      </div>

      <div class="question-text" style="margin-top:10px">{{ task.prompt }}</div>

      <div v-if="task.kind === 'choice' && shuffled.length" class="options">
        <div
          v-for="opt in shuffled"
          :key="opt"
          class="option"
          :class="{ selected: selected === opt }"
          @click="selected = opt"
        >{{ opt }}</div>
      </div>
      <div v-else-if="task.kind === 'judge'" class="options">
        <div class="option" :class="{ selected: selected === '对' }" @click="selected = '对'">对</div>
        <div class="option" :class="{ selected: selected === '错' }" @click="selected = '错'">错</div>
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
        <div style="margin-top:8px">
          {{ explainText }}
          <span v-if="explainLoading" style="color:var(--muted)">（讲解生成中…）</span>
        </div>
        <button class="btn primary block" style="margin-top:12px" @click="newTask">下一题</button>
      </div>
    </div>
  </div>
</template>
