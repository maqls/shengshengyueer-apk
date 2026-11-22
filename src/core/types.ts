export type Difficulty = 1 | 2 | 3

export interface ParamRange {
  min: number
  max: number
  step?: number
}

export interface QuestionTemplate {
  id: string
  knowledge: string[]
  grade: number
  difficulty: Difficulty
  type: 'number' | 'choice'
  params: Record<string, ParamRange>
  constraint?: string
  question: string
  answer: string
  distractors?: string[]
  explainPrompt: string
  fallbackExplain: string
}

export interface Question {
  id: string
  templateId: string
  knowledge: string[]
  difficulty: Difficulty
  type: 'number' | 'choice'
  text: string
  answer: number
  options?: number[]
  values: Record<string, number>
  explainPrompt: string
  fallbackExplain: string
}

export type Subject =
  | 'math'
  | 'literacy'
  | 'english'
  | 'chinese'
  | 'science'
  | 'history'
  | 'geography'
  | 'thinking'

export interface AnswerRecord {
  id: string
  questionId: string
  templateId: string
  subject: Subject
  knowledge: string[]
  correct: boolean
  userAnswer: number | string | null
  answer: number | string
  prompt: string
  elapsedMs: number
  at: number
  errorType?: 'concept' | 'calculation' | 'careless' | 'spelling' | 'recall'
}

export interface Mastery {
  knowledge: string
  value: number
  attempts: number
  updatedAt: number
}

export interface Settings {
  llmMode: 'local' | 'cloud' | 'off'
  ollamaBaseUrl: string
  ollamaModel: string
  cloudBaseUrl: string
  cloudModel: string
  cloudApiKey: string
  dailyGoal: number
  textbookVersion: string
}
