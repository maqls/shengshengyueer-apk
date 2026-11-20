import type { AnswerRecord, Mastery } from './types'

export interface BktParams {
  pInit: number
  pLearn: number
  pSlip: number
  pGuess: number
}

export const DEFAULT_BKT: BktParams = {
  pInit: 0.15,
  pLearn: 0.25,
  pSlip: 0.1,
  pGuess: 0.15
}

export function updateMastery(
  current: number,
  correct: boolean,
  params: BktParams = DEFAULT_BKT
): number {
  let p = Math.min(1, Math.max(0, current))
  if (correct) {
    const numerator = p * (1 - params.pSlip)
    const denominator = numerator + (1 - p) * params.pGuess
    const posterior = denominator > 0 ? numerator / denominator : p
    p = posterior + (1 - posterior) * params.pLearn
  } else {
    const numerator = p * params.pSlip
    const denominator = numerator + (1 - p) * (1 - params.pGuess)
    const posterior = denominator > 0 ? numerator / denominator : p
    p = posterior * (1 - params.pLearn)
  }
  return Math.round(Math.min(1, Math.max(0, p)) * 1000) / 1000
}

export function applyRecords(
  masteries: Record<string, Mastery>,
  records: AnswerRecord[],
  params: BktParams = DEFAULT_BKT
): Record<string, Mastery> {
  const next: Record<string, Mastery> = JSON.parse(JSON.stringify(masteries))
  for (const record of records) {
    for (const knowledge of record.knowledge) {
      const prev = next[knowledge] ?? {
        knowledge,
        value: params.pInit,
        attempts: 0,
        updatedAt: record.at
      }
      next[knowledge] = {
        knowledge,
        value: updateMastery(prev.value, record.correct, params),
        attempts: prev.attempts + 1,
        updatedAt: record.at
      }
    }
  }
  return next
}

export function weakestKnowledge(masteries: Record<string, Mastery>, limit = 3): string[] {
  return Object.values(masteries)
    .sort((a, b) => a.value - b.value)
    .slice(0, limit)
    .map((m) => m.knowledge)
}
