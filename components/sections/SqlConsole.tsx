'use client'

import { useRef, useState } from 'react'

import { Panel } from '@/components/sections/Section'
import { useInference } from '@/hooks/useInference'
import { FEATURED_QUERY, QUERY_READING, SCHEMA } from '@/data/fixtures/orders'
import { DEMO_TENANT, MERCHANT_ROWS, ORDER_ROWS } from '@/data/fixtures/orders-rows'
import { SqlError, execute, type Result, type Table } from '@/lib/sql/execute'

/**
 * The query console.
 *
 * The SQL engine is hand-written — tokenizer, parser, evaluator, about 500
 * lines with 30 unit tests. That is a deliberate choice over shipping
 * DuckDB-WASM, which would have meant a 36MB binary and a network request, and
 * would have made the page's "nothing leaves your browser" claim need an
 * asterisk. It supports a subset, says so, and refuses what it cannot do rather
 * than guessing.
 *
 * Because the engine is pure, this runs identically on the server and in the
 * browser: the initial HTML already contains real computed results, and the
 * page works with JavaScript off.
 */

const TABLES: Table[] = [
  { name: 'orders', rows: ORDER_ROWS },
  { name: 'merchants', rows: MERCHANT_ROWS },
]

const EXAMPLES = [
  {
    label: 'Confidence vs. left alone',
    sql: FEATURED_QUERY,
  },
  {
    label: 'Which script is hardest to parse?',
    sql: `-- Mixed Arabic/English is where the parser struggles most.
select
  script,
  count(*)                              as orders,
  round(avg(parse_confidence), 3)       as avg_confidence,
  round(100.0 * avg(case when needed_edit
                    then 1 else 0 end), 1) as pct_edited
from orders
where merchant_id = current_tenant()
group by 1
order by 4 desc;`,
  },
  {
    label: 'Tenant isolation',
    sql: `-- Every merchant's rows, to show the tenant predicate is doing work.
-- In production this is enforced in the database too, not just here.
select merchant_id, count(*) as orders
from orders
group by 1
order by 2 desc;`,
  },
] as const

function formatCell(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    // Print what the query actually produced. Padding 14.3 out to "14.300"
    // implies a precision the round() in the query deliberately discarded.
    return String(Math.round(value * 1e6) / 1e6)
  }
  return String(value)
}

type Outcome =
  | { ok: true; result: Result }
  | { ok: false; message: string }

/*
 * Deliberately does not time itself. Timing is measured by `run` and kept in
 * state, because `performance.now()` returns different numbers on the server
 * and in the browser — rendering it during the first pass is a guaranteed
 * hydration mismatch, and it cost one to find that out.
 */
/** Runs and times a query. Module scope: never called during render. */
function runQueryTimed(sql: string): { outcome: Outcome; ms: number } {
  const started = performance.now()
  const outcome = runQuery(sql)
  return { outcome, ms: performance.now() - started }
}

function runQuery(sql: string): Outcome {
  try {
    return { ok: true, result: execute(sql, TABLES, { tenant: DEMO_TENANT }) }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof SqlError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Something went wrong running that.',
    }
  }
}

