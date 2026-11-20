import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AnswerRecord, Mastery, Settings } from '../core/types'

interface LearnDB extends DBSchema {
  records: { key: string; value: AnswerRecord; indexes: { 'by-at': number } }
  mastery: { key: string; value: Mastery }
  explanations: { key: string; value: { id: string; text: string; provider: string; at: number } }
  settings: { key: string; value: { key: string } & Settings }
}

const DB_NAME = 'shengshengyueer-learn'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<LearnDB>> | null = null
let currentDb: IDBPDatabase<LearnDB> | null = null

function getDB(): Promise<IDBPDatabase<LearnDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LearnDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const records = db.createObjectStore('records', { keyPath: 'id' })
        records.createIndex('by-at', 'at')
        db.createObjectStore('mastery', { keyPath: 'knowledge' })
        db.createObjectStore('explanations', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }).then((db) => {
      currentDb = db
      return db
    })
  }
  return dbPromise
}

export const DEFAULT_SETTINGS: Settings = {
  llmMode: 'local',
  ollamaBaseUrl: 'http://192.168.1.42:11434',
  ollamaModel: 'qwen2.5:7b',
  cloudBaseUrl: '',
  cloudModel: 'deepseek-chat',
  cloudApiKey: '',
  dailyGoal: 20
}

export const store = {
  async addRecord(record: AnswerRecord): Promise<void> {
    const db = await getDB()
    await db.put('records', record)
  },

  async getRecords(): Promise<AnswerRecord[]> {
    const db = await getDB()
    return db.getAllFromIndex('records', 'by-at')
  },

  async getMasteries(): Promise<Record<string, Mastery>> {
    const db = await getDB()
    const list = await db.getAll('mastery')
    return Object.fromEntries(list.map((m) => [m.knowledge, m]))
  },

  async saveMasteries(masteries: Record<string, Mastery>): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('mastery', 'readwrite')
    for (const m of Object.values(masteries)) await tx.store.put(m)
    await tx.done
  },

  async getExplanation(id: string): Promise<string | null> {
    const db = await getDB()
    const item = await db.get('explanations', id)
    return item?.text ?? null
  },

  async saveExplanation(id: string, text: string, provider: string): Promise<void> {
    const db = await getDB()
    await db.put('explanations', { id, text, provider, at: Date.now() })
  },

  async getSettings(): Promise<Settings> {
    const db = await getDB()
    const item = await db.get('settings', 'default')
    return { ...DEFAULT_SETTINGS, ...(item ? stripKey(item) : {}) }
  },

  async saveSettings(settings: Settings): Promise<void> {
    const db = await getDB()
    await db.put('settings', { key: 'default', ...settings })
  }
}

function stripKey(item: { key: string } & Settings): Partial<Settings> {
  const { key: _key, ...rest } = item
  return rest
}

export interface ExportBundle {
  version: number
  exportedAt: number
  records: AnswerRecord[]
  masteries: Mastery[]
  settings: Settings
  explanations: Record<string, string>
}

export async function exportAll(): Promise<ExportBundle> {
  const db = await getDB()
  const records = await db.getAll('records')
  const masteries = await db.getAll('mastery')
  const settings = await store.getSettings()
  const explanationRows = await db.getAll('explanations')
  const explanations: Record<string, string> = {}
  for (const row of explanationRows) explanations[row.id] = row.text
  return { version: 1, exportedAt: Date.now(), records, masteries, settings, explanations }
}

export async function importAll(bundle: ExportBundle): Promise<void> {
  if (!bundle || bundle.version !== 1) throw new Error('不支持的备份格式')
  const db = await getDB()
  const tx = db.transaction(['records', 'mastery', 'explanations', 'settings'], 'readwrite')
  for (const r of bundle.records) await tx.objectStore('records').put(r)
  for (const m of bundle.masteries) await tx.objectStore('mastery').put(m)
  for (const [id, text] of Object.entries(bundle.explanations ?? {})) {
    await tx.objectStore('explanations').put({ id, text, provider: 'import', at: bundle.exportedAt })
  }
  await tx.objectStore('settings').put({ key: 'default', ...bundle.settings })
  await tx.done
  if (dbPromise) {
    currentDb?.close()
    currentDb = null
    dbPromise = null
  }
}

export function resetDBForTest(): void {
  currentDb?.close()
  currentDb = null
  dbPromise = null
}
