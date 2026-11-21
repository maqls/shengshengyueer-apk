import { ref } from 'vue'
import type { LLMProvider } from './provider'
import { generateQuizByLLM } from './quiz-generator'
import { nextQuiz, type QuizTask } from '../core/quiz'
import type { Subject } from '../core/types'

const CACHE_SIZE = 3

/** 后台预生成状态，供界面实时显示 */
export const prefetchState = ref<{ cached: number; filling: boolean; warming: boolean }>({
  cached: 0,
  filling: false,
  warming: false
})

export class QuizPrefetcher {
  private cache: QuizTask[] = []
  private warming = false
  private filling = false
  private key = ''

  private sync(): void {
    prefetchState.value = { cached: this.cache.length, filling: this.filling, warming: this.warming }
  }

  private filterKey(subject: Subject | Subject[] | undefined, grade: number | number[] | undefined): string {
    const s = subject === undefined ? 'all' : Array.isArray(subject) ? subject.join(',') : subject
    const g = grade === undefined ? 'all' : Array.isArray(grade) ? grade.join(',') : String(grade)
    return `${s}|${g}`
  }

  size(): number {
    return this.cache.length
  }

  clear(): void {
    this.cache = []
    this.key = ''
    this.sync()
  }

  take(subject: Subject | Subject[] | undefined, grade: number | number[] | undefined): QuizTask | null {
    const key = this.filterKey(subject, grade)
    if (key !== this.key) {
      this.cache = []
      this.key = key
    }
    const task = this.cache.shift() ?? null
    this.sync()
    return task
  }

  async warmup(providers: LLMProvider[], system?: string): Promise<void> {
    if (this.warming) return
    const real = providers.find((p) => p.name !== 'fallback')
    if (!real) return
    this.warming = true
    this.sync()
    try {
      await real.complete('请只回复：好', { maxTokens: 5, timeoutMs: 180000, system: system ?? '只回复一个字。' })
    } catch {
      // 预热失败不影响主流程
    } finally {
      this.warming = false
      this.sync()
    }
  }

  async fill(
    providers: LLMProvider[],
    subject: Subject | Subject[] | undefined,
    grade: number | number[] | undefined,
    exclude: string[] = []
  ): Promise<void> {
    if (this.filling) return
    if (this.cache.length >= CACHE_SIZE) return
    const key = this.filterKey(subject, grade)
    if (key !== this.key) {
      this.cache = []
      this.key = key
    }
    this.filling = true
    this.sync()
    try {
      for (let i = this.cache.length; i < CACHE_SIZE; i++) {
        const result = await generateQuizByLLM(
          providers,
          subject,
          grade,
          [...exclude, ...this.cache.map((q) => q.prompt)]
        )
        if (result.task) {
          this.cache.push(result.task)
        } else {
          // 模型失败时用题库题填充缓存，保证「下一题」永远秒出
          const bankTask = nextQuiz(subject, grade, this.cache.map((q) => q.id))
          if (!bankTask) break
          this.cache.push(bankTask)
        }
        this.sync()
      }
    } finally {
      this.filling = false
      this.sync()
    }
  }
}

export const quizPrefetcher = new QuizPrefetcher()
