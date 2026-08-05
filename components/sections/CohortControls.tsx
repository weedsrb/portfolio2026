'use client'

import { useMemo, useRef, useState } from 'react'

import { RetentionChart } from '@/components/charts/RetentionChart'
import { Panel } from '@/components/sections/Section'
import { useInference } from '@/hooks/useInference'
import { COHORTS, COHORT_DEFINITION, COHORT_READING } from '@/data/fixtures/cohorts'

/**
 * The cohort explorer.
 *
 * The knob that matters is not the chart type, it is the definition. "Retained"
 * meaning *active this week* and "retained" meaning *active any week since* are
 * different questions with the same name, and they produce numbers far enough
 * apart that quoting one without the other is close to meaningless.
 *
 * So that is what is adjustable here — and the headline number moves with it,
 * in front of you.
 */

type Basis = 'weekly' | 'ever'

const BASIS_LABEL: Record<Basis, string> = {
  weekly: 'Confirmed an order in that week',
  ever: 'Confirmed an order in that week or any week since',
}

/**
 * "Active that week, or any week since."
 *
 * A running maximum taken backwards from the end: week k counts anyone who was
 * active at k or later. On the wobbly weekly series this is genuinely more
 * generous than the weekly figure, which is the point — the same cohort, the
 * same data, a different question, a different headline number.
 */
function asEver(retention: number[]): number[] {
  const out = [...retention]
  for (let i = out.length - 2; i >= 0; i--) {
    out[i] = Math.max(out[i]!, out[i + 1]!)
  }
  return out
}

export function CohortControls() {
  const { recordEngagement } = useInference()
  const [basis, setBasis] = useState<Basis>('weekly')
  const [minWeek, setMinWeek] = useState(0)
  const depth = useRef<'opened' | 'interacted' | 'completed'>('opened')

  function note(changedBasis: boolean) {
    if (depth.current === 'opened') {
      depth.current = 'interacted'
      recordEngagement(5, 'interacted')
      return
    }
    // Switching the definition is the point of the module.
    if (depth.current === 'interacted' && changedBasis) {
      depth.current = 'completed'
      recordEngagement(5, 'completed')
    }
  }

  const cohorts = useMemo(
    () =>
      COHORTS.filter((c) => c.retention.length > minWeek).map((c) => ({
        ...c,
        retention: basis === 'ever' ? asEver(c.retention) : c.retention,
      })),
    [basis, minWeek],
  )

  // The one number someone would quote in a meeting, recomputed live.
  const headline = useMemo(() => {
    const week4 = cohorts
      .map((c) => c.retention[4])
      .filter((v): v is number => typeof v === 'number')
    if (week4.length === 0) return null
    return week4.reduce((a, b) => a + b, 0) / week4.length
  }, [cohorts])

  return (
    <>
      <Panel label="Definition — change it and watch the number move">
        <div className="px-4 py-4">
          <fieldset>
            <legend className="annotation">Retained means</legend>
            <div className="mt-2 space-y-2">
              {(['weekly', 'ever'] as const).map((option) => (
                <label key={option} className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="basis"
                    checked={basis === option}
                    onChange={() => {
                      setBasis(option)
                      note(true)
                    }}
                    className="mt-1 accent-[var(--color-signal)]"
                  />
                  <span className="text-sm">{BASIS_LABEL[option]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 block border-t border-graticule pt-4">
            <span className="flex items-baseline justify-between">
              <span className="annotation">
                Exclude cohorts younger than
              </span>
              <span className="font-mono text-sm text-signal">
                {minWeek} {minWeek === 1 ? 'week' : 'weeks'}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={minWeek}
              onChange={(e) => {
                setMinWeek(Number(e.target.value))
                note(false)
              }}
              className="mt-2 w-full accent-[var(--color-signal)]"
            />
            <span className="mt-1 block text-xs text-ink-muted">
              Young cohorts have not had time to churn, so leaving them in
              flatters the average.
            </span>
          </label>
        </div>

        <div
          aria-live="polite"
          className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-graticule px-4 py-3"
        >
          <span className="annotation">Week-4 retention, averaged</span>
          <span className="font-mono text-lg text-signal">
            {headline === null ? '—' : `${(headline * 100).toFixed(1)}%`}
          </span>
          <span className="font-mono text-xs text-ink-muted">
            over {cohorts.length} {cohorts.length === 1 ? 'cohort' : 'cohorts'}
          </span>
        </div>
      </Panel>

      <Panel label="Retention by cohort" className="mt-8">
        <div className="px-4 py-6">
          <RetentionChart cohorts={cohorts} />
        </div>
      </Panel>

      <Panel label="Fixed by the pipeline" className="mt-8">
        <dl className="divide-y divide-graticule/60">
          {[
            ['Cohorted by', COHORT_DEFINITION.cohortBy],
            ['Excludes', COHORT_DEFINITION.excludes],
          ].map(([term, value]) => (
            <div key={term} className="px-4 py-3 sm:flex sm:gap-6">
              <dt className="annotation sm:w-32 sm:shrink-0 sm:pt-0.5">{term}</dt>
              <dd className="mt-1 text-sm text-ink-muted sm:mt-0">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <p className="prose-measure mt-6 text-sm">{COHORT_READING}</p>
    </>
  )
}
