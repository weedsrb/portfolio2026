/**
 * Evaluator for the supported SQL subset.
 *
 * Grouping is decided the way SQL decides it: a query with GROUP BY, or with an
 * aggregate anywhere in its select list, collapses rows into groups. Everything
 * else is a row-at-a-time projection.
 */

import { parse, type Expr, type Query } from './parse'
import { SqlError } from './tokenize'

export { SqlError }

export type Value = string | number | boolean | null
export type Row = Record<string, Value>
export type Table = { name: string; rows: Row[] }

export type Result = {
  columns: string[]
  rows: Value[][]
  /** Rows scanned before grouping, so the console can report real work done. */
  scanned: number
}

const AGGREGATES = new Set(['count', 'sum', 'avg', 'min', 'max'])

const SCALARS = new Set([
  'round', 'abs', 'lower', 'upper', 'length', 'coalesce', 'width_bucket',
])

const KNOWN_FUNCTIONS = [...AGGREGATES, ...SCALARS, 'current_tenant'].sort()

function isTruthy(value: Value): boolean {
  return value !== null && value !== false && value !== 0 && value !== ''
}

function num(value: Value, context: string): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value === null) return 0
  const parsed = Number(value)
  if (Number.isNaN(parsed)) throw new SqlError(`${context} needs a number, got ${JSON.stringify(value)}`)
  return parsed
}

