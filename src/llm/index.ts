import type { LLMProvider } from './provider'
import { OllamaProvider } from './ollama'
import { CloudProvider } from './cloud'
import type { Settings } from '../core/types'

export class FallbackProvider implements LLMProvider {
  readonly name = 'fallback'
  async isAvailable(): Promise<boolean> {
    return true
  }
  async complete(text: string): Promise<string> {
    return text || '请一步一步思考，注意进位和退位，加油！'
  }
}

export function createProviders(settings: Settings): LLMProvider[] {
  const providers: LLMProvider[] = []
  if (settings.llmMode === 'local') {
    providers.push(new OllamaProvider(settings.ollamaBaseUrl, settings.ollamaModel))
  } else if (settings.llmMode === 'cloud') {
    providers.push(
      new CloudProvider(settings.cloudBaseUrl, settings.cloudModel, settings.cloudApiKey)
    )
  }
  providers.push(new FallbackProvider())
  return providers
}

export async function explain(
  providers: LLMProvider[],
  prompt: string,
  fallbackText: string,
  system?: string
): Promise<{ text: string; provider: string }> {
  for (const provider of providers) {
    const input = provider.name === 'fallback' ? fallbackText : prompt
    try {
      const text = await provider.complete(input, { system, maxTokens: 1200 })
      return { text, provider: provider.name }
    } catch {
      continue
    }
  }
  return { text: fallbackText, provider: 'preset' }
}

export type { LLMProvider } from './provider'
export { OllamaProvider } from './ollama'
export { CloudProvider } from './cloud'
