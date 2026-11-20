type Token = { type: 'num' | 'id' | 'op' | 'lp' | 'rp'; value: string }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (/[0-9]/.test(ch)) {
      let num = ''
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++]
      tokens.push({ type: 'num', value: num })
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let id = ''
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) id += expr[i++]
      tokens.push({ type: 'id', value: id })
      continue
    }
    if ('+-*/'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'lp', value: ch })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'rp', value: ch })
      i++
      continue
    }
    throw new Error(`表达式含非法字符: ${ch}`)
  }
  return tokens
}

class Parser {
  private pos = 0
  constructor(private tokens: Token[], private vars: Record<string, number>) {}

  parse(): number {
    const value = this.expr()
    if (this.pos !== this.tokens.length) throw new Error('表达式格式错误')
    return value
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private expr(): number {
    let value = this.term()
    while (this.peek()?.type === 'op' && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.tokens[this.pos++].value
      const rhs = this.term()
      value = op === '+' ? value + rhs : value - rhs
    }
    return value
  }

  private term(): number {
    let value = this.factor()
    while (this.peek()?.type === 'op' && ['*', '/'].includes(this.peek()!.value)) {
      const op = this.tokens[this.pos++].value
      const rhs = this.factor()
      if (op === '/' && rhs === 0) throw new Error('除数不能为 0')
      value = op === '*' ? value * rhs : value / rhs
    }
    return value
  }

  private factor(): number {
    const token = this.tokens[this.pos++]
    if (!token) throw new Error('表达式不完整')
    if (token.type === 'num') return Number(token.value)
    if (token.type === 'id') {
      if (!(token.value in this.vars)) throw new Error(`未知变量: ${token.value}`)
      return this.vars[token.value]
    }
    if (token.type === 'lp') {
      const value = this.expr()
      if (this.peek()?.type !== 'rp') throw new Error('缺少右括号')
      this.pos++
      return value
    }
    throw new Error(`意外的符号: ${token.value}`)
  }
}

export function evaluate(expr: string, vars: Record<string, number> = {}): number {
  const resolved = render(expr, vars)
  return new Parser(tokenize(resolved), {}).parse()
}

export function render(template: string, vars: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`模板变量未定义: ${key}`)
    return String(vars[key])
  })
}

export function safeConstraint(expr: string, vars: Record<string, number>): boolean {
  const allowed = /^[\w\s+\-*/()%>=<!&|]+$/
  if (!allowed.test(expr)) return false
  try {
    const jsExpr = expr.replace(/\{(\w+)\}|\b([a-zA-Z_]\w*)\b/g, (_, braced: string, bare: string) => {
      const key = braced ?? bare
      if (!(key in vars)) throw new Error(`未知变量: ${key}`)
      return String(vars[key])
    })
    if (!/^[\d\s+\-*/()%>=<!&|]+$/.test(jsExpr)) return false
    return Function(`"use strict";return (${jsExpr})`)() as boolean
  } catch {
    return false
  }
}
