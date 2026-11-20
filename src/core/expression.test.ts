import { describe, it, expect } from 'vitest'
import { evaluate, render, safeConstraint } from './expression'

describe('expression 安全求值', () => {
  it('计算四则运算与括号', () => {
    expect(evaluate('1 + 2 * 3')).toBe(7)
    expect(evaluate('(1 + 2) * 3')).toBe(9)
    expect(evaluate('10 / 4')).toBe(2.5)
  })

  it('使用变量', () => {
    expect(evaluate('{a} + {b}', { a: 12, b: 8 })).toBe(20)
  })

  it('拒绝除零', () => {
    expect(() => evaluate('1 / 0')).toThrow('除数不能为 0')
  })

  it('拒绝未知变量与非法字符', () => {
    expect(() => evaluate('x + 1')).toThrow('未知变量')
    expect(() => evaluate('1; alert(1)')).toThrow()
  })

  it('渲染模板', () => {
    expect(render('{a} × {b} = ?', { a: 3, b: 4 })).toBe('3 × 4 = ?')
  })

  it('约束校验', () => {
    expect(safeConstraint('a % 10 + b % 10 >= 10', { a: 18, b: 25 })).toBe(true)
    expect(safeConstraint('a % 10 + b % 10 >= 10', { a: 11, b: 12 })).toBe(false)
    expect(safeConstraint('alert(1)', {})).toBe(false)
  })
})
