import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AnswerRecord, Mastery, Question, Settings } from '../core/types'
import { generateQuestion, generateFromTemplate } from '../core/generator'
import { makeRecord } from '../core/judge'
import { applyRecords, weakestKnowledge } from '../core/mastery'
import { buildReviewItems } from '../core/review'
import { store } from '../storage/db'
import { createProviders, explain } from '../llm'
import { buildExplainSystem, buildExplainUser } from '../llm/explain-prompt'
import { resolveSettings } from '../llm/resolve'
import type { LLMProvider } from '../llm/provider'

export const useLearnStore = defineStore('learn', () => {
  const current = ref<Question | null>(null)
  const masteries = ref<Record<string, Mastery>>({})
  const records = ref<AnswerRecord[]>([])
  const settings = ref<Settings | null>(null)
  const explanation = ref('')
  const explainSource = ref('')
  const lastCorrect = ref<boolean | null>(null)
  const loading = ref(false)
  const isReview = ref(false)
  const startedAt = ref(Date.now())
  const mathGrade = ref<number | undefined>(undefined)

  const weakPoints = computed(() => weakestKnowledge(masteries.value))
  const todayCount = computed(() => {
    const today = new Date().toDateString()
    return records.value.filter((r) => new Date(r.at).toDateString() === today).length
  })

  async function init(): Promise<void> {
    settings.value = await store.getSettings()
    masteries.value = await store.getMasteries()
    records.value = await store.getRecords()
  }

  async function nextQuestion(): Promise<void> {
    loading.value = true
    explanation.value = ''
    explainSource.value = ''
    lastCorrect.value = null
    try {
      const due = buildReviewItems(records.value, masteries.value)
      let question: Question
      if (due.length > 0) {
        const wrongRecord = due[0].record
        question = generateFromTemplate(wrongRecord.templateId)
        isReview.value = true
      } else {
        const focus = weakPoints.value[0]
        question = generateQuestion(
          mathGrade.value !== undefined
            ? { grade: mathGrade.value }
            : focus ? { knowledge: [focus] } : {}
        )
        isReview.value = false
      }
      current.value = question
      startedAt.value = Date.now()
    } finally {
      loading.value = false
    }
  }

  async function submit(userAnswer: number | null): Promise<void> {
    if (!current.value || !settings.value) return
    const record = makeRecord(current.value, userAnswer, Date.now() - startedAt.value)
    records.value.push(record)
    await store.addRecord(record)
    masteries.value = applyRecords(masteries.value, [record])
    await store.saveMasteries(masteries.value)
    lastCorrect.value = record.correct

    const cacheKey = `v2_${current.value.id}`
    const cached = await store.getExplanation(cacheKey)
    if (cached) {
      explanation.value = cached
      explainSource.value = 'cache'
      return
    }

    loading.value = true
    try {
      const resolved = await resolveSettings(settings.value)
      settings.value = resolved
      const providers: LLMProvider[] = createProviders(resolved)
      let fallback = current.value.fallbackExplain
      if (!record.correct) {
        fallback = `${fallback} 正确答案是 ${current.value.answer}。再想想哦。`
      }
      const sys = buildExplainSystem()
      const user = buildExplainUser({
        question: current.value.text,
        answer: String(current.value.answer),
        userAnswer,
        correct: record.correct
      })
      const result = await explain(providers, user, fallback, sys)
      explanation.value = result.text
      explainSource.value = result.provider
      await store.saveExplanation(cacheKey, result.text, result.provider)
    } finally {
      loading.value = false
    }
  }

  async function practiceTemplate(templateId: string): Promise<void> {
    current.value = generateFromTemplate(templateId)
    isReview.value = false
    explanation.value = ''
    lastCorrect.value = null
    startedAt.value = Date.now()
  }

  async function applyTextRecord(record: AnswerRecord): Promise<void> {
    records.value.push(record)
    await store.addRecord(record)
    masteries.value = applyRecords(masteries.value, [record])
    await store.saveMasteries(masteries.value)
  }

  function setMathGrade(grade: number | undefined): void {
    mathGrade.value = grade
  }

  // toast 已移除，保留接口兼容旧调用
  function notify(_message: string): void {}

  return {
    current,
    masteries,
    records,
    settings,
    explanation,
    explainSource,
    lastCorrect,
    loading,
    isReview,
    mathGrade,
    setMathGrade,
    weakPoints,
    todayCount,
    init,
    nextQuestion,
    submit,
    practiceTemplate,
    applyTextRecord,
    notify
  }
})
