'use client'

import { useEffect, useRef, useState } from 'react'

import { Panel } from '@/components/sections/Section'
import { useInference } from '@/hooks/useInference'
import {
  initialState,
  step,
  type Failure,
  type LogEntry,
  type SimState,
} from '@/lib/queue/simulate'

/**
 * Failure injection for the queue worker.
 *
 * Kill a worker mid-lease and trace what happens. The simulation is the same
 * pure state machine its unit tests cover — the component only drives the
 * clock, so what you watch here is what the tests assert.
 */

const FAILURES: { id: Failure; label: string; note: string }[] = [
  { id: 'none', label: 'Nothing goes wrong', note: 'The happy path, for reference.' },
  {
    id: 'worker_dies',
    label: 'Kill the worker mid-lease',
    note: 'The process dies outright. Nothing releases the lease, because nobody is left to release it.',
  },
  {
    id: 'worker_hangs',
    label: 'Wedge the worker',
    note: 'Alive but stuck. Harder in production, identical in outcome — which is the point of an expiry.',
  },
  {
    id: 'provider_down',
    label: 'Take the model provider down',
    note: 'An ordinary failed call. The adapter is provider-neutral, so no vendor is load-bearing.',
  },
]

const TONE: Record<LogEntry['tone'], string> = {
  normal: 'text-ink-muted',
  good: 'text-signal',
  warn: 'text-ink',
  bad: 'text-ink',
}

const TICK_MS = 420

const JOB_LABEL: Record<SimState['job'], string> = {
  queued: 'queued',
  leased: 'leased to a worker',
  retrying: 'backing off',
  done: 'delivered',
  dead: 'dead-lettered',
}

export function QueueSandbox() {
  const { recordEngagement } = useInference()
  const [failure, setFailure] = useState<Failure>('worker_dies')
  const [sim, setSim] = useState<SimState>(() => initialState('worker_dies'))
  const [running, setRunning] = useState(false)
  const depth = useRef<'opened' | 'interacted' | 'completed'>('opened')

  const finished = sim.job === 'done' || sim.job === 'dead'

  useEffect(() => {
    if (!running || finished) return
    const timer = window.setTimeout(() => setSim((s) => step(s)), TICK_MS)
    return () => window.clearTimeout(timer)
  }, [running, sim, finished])

  // Watching a failure resolve all the way through is the completed state.
  useEffect(() => {
    if (finished && depth.current === 'interacted') {
      depth.current = 'completed'
      recordEngagement(4, 'completed')
    }
  }, [finished, recordEngagement])

  function inject(next: Failure) {
    setFailure(next)
    setSim(initialState(next))
    setRunning(true)
    if (depth.current === 'opened') {
      depth.current = 'interacted'
      recordEngagement(4, 'interacted')
    }
  }

  return (
    <>
      <Panel label="Inject a failure">
        <div className="grid gap-px bg-graticule sm:grid-cols-2">
          {FAILURES.map((option) => {
            const active = option.id === failure
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => inject(option.id)}
                className={`px-4 py-3 text-left ${
                  active ? 'bg-surface' : 'bg-surface-sunk hover:bg-surface/60'
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-ink">{option.label}</span>
                  {active ? (
                    <span className="annotation text-signal">running</span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-ink-muted">
                  {option.note}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-graticule px-4 py-3">
          <span className="font-mono text-xs">
            <span className="text-ink-muted">tick </span>
            <span className="text-signal">{sim.tick}</span>
          </span>
          <span className="font-mono text-xs">
            <span className="text-ink-muted">job </span>
            <span className="text-signal">{JOB_LABEL[sim.job]}</span>
          </span>
          <span className="font-mono text-xs">
            <span className="text-ink-muted">lease </span>
            <span className={sim.lease === null ? 'text-ink-muted' : 'text-signal'}>
              {sim.lease === null ? 'none' : sim.lease}
            </span>
          </span>
          <span className="font-mono text-xs">
            <span className="text-ink-muted">attempt </span>
            <span className="text-signal">{sim.attempts}</span>
          </span>

          <span className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              disabled={finished}
              className="border border-graticule px-2.5 py-1 font-mono text-xs hover:border-ink disabled:opacity-40"
            >
              {running ? 'pause' : 'run'}
            </button>
            <button
              type="button"
              onClick={() => inject(failure)}
              className="border border-graticule px-2.5 py-1 font-mono text-xs hover:border-ink"
            >
              restart
            </button>
          </span>
        </div>
      </Panel>

      <Panel label="Trace" className="mt-8">
        <ol aria-live="polite" className="max-h-96 overflow-y-auto">
          {sim.log.map((entry, i) => (
            <li
              key={`${entry.tick}-${i}`}
              className="flex gap-3 border-b border-graticule/60 px-4 py-2.5 last:border-b-0"
            >
              <span className="annotation w-8 shrink-0 pt-0.5">
                {String(entry.tick).padStart(2, '0')}
              </span>
              <span className="annotation w-24 shrink-0 pt-0.5">{entry.where}</span>
              <span className={`text-sm ${TONE[entry.tone]}`}>{entry.text}</span>
            </li>
          ))}
        </ol>

        {finished ? (
          <p className="border-t border-graticule px-4 py-3 text-sm">
            {sim.job === 'done'
              ? `Delivered after ${sim.attempts} ${sim.attempts === 1 ? 'attempt' : 'attempts'}. The merchant never saw any of this.`
              : 'Dead-lettered with its error and payload, where it can be inspected and replayed. A job that disappears silently is a job you find out about from a customer.'}
          </p>
        ) : null}
      </Panel>
    </>
  )
}
