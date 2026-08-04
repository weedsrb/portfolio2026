'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'

import { Readout } from '@/components/readout/Readout'
import {
  infer,
  initialHypothesis,
  type Hypothesis,
  type Observation,
} from '@/lib/inference/engine'
import type { Persona } from '@/lib/inference/personas'
import { ENGAGEMENT_DEPTH, dwellStrength } from '@/lib/inference/signals'

/**
 * Phase 3 harness.
 *
 * The readout is design-complete here but is NOT yet wired to real signals —
 * nothing on the page is being observed. It therefore only mounts under
 * `?debug=1`, because a readout showing a hypothesis that nothing computed
 * would be exactly the lie this whole page is built to avoid. Removing this
 * gate is the first step of phase 5.
 *
 * The scenarios below are canned observation sets run through the real engine,
 * rather than a confidence slider. That matters: it means the confidence and
 * the signal list shown are genuinely produced by the same code that will run
 * in production, so what gets design-reviewed here is the real thing.
 */

const T = 0

type Scenario = {
  id: string
  label: string
  /** Which of the four states this is here to exercise. */
  exercises: string
  observations: Observation[]
  elapsed: number
}

const SCENARIOS: Scenario[] = [
  {
    id: 'cold',
    label: 'Just arrived',
    exercises: 'unresolved',
    observations: [],
    elapsed: 0,
  },
  {
    id: 'leaning',
    label: 'From GitHub, poked the worker',
    exercises: 'forming',
    // Calibrated to land in `forming` (conf ≈ 0.37): enough to have a view,
    // not enough to reorder anything. Merely *opening* the module is weaker
    // than this and correctly leaves the page unresolved.
    observations: [
      { signal: 'ref_github', strength: 1, at: T },
      { signal: 'engage_4', strength: ENGAGEMENT_DEPTH.interacted, at: T + 30_000 },
    ],
    elapsed: 35_000,
  },
  {
    id: 'engineer',
    label: 'Engineer, read the internals',
    exercises: 'resolved',
    observations: [
      { signal: 'ref_github', strength: 1, at: T },
      { signal: 'device_wide_pointer', strength: 1, at: T },
      { signal: 'dwell_4', strength: dwellStrength(35), at: T + 40_000 },
      { signal: 'engage_4', strength: ENGAGEMENT_DEPTH.interacted, at: T + 50_000 },
      { signal: 'dwell_3', strength: dwellStrength(25), at: T + 80_000 },
      { signal: 'outbound_github', strength: 1, at: T + 95_000 },
    ],
    elapsed: 100_000,
  },
  {
    id: 'analyst',
    label: 'Analyst, lived in the SQL',
    exercises: 'resolved',
    observations: [
      { signal: 'dwell_2', strength: dwellStrength(45), at: T + 50_000 },
      { signal: 'engage_2', strength: ENGAGEMENT_DEPTH.completed, at: T + 70_000 },
      { signal: 'dwell_5', strength: dwellStrength(35), at: T + 110_000 },
      { signal: 'engage_5', strength: ENGAGEMENT_DEPTH.interacted, at: T + 125_000 },
    ],
    elapsed: 130_000,
  },
  {
    id: 'client',
    label: 'Client, on a phone',
    exercises: 'resolved',
    observations: [
      { signal: 'device_small_touch', strength: 1, at: T },
      { signal: 'dwell_6', strength: dwellStrength(30), at: T + 35_000 },
      { signal: 'engage_6', strength: ENGAGEMENT_DEPTH.interacted, at: T + 45_000 },
      { signal: 'outbound_email', strength: 1, at: T + 60_000 },
    ],
    elapsed: 65_000,
  },
]

/** No subscription: the query string does not change under us. */
const noSubscribe = () => () => {}

function useDebugFlag(): boolean {
  // Read from location rather than useSearchParams so the page stays statically
  // prerendered and normal visitors ship none of this. useSyncExternalStore is
  // the hydration-safe way to read a client-only value: the server snapshot is
  // false, so the markup matches and the client corrects it in one pass.
  return useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get('debug') === '1',
    () => false,
  )
}

export function DebugMount() {
  const enabled = useDebugFlag()
  const [scenarioId, setScenarioId] = useState('cold')
  const [pinned, setPinned] = useState<Persona | null>(null)
  const [history, setHistory] = useState<number[]>([])

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!

  const hypothesis: Hypothesis = useMemo(() => {
    if (!scenario.observations.length && !pinned) {
      return initialHypothesis(scenario.elapsed)
    }
    return infer({
      observations: scenario.observations,
      pinned,
      now: scenario.elapsed,
      sessionStartedAt: T,
    })
  }, [scenario, pinned])

  // Append to the sparkline when the confidence actually moves. Adjusting state
  // during render (rather than in an effect) is the documented pattern for
  // this: React re-runs the component before committing, so there is no extra
  // paint and no cascading render.
  const [lastConfidence, setLastConfidence] = useState<number | null>(null)
  if (lastConfidence !== hypothesis.confidence) {
    setLastConfidence(hypothesis.confidence)
    setHistory((previous) => [...previous, hypothesis.confidence].slice(-12))
  }

  if (!enabled) return null

  return (
    <>
      <div className="fixed top-4 left-4 z-50 max-w-[16rem] border border-instrument-rule bg-instrument-bg p-3 text-instrument-ink">
        <p className="font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
          Debug — not shipped
        </p>
        <ul className="mt-2.5 space-y-1">
          {SCENARIOS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => {
                  setScenarioId(option.id)
                  setPinned(null)
                }}
                aria-pressed={option.id === scenarioId}
                className={`w-full text-left font-mono text-[11px] ${
                  option.id === scenarioId
                    ? 'text-phosphor'
                    : 'text-instrument-muted hover:text-instrument-ink'
                }`}
              >
                {option.label}
                <span className="ml-1 text-instrument-rule">
                  {option.exercises}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 border-t border-instrument-rule pt-2 font-mono text-[10px] text-instrument-muted">
          Pinned state: use the override chips.
        </p>
      </div>

      <Readout
        hypothesis={hypothesis}
        pinned={pinned}
        onPin={setPinned}
        onClear={() => setPinned(null)}
        history={history}
      />
    </>
  )
}
