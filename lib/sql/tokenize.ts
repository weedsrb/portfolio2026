/**
 * SQL tokenizer.
 *
 * Deliberately small. This engine supports a subset of SQL and says so — a
 * query it cannot run gets a clear error rather than a wrong answer, which is
 * the same rule the order validator follows.
 */

export type TokenType =
  | 'ident'
  | 'number'
  | 'string'
  | 'op'
  | 'punct'
  | 'keyword'

export type Token = {
  type: TokenType
  /** Upper-cased for keywords, verbatim otherwise. */
  value: string
  /** Character offset, so errors can point at the problem. */
  at: number
}

export const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
  'AS', 'AND', 'OR', 'NOT', 'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'ELSE',
  'END', 'NULL', 'IS', 'IN', 'DISTINCT', 'TRUE', 'FALSE',
])

const OPERATORS = ['<=', '>=', '<>', '!=', '=', '<', '>', '+', '-', '*', '/', '%']

export class SqlError extends Error {
  constructor(
    message: string,
    readonly at?: number,
  ) {
    super(message)
    this.name = 'SqlError'
  }
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const char = input[i]!

    if (/\s/.test(char)) {
      i++
      continue
    }

    // Line comments. The featured query is commented, and comments are part of
    // writing SQL a human will read.
    if (char === '-' && input[i + 1] === '-') {
      while (i < input.length && input[i] !== '\n') i++
      continue
    }

    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      const start = i
      while (i < input.length && /[0-9.]/.test(input[i]!)) i++
      tokens.push({ type: 'number', value: input.slice(start, i), at: start })
      continue
    }

    if (char === "'") {
      const start = i
      i++
      let value = ''
      while (i < input.length && input[i] !== "'") {
        value += input[i]
        i++
      }
      if (i >= input.length) throw new SqlError('Unterminated string literal', start)
      i++
      tokens.push({ type: 'string', value, at: start })
      continue
    }

    if (/[A-Za-z_]/.test(char)) {
      const start = i
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i]!)) i++
      const raw = input.slice(start, i)
      const upper = raw.toUpperCase()
      tokens.push({
        type: KEYWORDS.has(upper) ? 'keyword' : 'ident',
        value: KEYWORDS.has(upper) ? upper : raw,
        at: start,
      })
      continue
    }

    const op = OPERATORS.find((candidate) => input.startsWith(candidate, i))
    if (op) {
      tokens.push({ type: 'op', value: op, at: i })
      i += op.length
      continue
    }

    if ('(),;'.includes(char)) {
      tokens.push({ type: 'punct', value: char, at: i })
      i++
      continue
    }

    throw new SqlError(`Unexpected character ${JSON.stringify(char)}`, i)
  }

  return tokens
}
