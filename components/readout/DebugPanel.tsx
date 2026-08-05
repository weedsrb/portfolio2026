'use client'

import { useSyncExternalStore } from 'react'

import { useInference } from '@/hooks/useInference'
import { PERSONAS, PERSONA_LABELS } from '@/lib/inference/personas'
import { SIGNALS } from '@/lib/inference/signals'

/**
 * `?debug=1` — the full score matrix, every signal's contribution, and the
 * current order.
 *
 * This is a development tool, and it is also the thing worth putting on screen
 * in an interview: it shows the whole mechanism at once, live, with nothing
 * hidden behind an API call.
 */

const noSubscribe = () => () => {}

function useDebugFlag(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get('debug') === '1',
    () => false,
  )
}

export function DebugPanel() {
  const enabled = useDebugFlag()
  const { hypothesis } = useInference()

  if (!enabled) return null

  const { distribution, contributions, state, leader, confidence, order } =
    hypothesis

  return (
    <div className="fixed top-4 left-4 z-50 max-h-[calc(100vh-2rem)] w-[19rem] overflow-y-auto border border-instrument-rule bg-instrument-bg p-3 text-instrument-ink">
      <p className="font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
        Engine — ?debug=1
      </p>

      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px]">
        <dt className="text-instrument-muted">state</dt>
        <dd className="text-phosphor">{state}</dd>
        <dt className="text-instrument-muted">leader</dt>
        <dd>{leader ?? '—'}</dd>
        <dt className="text-instrument-muted">confidence</dt>
        <dd>{confidence.toFixed(4)}</dd>
        <dt className="text-instrument-muted">order</dt>
        <dd>{order.join(' ')}</dd>
      </dl>

      <p className="mt-3 border-t border-instrument-rule pt-2 font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
        Distribution
      </p>
      <ul className="mt-1.5 space-y-1">
        {PERSONAS.map((persona) => (
          <li key={persona} className="font-mono text-[11px]">
            <div className="flex justify-between gap-2">
              <span className={leader === persona ? 'text-phosphor' : ''}>
                {PERSONA_LABELS[persona]}
              </span>
              <span>{distribution[persona].toFixed(3)}</span>
            </div>
            <div className="mt-0.5 h-[3px] bg-instrument-rule">
              <div
                className="h-full bg-phosphor"
                style={{ width: `${distribution[persona] * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-instrument-rule pt-2 font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
        Contributions ({contributions.length})
      </p>
      <ul className="mt-1.5 space-y-1">
        {contributions.map((contribution) => (
          <li key={contribution.signal} className="font-mono text-[10px]">
            <div className="text-instrument-ink">
              {SIGNALS[contribution.signal].label}
            </div>
            <div className="flex gap-2 text-instrument-muted">
              {PERSONAS.map((persona) => (
                <span key={persona} className="w-12">
                  {contribution.perPersona[persona] >= 0 ? '+' : '−'}
                  {Math.abs(contribution.perPersona[persona]).toFixed(2)}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
