import { scaleLinear } from 'd3-scale'

import { Panel, Section } from '@/components/sections/Section'
import { SECTIONS } from '@/data/content'
import {
  CHUNKS,
  COSINE_SOURCE,
  CUTOFF,
  CUTOFF_READING,
  SIMILARITY_QUERY,
} from '@/data/fixtures/similarity'

/**
 * Section 3 — the similarity explorer.
 *
 * Phase 2 renders the ranked chunks against a fixed cutoff. Phase 6 makes k and
 * the cutoff draggable so you can watch results cross the line.
 */

const DOMAIN_MIN = 0.65
const DOMAIN_MAX = 0.95

const x = scaleLinear().domain([DOMAIN_MIN, DOMAIN_MAX]).range([0, 100]).clamp(true)

export function SimilarityExplorer() {
  const cutoffPercent = x(CUTOFF)

  return (
    <Section content={SECTIONS[3]}>
      <Panel label="Query">
        <p className="px-4 py-4 font-mono text-sm">{SIMILARITY_QUERY}</p>
      </Panel>

      <Panel label={`Top ${CHUNKS.length} by cosine`} className="mt-8">
        {/*
          The cutoff, drawn once across the whole plot as an axis would be.
          Positioned against the same track the bars are measured in — the rows
          are padded by 1rem on each side, so the line has to be inset to match
          or it stops meaning anything.
        */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-ink"
            style={{ left: `calc(1rem + (100% - 2rem) * ${cutoffPercent / 100})` }}
          />

          <ul>
            {CHUNKS.map((chunk) => {
              const retrieved = chunk.score >= CUTOFF
              return (
                <li
                  key={chunk.id}
                  className="border-b border-graticule/60 px-4 py-4 last:border-b-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="annotation">{chunk.id}</span>
                    <span className="font-mono text-xs text-ink-muted">
                      {chunk.source}
                    </span>
                    <span
                      className={`ml-auto font-mono text-sm ${
                        retrieved ? 'text-signal' : 'text-ink-muted'
                      }`}
                    >
                      {chunk.score.toFixed(3)}
                    </span>
                  </div>

                  {/* Score bar. Width is the measurement, not decoration. */}
                  <div className="mt-2.5 h-1 w-full bg-graticule">
                    <div
                      className={`h-full ${retrieved ? 'bg-signal' : 'bg-ink-muted/40'}`}
                      style={{ width: `${x(chunk.score)}%` }}
                    />
                  </div>

                  <p className="prose-measure mt-3 text-sm text-ink-muted">
                    {chunk.text}
                  </p>

                  {chunk.misleading ? (
                    <p className="mt-2 font-mono text-xs text-ink">
                      Scores respectably. Answers nothing.
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-t border-graticule px-4 py-2.5">
          <span className="annotation">Cutoff</span>
          <span className="font-mono text-sm">{CUTOFF.toFixed(2)}</span>
        </div>
      </Panel>

      <p className="prose-measure mt-6 text-sm">{CUTOFF_READING}</p>

      <Panel label="cosine.ts" className="mt-8">
        <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed">
          <code>{COSINE_SOURCE}</code>
        </pre>
      </Panel>
    </Section>
  )
}
