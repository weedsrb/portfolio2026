'use client'

import { useId, useState } from 'react'

import { READOUT } from '@/data/content'
import { FieldSlot } from '@/components/readout/FieldSlot'
import { HowThisWorks } from '@/components/readout/HowThisWorks'
import { OverrideChips } from '@/components/readout/OverrideChips'
import { SignalList } from '@/components/readout/SignalList'
import type { Hypothesis } from '@/lib/inference/engine'
import { PERSONA_HYPOTHESIS, type Persona } from '@/lib/inference/personas'

/**
 * The readout: the single dark, lit object on a light page.
 *
 * Collapsed by default to the field, the hypothesis line and the confidence.
 * Expands on click to show the reasoning and the override. It never
 * auto-expands — a panel that opens itself while you are reading something else
 * is a pop-up, whatever else you call it.
 */

const COPY = {
  unresolved: READOUT.unresolved,
  forming: READOUT.forming,
  resolved: READOUT.resolved,
  pinned: READOUT.pinned,
} as const

/** Twelve bars of history. Empty slots render as the baseline, not as zero. */
function Sparkline({ history }: { history: number[] }) {
  const slots = 12
  const recent = history.slice(-slots)
  const padding = Array.from({ length: slots - recent.length }, () => null)
  const values: (number | null)[] = [...padding, ...recent]

  return (
    <span className="flex h-4 items-end gap-[2px]" aria-hidden="true">
      {values.map((value, i) => (
        <span
          key={i}
          className={value === null ? 'bg-instrument-rule' : 'bg-phosphor'}
          style={{
            width: 3,
            height: value === null ? 1 : Math.max(1, Math.round(value * 16)),
            opacity: value === null ? 1 : 0.45 + (i / slots) * 0.55,
          }}
        />
      ))}
    </span>
  )
}

export function Readout({
  hypothesis,
  pinned,
  onPin,
  onClear,
  history,
}: {
  hypothesis: Hypothesis
  pinned: Persona | null
  onPin: (persona: Persona) => void
  onClear: () => void
  history: number[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [disclosureOpen, setDisclosureOpen] = useState(false)
  const bodyId = useId()

  const { state, leader, confidence, contributions } = hypothesis
  const copy = COPY[state]
  // Pinned confidence would just be a measure of how hard the override pushes,
  // so it is not shown. "You told me" is the honest reading, and a number there
  // would be theatre.
  const showsConfidence = state === 'forming' || state === 'resolved'

  return (
    <aside
      aria-label="What this page thinks you came for"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-instrument-rule bg-instrument-bg text-instrument-ink md:inset-x-auto md:right-6 md:bottom-6 md:w-[22rem] md:border"
    >
      <div className="p-4">
        <div className="flex items-start gap-3.5">
          <FieldSlot confidence={state === 'unresolved' ? 0 : confidence} />

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
              {READOUT.title}
            </p>

            <p className="mt-1.5 text-sm leading-snug">
              <span className="text-instrument-muted">{copy.heading}</span>{' '}
              {leader ? (
                <span className="text-phosphor">
                  {PERSONA_HYPOTHESIS[leader]}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Confidence. The one live value in the collapsed state. */}
        <div className="mt-3.5 flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
            {READOUT.confidenceLabel}
          </span>
          {showsConfidence ? (
            <>
              <span className="font-mono text-sm text-phosphor">
                {confidence.toFixed(2)}
              </span>
              <span className="ml-auto">
                <Sparkline history={history} />
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-sm text-instrument-muted">
                {state === 'pinned' ? 'you said so' : '—'}
              </span>
              {state === 'unresolved' ? (
                /* Indeterminate: there is no number to show, so showing one
                   would be inventing it. Phase 4 gives this a slow drift. */
                <span
                  aria-hidden="true"
                  className="ml-auto h-[3px] w-24 bg-[repeating-linear-gradient(90deg,var(--color-instrument-rule)_0_6px,transparent_6px_12px)]"
                />
              ) : null}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="mt-3 flex w-full items-center gap-2 border-t border-instrument-rule pt-3 text-left font-mono text-[11px] text-instrument-muted hover:text-instrument-ink"
        >
          <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
          {expanded ? READOUT.collapseLabel : READOUT.expandLabel}
        </button>

        {expanded ? (
          <div id={bodyId} className="mt-3.5 space-y-4">
            <p className="text-xs leading-normal text-instrument-muted">
              {copy.body}
            </p>

            <div>
              <p className="mb-2 font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
                {READOUT.signalsLabel}
              </p>
              <SignalList contributions={contributions} leader={leader} />
            </div>

            <div className="border-t border-instrument-rule pt-3.5">
              <OverrideChips pinned={pinned} onPin={onPin} onClear={onClear} />
            </div>

            <div className="border-t border-instrument-rule pt-3.5">
              <button
                type="button"
                onClick={() => setDisclosureOpen(true)}
                className="font-mono text-[11px] text-instrument-muted underline underline-offset-2 hover:text-instrument-ink"
              >
                {READOUT.disclosureLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {disclosureOpen ? (
        <HowThisWorks onClose={() => setDisclosureOpen(false)} />
      ) : null}
    </aside>
  )
}
