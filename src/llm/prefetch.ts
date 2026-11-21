import type { LLMProvider } from './provider'
import { generateQuizByLLM } from './quiz-generator'
import type { QuizTask } from '../core/quiz'
import type { Subject } from '../core/types'

const CACHE_SIZE = 3

export class QuizPrefetcher {
  private cache: QuizTask[] = []
  private warming = false
  private key = ''

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
  }

  take(subject: Subject | Subject[] | undefined, grade: number | number[] | undefined): QuizTask | null {
    const key = this.filterKey(subject, grade)
    if (key !== this.key) {
      this.cache = []
      this.key = key
    }
    return this.cache.shift() ?? null
  }

  async warmup(providers: LLMProvider[], system?: string): Promise<void> {
    if (this.warming) return
    const real = providers.find((p) => p.name !== 'fallback')
    if (!real) return
    this.warming = true
    try {
      await real.complete('请只回复：好', { maxTokens: 5, timeoutMs: 180000, system: system ?? '只回复一个字。' })
    } catch {
      // 预热失败不影响主流程
    } finally {
      this.warming = false
    }
  }

  async fill(
    providers: LLMProvider[],
    subject: Subject | Subject[] | undefined,
    grade: number | number[] | undefined,
    exclude: string[] = []
  ): Promise<void> {
    if (this.cache.length >= CACHE_SIZE) return
    const key = this.filterKey(subject, grade)
    if (key !== this.key) {
      this.cache = []
      this.key = key
    }
    for (let i = this.cache.length; i < CACHE_SIZE; i++) {
      const result = await generateQuizByLLM(
        providers,
        subject,
        grade,
        [...exclude, ...this.cache.map((q) => q.prompt)]
      )
      if (!result.task) break
      this.cache.push(result.task)
    }
  }
}

export const quizPrefetcher = new QuizPrefetcher()
