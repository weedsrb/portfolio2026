'use client'

import { useMemo, useRef, useState } from 'react'
import { scaleLinear } from 'd3-scale'

import { Panel } from '@/components/sections/Section'
import { useInference } from '@/hooks/useInference'
import {
  CHUNKS,
  CUTOFF,
  CUTOFF_READING,
  SCORE_AXIS,
  SIMILARITY_QUERY,
} from '@/data/fixtures/similarity'

/**
 * The similarity explorer.
 *
 * The embeddings and their cosine scores are pre-computed — that part is
 * arithmetic done once, and recomputing it in the browser would prove nothing.
 * What is live is the decision: k and the cutoff, the two knobs that actually
 * determine what a retrieval system hands to a model.
 *
 * Drag the cutoff down and watch fluent boilerplate cross the line into your
 * results. That is the failure mode worth showing, because it is the one that
 * looks like success.
 */

const x = scaleLinear()
  .domain([SCORE_AXIS.min, SCORE_AXIS.max])
  .range([0, 100])
  .clamp(true)

export function SimilarityControls() {
  const { recordEngagement } = useInference()
  const [cutoff, setCutoff] = useState(CUTOFF)
  /*
   * Starts at every chunk, so the cutoff is the operative knob. At k=4 the two
   * boilerplate chunks rank 5th and 6th and sit outside k entirely, which means
   * lowering the cutoff could never pull noise in — and pulling noise in is the
   * whole demonstration.
   */
  const [k, setK] = useState(CHUNKS.length)
  const depth = useRef<'opened' | 'interacted' | 'completed'>('opened')

  function note(kind: 'cutoff' | 'k') {
    if (depth.current === 'opened') {
      depth.current = 'interacted'
      recordEngagement(3, 'interacted')
      return
    }
    // Moving the cutoff far enough to change what comes back is the moment the
    // point of the section lands.
    if (depth.current === 'interacted' && kind === 'cutoff') {
      depth.current = 'completed'
      recordEngagement(3, 'completed')
    }
  }

  const ranked = useMemo(() => [...CHUNKS].sort((a, b) => b.score - a.score), [])
  const considered = ranked.slice(0, k)
  const retrieved = considered.filter((c) => c.score >= cutoff)
  const noise = retrieved.filter((c) => c.misleading).length

  const cutoffPercent = x(cutoff)

  return (
    <>
      <Panel label="Query">
        <p className="px-4 py-4 font-mono text-sm">{SIMILARITY_QUERY}</p>
      </Panel>

      <Panel label="Controls" className="mt-8">
        <div className="grid gap-6 px-4 py-4 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="annotation">Cutoff</span>
              <span className="font-mono text-sm text-signal">
                {cutoff.toFixed(3)}
              </span>
            </span>
            <input
              type="range"
              min={SCORE_AXIS.min}
              max={SCORE_AXIS.max}
              step={0.001}
              value={cutoff}
              onChange={(e) => {
                setCutoff(Number(e.target.value))
                note('cutoff')
              }}
              className="mt-2 w-full accent-[var(--color-signal)]"
              aria-describedby="cutoff-help"
            />
            <span id="cutoff-help" className="mt-1 block text-xs text-ink-muted">
              Below this score, a chunk is not retrieved.
            </span>
          </label>

          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="annotation">k — chunks considered</span>
              <span className="font-mono text-sm text-signal">{k}</span>
            </span>
            <input
              type="range"
              min={1}
              max={CHUNKS.length}
              step={1}
              value={k}
              onChange={(e) => {
                setK(Number(e.target.value))
                note('k')
              }}
              className="mt-2 w-full accent-[var(--color-signal)]"
            />
            <span className="mt-1 block text-xs text-ink-muted">
              How many nearest neighbours to look at before filtering.
            </span>
          </label>
        </div>

        {/* The outcome of the two knobs, stated plainly. */}
        <div
          aria-live="polite"
          className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-graticule px-4 py-3"
        >
          <span className="font-mono text-sm">
            <span className="text-signal">{retrieved.length}</span>
            <span className="text-ink-muted"> retrieved of {k} considered</span>
          </span>
          {noise > 0 ? (
            <span className="font-mono text-xs text-ink">
              {noise} of them {noise === 1 ? 'is' : 'are'} boilerplate that
              answers nothing
            </span>
          ) : retrieved.length === 0 ? (
            <span className="font-mono text-xs text-ink">
              Nothing passes. Better than fluent noise.
            </span>
          ) : (
            <span className="font-mono text-xs text-ink-muted">
              All of them actually bear on the question.
            </span>
          )}
        </div>
      </Panel>

      <Panel label={`Ranked by cosine`} className="mt-8">
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-ink"
            style={{ left: `calc(1rem + (100% - 2rem) * ${cutoffPercent / 100})` }}
          />

          <ul>
            {ranked.map((chunk, i) => {
              const beyondK = i >= k
              const passes = !beyondK && chunk.score >= cutoff
              return (
                <li
                  key={chunk.id}
                  className={`border-b border-graticule/60 px-4 py-4 last:border-b-0 ${
                    beyondK ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="annotation">{chunk.id}</span>
                    <span className="font-mono text-xs text-ink-muted">
                      {chunk.source}
                    </span>
                    <span
                      className={`ml-auto font-mono text-sm ${
                        passes ? 'text-signal' : 'text-ink-muted'
                      }`}
                    >
                      {chunk.score.toFixed(3)}
                    </span>
                  </div>

                  <div className="mt-2.5 h-1 w-full bg-graticule">
                    <div
                      className={`h-full ${passes ? 'bg-signal' : 'bg-ink-muted/40'}`}
                      style={{ width: `${x(chunk.score)}%` }}
                    />
                  </div>

                  <p className="prose-measure mt-3 text-sm text-ink-muted">
                    {chunk.text}
                  </p>

                  {chunk.misleading && passes ? (
                    <p className="mt-2 font-mono text-xs text-ink">
                      Retrieved, and it answers nothing. This is what too low a
                      cutoff buys you.
                    </p>
                  ) : chunk.misleading ? (
                    <p className="mt-2 font-mono text-xs text-ink-muted">
                      Scores respectably. Answers nothing.
                    </p>
                  ) : null}

                  {beyondK ? (
                    <p className="mt-2 font-mono text-xs text-ink-muted">
                      Outside k — never even looked at.
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </Panel>

      <p className="prose-measure mt-6 text-sm">{CUTOFF_READING}</p>
    </>
  )
}
