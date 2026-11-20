import { describe, it, expect } from 'vitest'
import { generateFromTemplate, generateQuestion, generateSet } from './generator'
import { evaluate } from './expression'

describe('出题引擎', () => {
  it('按模板生成合法题目，答案与题面一致', () => {
    for (let i = 0; i < 30; i++) {
      const q = generateFromTemplate('add_2digit_carry')
      expect(evaluate(q.text.replace('?', '').replace('= ', ''))).toBe(q.answer)
      expect(q.answer).toBeGreaterThanOrEqual(100)
      expect(q.type).toBe('number')
    }
  })

  it('不进位加法满足个位小于 10', () => {
    for (let i = 0; i < 30; i++) {
      const q = generateFromTemplate('add_2digit_no_carry')
      const a = q.values.a % 10
      const b = q.values.b % 10
      expect(a + b).toBeLessThan(10)
    }
  })

  it('退位减法满足个位不够减', () => {
    for (let i = 0; i < 30; i++) {
      const q = generateFromTemplate('sub_2digit_borrow')
      expect(q.values.a % 10).toBeLessThan(q.values.b % 10)
      expect(q.answer).toBe(q.values.a - q.values.b)
    }
  })

  it('乘法口诀答案正确', () => {
    for (let i = 0; i < 30; i++) {
      const q = generateFromTemplate('mul_table')
      expect(q.answer).toBe(q.values.a * q.values.b)
    }
  })

  it('按年级筛选', () => {
    const q = generateQuestion({ grade: 2 })
    expect(['sub_2digit_borrow', 'mul_table']).toContain(q.templateId)
  })

  it('按知识点筛选', () => {
    const q = generateQuestion({ knowledge: ['multiplication_table'] })
    expect(q.templateId).toBe('mul_table')
  })

  it('生成不重复的一组题', () => {
    const set = generateSet(5, { templateIds: ['mul_table'] })
    expect(new Set(set.map((q) => q.text)).size).toBe(set.length)
  })

  it('未知模板抛错', () => {
    expect(() => generateFromTemplate('not_exist')).toThrow('模板不存在')
  })
})
