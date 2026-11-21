import { describe, it, expect } from 'vitest'
import { buildExplainSystem, buildExplainUser } from './explain-prompt'

describe('逐步讲解 prompt', () => {
  it('system 强制六段式与逐步编号', () => {
    const sys = buildExplainSystem()
    for (const key of ['读题', '思路', '步骤', '第1步', '结果', '检验', '小结', '禁止笼统']) {
      expect(sys).toContain(key)
    }
    expect(sys).toContain('一步一步')
  })

  it('user 包含题目/答案/学生答案与格式要求', () => {
    const user = buildExplainUser({
      question: '3+4=?', answer: '7', userAnswer: '6', correct: false
    })
    expect(user).toContain('3+4=?')
    expect(user).toContain('7')
    expect(user).toContain('6')
    expect(user).toContain('错误')
    for (const key of ['读题', '思路', '步骤', '结果', '检验', '小结']) {
      expect(user).toContain(key)
    }
  })

  it('答错时额外要求指出错在哪', () => {
    const wrong = buildExplainUser({ question: 'x', answer: '1', userAnswer: '2', correct: false })
    expect(wrong).toContain('错在哪一步')
    const right = buildExplainUser({ question: 'x', answer: '1', userAnswer: '1', correct: true })
    expect(right).not.toContain('错在哪一步')
  })

  it('未作答显示占位', () => {
    const user = buildExplainUser({ question: 'x', answer: '1', userAnswer: null, correct: false })
    expect(user).toContain('未作答')
  })
})
