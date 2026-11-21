export interface LLMOptions {
  timeoutMs?: number
  maxTokens?: number
  system?: string
}

export interface LLMProvider {
  readonly name: string
  complete(prompt: string, options?: LLMOptions): Promise<string>
  isAvailable(): Promise<boolean>
}

export class LLMError extends Error {
  constructor(message: string, public readonly provider: string) {
    super(`[${provider}] ${message}`)
    this.name = 'LLMError'
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new LLMError(`请求超时 (${ms}ms)`, label)), ms)
    )
  ])
}
