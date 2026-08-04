import { Panel, Section } from '@/components/sections/Section'
import { SECTIONS } from '@/data/content'
import {
  FEATURED_QUERY,
  FEATURED_QUERY_RESULT,
  QUERY_READING,
  SCHEMA,
} from '@/data/fixtures/orders'

/**
 * Section 2 — the query console.
 *
 * Phase 2 shows the schema, the query and its real result. Phase 6 loads the
 * rows into DuckDB-WASM and makes the query editable.
 */
export function QueryConsole() {
  return (
    <Section content={SECTIONS[2]}>
      <Panel label="Schema">
        <div className="grid gap-px bg-graticule sm:grid-cols-2">
          {SCHEMA.map((table) => (
            <div key={table.name} className="bg-surface-sunk p-4">
              <h4 className="font-mono text-sm font-medium">{table.name}</h4>
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
          ))}
        </div>
      </Panel>

      <Panel label="Query" className="mt-8">
        <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed">
          <code>{FEATURED_QUERY}</code>
        </pre>
      </Panel>

      <Panel label="Result" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <caption className="sr-only">
              Order outcomes bucketed by the parser&rsquo;s reported confidence
            </caption>
            <thead>
              <tr className="border-b border-graticule">
                {[
                  'confidence_bucket',
                  'orders',
                  'pct_untouched',
                  'pct_confirmed',
                ].map((header) => (
                  <th key={header} scope="col" className="annotation px-4 py-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {FEATURED_QUERY_RESULT.map((row) => (
                <tr
                  key={row.confidence_bucket}
                  className="border-b border-graticule/60 last:border-b-0"
                >
                  <td className="px-4 py-2.5">{row.confidence_bucket}</td>
                  <td className="px-4 py-2.5">{row.orders}</td>
                  <td className="px-4 py-2.5">{row.pct_untouched.toFixed(1)}</td>
                  <td className="px-4 py-2.5">{row.pct_confirmed.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="prose-measure mt-6 text-sm">{QUERY_READING}</p>
    </Section>
  )
}
