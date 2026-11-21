import { describe, it, expect } from 'vitest'
import { parseGeneratedQuestion, generateQuizByLLM } from './quiz-generator'
import type { LLMProvider } from './provider'

describe('LLM 动态出题', () => {
  it('解析合法选择题 JSON', () => {
    const raw = JSON.stringify({
      kind: 'choice', prompt: '3+4=?', options: ['6', '7', '8'],
      answer: '7', explain: '三加四等于七', knowledge: '加法'
    })
    const task = parseGeneratedQuestion(raw, 'math', 1)
    expect(task).not.toBeNull()
    expect(task!.kind).toBe('choice')
    expect(task!.answer).toBe('7')
    expect(task!.options).toContain('7')
    expect(task!.subject).toBe('math')
    expect(task!.grades).toEqual([1])
  })

  it('解析带 markdown 代码块的返回', () => {
    const raw = '```json\n{"kind":"fill","prompt":"1+1=?","answer":"2","explain":"等于2"}\n```'
    expect(parseGeneratedQuestion(raw, 'math')?.answer).toBe('2')
  })

  it('拒绝非法结构：答案不在选项、判断题答案非对错、缺字段', () => {
    expect(parseGeneratedQuestion(JSON.stringify({
      kind: 'choice', prompt: 'x', options: ['a', 'b'], answer: 'c', explain: 'e'
    }), 'math')).toBeNull()
    expect(parseGeneratedQuestion(JSON.stringify({
      kind: 'judge', prompt: 'x', answer: 'maybe', explain: 'e'
    }), 'math')).toBeNull()
    expect(parseGeneratedQuestion(JSON.stringify({
      kind: 'fill', prompt: 'x', answer: 'a'
    }), 'math')).toBeNull()
  })

  it('提供方返回合法题目则采用', async () => {
    const provider: LLMProvider = {
      name: 'ollama',
      async isAvailable() { return true },
      async complete() {
        return JSON.stringify({
          kind: 'fill', prompt: '太阳从哪边升起？', answer: '东',
          explain: '地球自转方向决定', knowledge: '天文'
        })
      }
    }
    const result = await generateQuizByLLM([provider], 'science', 1)
    expect(result.task?.prompt).toBe('太阳从哪边升起？')
    expect(result.reason).toBe('ok')
  })

  it('提供方返回非法内容则回退为 null', async () => {
    const provider: LLMProvider = {
      name: 'ollama',
      async isAvailable() { return true },
      async complete() { return '对不起，我无法回答' }
    }
    expect((await generateQuizByLLM([provider], 'math', undefined)).task).toBeNull()
  })

  it('跳过 fallback 提供方', async () => {
    let called = false
    const fb: LLMProvider = {
      name: 'fallback',
      async isAvailable() { return true },
      async complete() { called = true; return '{"kind":"fill","prompt":"x","answer":"y","explain":"z"}' }
    }
    const result = await generateQuizByLLM([fb], 'math', undefined)
    expect(called).toBe(false)
    expect(result.reason).toContain('未配置模型')
  })
})