export function SqlConsole() {
  const { recordEngagement } = useInference()
  const [sql, setSql] = useState<string>(FEATURED_QUERY)
  /*
   * The initial result is computed in the state initialiser, which runs on the
   * server and in the browser and produces the same rows both times — so the
   * server-rendered HTML already contains real results and there is nothing to
   * reconcile. Later runs replace it, and are executed exactly once.
   */
  const [outcome, setOutcome] = useState<Outcome>(() => runQuery(FEATURED_QUERY))
  const [ms, setMs] = useState<number | null>(null)
  const depth = useRef<'opened' | 'interacted' | 'completed'>('opened')

  function run(next: string) {
    const { outcome: result, ms: elapsed } = runQueryTimed(next)
    setMs(elapsed)
    setOutcome(result)
    if (depth.current === 'opened') {
      depth.current = 'interacted'
      recordEngagement(2, 'interacted')
      return
    }
    // Writing a query of their own — not just running a provided one — is the
    // point at which someone has actually used this.
    if (depth.current === 'interacted' && !EXAMPLES.some((e) => e.sql === next)) {
      depth.current = 'completed'
      recordEngagement(2, 'completed')
    }
  }

  return (
    <>
      <Panel label="Schema">
        <div className="grid gap-px bg-graticule sm:grid-cols-2">
          {SCHEMA.map((table) => {
            const queryable = TABLES.some((t) => t.name === table.name)
            return (
              <div key={table.name} className="bg-surface-sunk p-4">
                <h4 className="flex items-baseline gap-2 font-mono text-sm font-medium">
                  {table.name}
                  {queryable ? (
                    <span className="annotation text-signal">queryable</span>
                  ) : (
                    <span className="annotation">shape only</span>
                  )}
                </h4>
                <p className="mt-1 text-xs text-ink-muted">{table.note}</p>
                <ul className="mt-3 space-y-1">
                  {table.columns.map((column) => (
                    <li key={column.name} className="flex flex-wrap gap-x-2 font-mono text-xs">
                      <span>{column.name}</span>
                      <span className="text-ink-muted">{column.type}</span>
                      {column.note ? (
                        <span className="text-ink-muted">— {column.note}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel label="Query — edit it and run" className="mt-8">
        <div className="flex flex-wrap gap-2 border-b border-graticule px-4 py-2.5">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => {
                setSql(example.sql)
                run(example.sql)
              }}
              className="border border-graticule px-2 py-1 font-mono text-[11px] hover:border-ink"
            >
              {example.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="sr-only">SQL query</span>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(sql)
            }}
            spellCheck={false}
            rows={12}
            className="block w-full resize-y bg-surface-sunk px-4 py-4 font-mono text-xs leading-relaxed text-ink focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-3 border-t border-graticule px-4 py-2.5">
          <button
            type="button"
            onClick={() => run(sql)}
            className="border border-ink px-3 py-1.5 font-mono text-xs hover:border-signal hover:text-signal"
          >
            Run
          </button>
          <span className="font-mono text-[11px] text-ink-muted">
            or ⌘/Ctrl + Enter
          </span>
          <span className="ml-auto font-mono text-[11px] text-ink-muted">
            {ORDER_ROWS.length} rows, in memory
          </span>
        </div>
      </Panel>

      <Panel label="Result" className="mt-8">
        <div aria-live="polite">
          {outcome.ok ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-5 border-b border-graticule px-4 py-2.5">
                <span className="font-mono text-xs">
                  <span className="text-signal">{outcome.result.rows.length}</span>
                  <span className="text-ink-muted">
                    {' '}
                    {outcome.result.rows.length === 1 ? 'row' : 'rows'}
                  </span>
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  scanned {outcome.result.scanned}
                </span>
                {ms === null ? null : (
                  <span className="font-mono text-xs text-ink-muted">
                    {ms.toFixed(1)} ms
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-graticule">
                      {outcome.result.columns.map((column) => (
                        <th key={column} scope="col" className="annotation px-4 py-2">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {outcome.result.rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-graticule/60 last:border-b-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2.5">
                            {formatCell(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {outcome.result.rows.length > 50 ? (
                <p className="border-t border-graticule px-4 py-2 font-mono text-[11px] text-ink-muted">
                  Showing the first 50 of {outcome.result.rows.length}.
                </p>
              ) : null}
            </>
          ) : (
            <div className="px-4 py-4">
              <p className="annotation text-ink">Query refused</p>
              <p className="prose-measure mt-2 font-mono text-xs text-ink">
                {outcome.message}
              </p>
              <p className="prose-measure mt-3 text-sm text-ink-muted">
                This engine is hand-written and supports a subset: SELECT with
                WHERE, GROUP BY, HAVING, ORDER BY and LIMIT, the usual
                aggregates, CASE, and a handful of scalar functions. No joins,
                no subqueries, no writes. It tells you what it cannot do rather
                than returning something that looks like an answer.
              </p>
            </div>
          )}
        </div>
      </Panel>

      <p className="prose-measure mt-6 text-sm">{QUERY_READING}</p>
    </>
  )
}
