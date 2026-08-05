/**
 * SQL parser for the supported subset.
 *
 * Recursive descent, standard precedence. Anything outside the subset raises a
 * SqlError naming what was not understood, rather than silently producing a
 * query that means something else.
 */

import { SqlError, tokenize, type Token } from './tokenize'

export type Expr =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'column'; name: string }
  | { kind: 'star' }
  | { kind: 'call'; name: string; args: Expr[] }
  | { kind: 'unary'; op: string; operand: Expr }
  | { kind: 'binary'; op: string; left: Expr; right: Expr }
  | { kind: 'case'; branches: { when: Expr; then: Expr }[]; otherwise: Expr | null }

export type SelectItem = { expr: Expr; alias: string | null }

export type OrderTerm = { expr: Expr; descending: boolean }

export type Query = {
  select: SelectItem[]
  from: string
  where: Expr | null
  groupBy: Expr[]
  having: Expr | null
  orderBy: OrderTerm[]
  limit: number | null
}

class Parser {
  private i = 0
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.i]
  }

  private at(value: string): boolean {
    const token = this.peek()
    return !!token && token.value.toUpperCase() === value
  }

  private take(): Token {
    const token = this.tokens[this.i]
    if (!token) throw new SqlError('Query ended sooner than expected')
    this.i++
    return token
  }

  private expect(value: string): Token {
    const token = this.peek()
    if (!token || token.value.toUpperCase() !== value) {
      throw new SqlError(
        `Expected ${value}${token ? `, found ${JSON.stringify(token.value)}` : ' but the query ended'}`,
        token?.at,
      )
    }
    return this.take()
  }

  private eat(value: string): boolean {
    if (this.at(value)) {
      this.take()
      return true
    }
    return false
  }

  parseQuery(): Query {
    this.expect('SELECT')
    // DISTINCT parses but is a no-op on the aggregate shapes this supports.
    this.eat('DISTINCT')

    const select = [this.parseSelectItem()]
    while (this.eat(',')) select.push(this.parseSelectItem())

    this.expect('FROM')
    const fromToken = this.take()
    if (fromToken.type !== 'ident') {
      throw new SqlError(`Expected a table name, found ${JSON.stringify(fromToken.value)}`, fromToken.at)
    }

    const where = this.eat('WHERE') ? this.parseExpr() : null

    const groupBy: Expr[] = []
    if (this.eat('GROUP')) {
      this.expect('BY')
      groupBy.push(this.parseExpr())
      while (this.eat(',')) groupBy.push(this.parseExpr())
    }

    const having = this.eat('HAVING') ? this.parseExpr() : null

    const orderBy: OrderTerm[] = []
    if (this.eat('ORDER')) {
      this.expect('BY')
      do {
        const expr = this.parseExpr()
        const descending = this.eat('DESC')
        if (!descending) this.eat('ASC')
        orderBy.push({ expr, descending })
      } while (this.eat(','))
    }

    let limit: number | null = null
    if (this.eat('LIMIT')) {
      const token = this.take()
      if (token.type !== 'number') {
        throw new SqlError('LIMIT needs a number', token.at)
      }
      limit = Number(token.value)
    }

    this.eat(';')

    const leftover = this.peek()
    if (leftover) {
      throw new SqlError(
        `Unexpected ${JSON.stringify(leftover.value)} after the end of the query`,
        leftover.at,
      )
    }

    return { select, from: fromToken.value, where, groupBy, having, orderBy, limit }
  }

  private parseSelectItem(): SelectItem {
    const expr = this.parseExpr()
    let alias: string | null = null
    if (this.eat('AS')) {
      const token = this.take()
      alias = token.value
    } else {
      const token = this.peek()
      // `count(*) total` — an alias without AS.
      if (token?.type === 'ident') alias = this.take().value
    }
    return { expr, alias }
  }

  parseExpr(): Expr {
    return this.parseOr()
  }

  private parseOr(): Expr {
    let left = this.parseAnd()
    while (this.eat('OR')) {
      left = { kind: 'binary', op: 'OR', left, right: this.parseAnd() }
    }
    return left
  }

  private parseAnd(): Expr {
    let left = this.parseNot()
    while (this.eat('AND')) {
      left = { kind: 'binary', op: 'AND', left, right: this.parseNot() }
    }
    return left
  }

  private parseNot(): Expr {
    if (this.eat('NOT')) {
      return { kind: 'unary', op: 'NOT', operand: this.parseNot() }
    }
    return this.parseComparison()
  }

  private parseComparison(): Expr {
    const left = this.parseAdditive()

    if (this.at('IS')) {
      this.take()
      const negated = this.eat('NOT')
      this.expect('NULL')
      const check: Expr = { kind: 'binary', op: 'IS NULL', left, right: { kind: 'literal', value: null } }
      return negated ? { kind: 'unary', op: 'NOT', operand: check } : check
    }

    const token = this.peek()
    if (token?.type === 'op' && ['=', '!=', '<>', '<', '<=', '>', '>='].includes(token.value)) {
      this.take()
      return { kind: 'binary', op: token.value, left, right: this.parseAdditive() }
    }
    return left
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative()
    for (;;) {
      const token = this.peek()
      if (token?.type === 'op' && (token.value === '+' || token.value === '-')) {
        this.take()
        left = { kind: 'binary', op: token.value, left, right: this.parseMultiplicative() }
      } else return left
    }
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary()
    for (;;) {
      const token = this.peek()
      if (token?.type === 'op' && ['*', '/', '%'].includes(token.value)) {
        this.take()
        left = { kind: 'binary', op: token.value, left, right: this.parseUnary() }
      } else return left
    }
  }

  private parseUnary(): Expr {
    const token = this.peek()
    if (token?.type === 'op' && token.value === '-') {
      this.take()
      return { kind: 'unary', op: '-', operand: this.parseUnary() }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): Expr {
    const token = this.take()

    if (token.type === 'number') return { kind: 'literal', value: Number(token.value) }
    if (token.type === 'string') return { kind: 'literal', value: token.value }

    if (token.type === 'op' && token.value === '*') return { kind: 'star' }

    if (token.value === '(') {
      const inner = this.parseExpr()
      this.expect(')')
      return inner
    }

    if (token.value === 'NULL') return { kind: 'literal', value: null }
    if (token.value === 'TRUE') return { kind: 'literal', value: true }
    if (token.value === 'FALSE') return { kind: 'literal', value: false }

    if (token.value === 'CASE') {
      const branches: { when: Expr; then: Expr }[] = []
      while (this.eat('WHEN')) {
        const when = this.parseExpr()
        this.expect('THEN')
        branches.push({ when, then: this.parseExpr() })
      }
      const otherwise = this.eat('ELSE') ? this.parseExpr() : null
      this.expect('END')
      if (branches.length === 0) throw new SqlError('CASE needs at least one WHEN', token.at)
      return { kind: 'case', branches, otherwise }
    }

    if (token.type === 'ident') {
      if (this.at('(')) {
        this.take()
        const args: Expr[] = []
        if (!this.at(')')) {
          args.push(this.parseExpr())
          while (this.eat(',')) args.push(this.parseExpr())
        }
        this.expect(')')
        return { kind: 'call', name: token.value.toLowerCase(), args }
      }
      return { kind: 'column', name: token.value }
    }

    throw new SqlError(`Did not expect ${JSON.stringify(token.value)} here`, token.at)
  }
}

export function parse(sql: string): Query {
  const tokens = tokenize(sql)
  if (tokens.length === 0) throw new SqlError('Empty query')
  return new Parser(tokens).parseQuery()
}
