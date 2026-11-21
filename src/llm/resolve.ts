import type { Settings } from '../core/types'
import { listOllamaModels } from './diagnose'
import { store as db } from '../storage/db'

export async function resolveSettings(raw: Settings): Promise<Settings> {
  if (raw.llmMode !== 'local') return raw
  const models = await listOllamaModels(raw.ollamaBaseUrl)
  if (!models.length) return raw
  if (models.includes(raw.ollamaModel)) return raw
  const fixed: Settings = { ...raw, ollamaModel: models[0] }
  await db.saveSettings(fixed)
  return fixed
}
