'use client'

import { useEffect, useRef, useState } from 'react'

import { HOW_THIS_WORKS } from '@/data/content'
import { PERSONAS, PERSONA_LABELS } from '@/lib/inference/personas'
import { SIGNAL_IDS, SIGNALS } from '@/lib/inference/signals'
import { clearVisit } from '@/lib/inference/storage'

/**
 * The disclosure panel.
 *
 * The weights table is generated from lib/inference/signals.ts rather than
 * retyped, which is the only version of this that stays true. A hand-written
 * description of what a page does is a promise; a table read out of the code is
 * the thing itself.
 */
export function HowThisWorks({ onClose }: { onClose: () => void }) {
  const [cleared, setCleared] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function clearData() {
    clearVisit()
    setCleared(true)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-this-works-heading"
      className="fixed inset-0 z-[60] overflow-y-auto bg-instrument-bg p-6 text-instrument-ink md:p-10"
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-6">
          <h2
            id="how-this-works-heading"
            className="display text-2xl text-instrument-ink"
          >
            {HOW_THIS_WORKS.heading}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 border border-instrument-rule px-3 py-1.5 font-mono text-xs text-instrument-muted hover:border-instrument-muted hover:text-instrument-ink"
          >
            Close
          </button>
        </div>

        <p className="mt-6 max-w-[68ch] text-sm leading-normal text-instrument-muted">
          {HOW_THIS_WORKS.intro}
        </p>

        <dl className="mt-10 space-y-6">
          {HOW_THIS_WORKS.points.map((point) => (
            <div key={point.title}>
              <dt className="text-sm text-instrument-ink">{point.title}</dt>
              <dd className="mt-1.5 max-w-[68ch] text-sm leading-normal text-instrument-muted">
                {point.body}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12">
          <h3 className="font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
            {HOW_THIS_WORKS.weightsHeading}
          </h3>
          <p className="mt-2 max-w-[68ch] text-sm leading-normal text-instrument-muted">
            {HOW_THIS_WORKS.weightsNote}
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-instrument-rule">
                  <th
                    scope="col"
                    className="py-2 pr-4 font-mono text-[10px] tracking-wider text-instrument-muted uppercase"
                  >
                    Signal
                  </th>
                  {PERSONAS.map((persona) => (
                    <th
                      key={persona}
                      scope="col"
                      className="py-2 pr-4 font-mono text-[10px] tracking-wider text-instrument-muted uppercase"
                    >
                      {PERSONA_LABELS[persona]}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="py-2 font-mono text-[10px] tracking-wider text-instrument-muted uppercase"
                  >
                    Cap
                  </th>
                </tr>
              </thead>
              <tbody>
                {SIGNAL_IDS.map((id) => {
                  const definition = SIGNALS[id]
                  return (
                    <tr key={id} className="border-b border-instrument-rule/60">
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left text-xs font-normal text-instrument-ink"
                      >
                        {definition.label}
                        <span className="mt-0.5 block max-w-[34ch] text-[11px] leading-snug text-instrument-muted">
                          {definition.note}
                        </span>
                      </th>
                      {PERSONAS.map((persona) => {
                        const weight = definition.weights[persona]
                        return (
                          <td
                            key={persona}
                            className={`py-2 pr-4 align-top font-mono text-xs ${
                              weight > 0
                                ? 'text-phosphor'
                                : weight < 0
                                  ? 'text-instrument-muted'
                                  : 'text-instrument-rule'
                            }`}
                          >
                            {weight > 0 ? '+' : ''}
                            {weight.toFixed(2)}
                          </td>
                        )
                      })}
                      <td className="py-2 align-top font-mono text-xs text-instrument-muted">
                        {definition.cap.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 border-t border-instrument-rule pt-6 pb-6">
          {cleared ? (
            <p className="font-mono text-xs text-phosphor">
              {HOW_THIS_WORKS.clearDataDone}
            </p>
          ) : (
            <button
              type="button"
              onClick={clearData}
              className="border border-instrument-rule px-3 py-2 font-mono text-xs text-instrument-ink hover:border-instrument-muted"
            >
              {HOW_THIS_WORKS.clearDataLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