function compare(a: Value, b: Value): number {
  if (a === null && b === null) return 0
  if (a === null) return -1
  if (b === null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
}

/** True when this expression contains an aggregate call anywhere inside it. */
function hasAggregate(expr: Expr): boolean {
  switch (expr.kind) {
    case 'call':
      return AGGREGATES.has(expr.name) || expr.args.some(hasAggregate)
    case 'unary':
      return hasAggregate(expr.operand)
    case 'binary':
      return hasAggregate(expr.left) || hasAggregate(expr.right)
    case 'case':
      return (
        expr.branches.some((b) => hasAggregate(b.when) || hasAggregate(b.then)) ||
        (expr.otherwise ? hasAggregate(expr.otherwise) : false)
      )
    default:
      return false
  }
}

type Context = {
  /** The row being projected, for non-aggregate expressions. */
  row: Row
  /** Every row in the current group, for aggregates. */
  group: Row[]
  tenant: string | null
}

function scalarCall(name: string, args: Value[]): Value {
  switch (name) {
    case 'round': {
      const value = num(args[0] ?? null, 'round()')
      const places = args.length > 1 ? num(args[1] ?? null, 'round()') : 0
      const factor = 10 ** places
      return Math.round(value * factor) / factor
    }
    case 'abs':
      return Math.abs(num(args[0] ?? null, 'abs()'))
    case 'lower':
      return String(args[0] ?? '').toLowerCase()
    case 'upper':
      return String(args[0] ?? '').toUpperCase()
    case 'length':
      return String(args[0] ?? '').length
    case 'coalesce':
      return args.find((a) => a !== null) ?? null
    case 'width_bucket': {
      // Postgres semantics: bucket 0 below the range, count+1 above it.
      const value = num(args[0] ?? null, 'width_bucket()')
      const low = num(args[1] ?? null, 'width_bucket()')
      const high = num(args[2] ?? null, 'width_bucket()')
      const count = num(args[3] ?? null, 'width_bucket()')
      if (value < low) return 0
      if (value >= high) return count + 1
      return Math.floor(((value - low) / (high - low)) * count) + 1
    }
    default:
      throw new SqlError(
        `This console does not support the function ${name}(). It supports count, sum, avg, min, max, round, abs, lower, upper, length, coalesce, width_bucket and current_tenant.`,
      )
  }
}

function aggregate(name: string, arg: Expr | undefined, context: Context): Value {
  const rows = context.group

  if (name === 'count') {
    if (!arg || arg.kind === 'star') return rows.length
    return rows.filter((row) => evaluate(arg, { ...context, row }) !== null).length
  }

  if (!arg) throw new SqlError(`${name}() needs an argument`)

  const values = rows
    .map((row) => evaluate(arg, { ...context, row }))
    .filter((v): v is Exclude<Value, null> => v !== null)

  if (values.length === 0) return null

  switch (name) {
    case 'sum':
      return values.reduce<number>((total, v) => total + num(v, 'sum()'), 0)
    case 'avg':
      return (
        values.reduce<number>((total, v) => total + num(v, 'avg()'), 0) /
        values.length
      )
    case 'min':
      return values.reduce((best, v) => (compare(v, best) < 0 ? v : best))
    case 'max':
      return values.reduce((best, v) => (compare(v, best) > 0 ? v : best))
    default:
      throw new SqlError(`Unknown aggregate ${name}()`)
  }
}

function evaluate(expr: Expr, context: Context): Value {
  switch (expr.kind) {
    case 'literal':
      return expr.value

    case 'star':
      return 1

    case 'column': {
      if (!(expr.name in context.row)) {
        throw new SqlError(
          `There is no column called "${expr.name}". Available: ${Object.keys(context.row).join(', ')}`,
        )
      }
      return context.row[expr.name] ?? null
    }

    case 'call': {
      // Checked before the arguments are evaluated, so `median(x)` reports the
      // unsupported function rather than complaining about a column inside it.
      if (!AGGREGATES.has(expr.name) && !SCALARS.has(expr.name) && expr.name !== 'current_tenant') {
        throw new SqlError(
          `This console does not support the function ${expr.name}(). It supports: ${KNOWN_FUNCTIONS.join(', ')}.`,
        )
      }
      if (expr.name === 'current_tenant') return context.tenant
      if (AGGREGATES.has(expr.name)) return aggregate(expr.name, expr.args[0], context)
      return scalarCall(expr.name, expr.args.map((a) => evaluate(a, context)))
    }

    case 'unary': {
      if (expr.op === 'NOT') return !isTruthy(evaluate(expr.operand, context))
      return -num(evaluate(expr.operand, context), 'negation')
    }

    case 'case': {
      for (const branch of expr.branches) {
        if (isTruthy(evaluate(branch.when, context))) return evaluate(branch.then, context)
      }
      return expr.otherwise ? evaluate(expr.otherwise, context) : null
    }

    case 'binary': {
      if (expr.op === 'AND') {
        return isTruthy(evaluate(expr.left, context)) && isTruthy(evaluate(expr.right, context))
      }
      if (expr.op === 'OR') {
        return isTruthy(evaluate(expr.left, context)) || isTruthy(evaluate(expr.right, context))
      }
      if (expr.op === 'IS NULL') return evaluate(expr.left, context) === null

      const left = evaluate(expr.left, context)
      const right = evaluate(expr.right, context)

      switch (expr.op) {
        case '=': return compare(left, right) === 0
        case '!=':
        case '<>': return compare(left, right) !== 0
        case '<': return compare(left, right) < 0
        case '<=': return compare(left, right) <= 0
        case '>': return compare(left, right) > 0
        case '>=': return compare(left, right) >= 0
        case '+': return num(left, '+') + num(right, '+')
        case '-': return num(left, '-') - num(right, '-')
        case '*': return num(left, '*') * num(right, '*')
        case '/': {
          const divisor = num(right, '/')
          return divisor === 0 ? null : num(left, '/') / divisor
        }
        case '%': return num(left, '%') % num(right, '%')
        default:
          throw new SqlError(`Unsupported operator ${expr.op}`)
      }
    }
  }
}

function columnName(item: { expr: Expr; alias: string | null }, index: number): string {
  if (item.alias) return item.alias
  if (item.expr.kind === 'column') return item.expr.name
  if (item.expr.kind === 'call') return item.expr.name
  return `column_${index + 1}`
}

/**
 * `ORDER BY 1` and `GROUP BY 1` refer to select-list position, which is how the
 * featured query is written and how most people actually write these.
 */
function resolveOrdinal(expr: Expr, query: Query): Expr {
  if (expr.kind === 'literal' && typeof expr.value === 'number') {
    const item = query.select[expr.value - 1]
    if (!item) throw new SqlError(`There is no column ${expr.value} in the select list`)
    return item.expr
  }
  return expr
}

export function execute(
  sql: string,
  tables: Table[],
  options: { tenant?: string | null } = {},
): Result {
  const query = parse(sql)

  const table = tables.find((t) => t.name === query.from)
  if (!table) {
    throw new SqlError(
      `There is no table called "${query.from}". Available: ${tables.map((t) => t.name).join(', ')}`,
    )
  }

  const tenant = options.tenant ?? null
  const base: Context = { row: {}, group: [], tenant }

  let rows = table.rows
  const scanned = rows.length

  if (query.where) {
    rows = rows.filter((row) => isTruthy(evaluate(query.where!, { ...base, row, group: [row] })))
  }

  // Expand `select *` before anything else looks at the select list.
  const selectItems = query.select.flatMap((item, index) =>
    item.expr.kind === 'star'
      ? Object.keys(table.rows[0] ?? {}).map((name) => ({
          expr: { kind: 'column' as const, name },
          alias: name,
        }))
      : [{ ...item, alias: item.alias ?? columnName(item, index) }],
  )

  const grouped = query.groupBy.length > 0 || selectItems.some((i) => hasAggregate(i.expr))

  let outputRows: { row: Row; group: Row[] }[]

  if (!grouped) {
    outputRows = rows.map((row) => ({ row, group: [row] }))
  } else if (query.groupBy.length === 0) {
    // A bare aggregate over everything still produces exactly one row.
    outputRows = [{ row: rows[0] ?? {}, group: rows }]
  } else {
    const keys = query.groupBy.map((expr) => resolveOrdinal(expr, query))
    const buckets = new Map<string, Row[]>()
    for (const row of rows) {
      const key = JSON.stringify(keys.map((expr) => evaluate(expr, { ...base, row, group: [row] })))
      const bucket = buckets.get(key)
      if (bucket) bucket.push(row)
      else buckets.set(key, [row])
    }
    outputRows = [...buckets.values()].map((group) => ({ row: group[0]!, group }))
  }

  let projected = outputRows.map(({ row, group }) => {
    const context: Context = { row, group, tenant }
    return {
      values: selectItems.map((item) => evaluate(item.expr, context)),
      context,
    }
  })

  if (query.having) {
    projected = projected.filter((p) => isTruthy(evaluate(query.having!, p.context)))
  }

  if (query.orderBy.length > 0) {
    const terms = query.orderBy.map((term) => ({
      expr: resolveOrdinal(term.expr, query),
      descending: term.descending,
    }))
    projected.sort((a, b) => {
      for (const term of terms) {
        const diff = compare(evaluate(term.expr, a.context), evaluate(term.expr, b.context))
        if (diff !== 0) return term.descending ? -diff : diff
      }
      return 0
    })
  }

  if (query.limit !== null) projected = projected.slice(0, query.limit)

  return {
    columns: selectItems.map((item, i) => item.alias ?? columnName(item, i)),
    rows: projected.map((p) => p.values),
    scanned,
  }
}
