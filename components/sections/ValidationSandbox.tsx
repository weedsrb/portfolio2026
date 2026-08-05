'use client'

import { useMemo, useRef, useState } from 'react'

import { Panel } from '@/components/sections/Section'
import { useInference } from '@/hooks/useInference'
import {
  CATALOGUE,
  DELIVERY_ZONES,
  MESSAGE_FIXTURES,
  type MessageFixture,
} from '@/data/fixtures/messages'
import {
  draftTotal,
  validateOrder,
  type CheckStatus,
  type OrderDraft,
} from '@/lib/validation/order'

/**
 * The order validation sandbox.
 *
 * The parse is a pre-computed fixture — there is no model call on this page and
 * there is not going to be one. The *gate*, however, is real: `validateOrder`
 * is the same pure function the tests cover, running here, on a draft you can
 * edit.
 *
 * That split is the honest one, and it is also the more convincing one. You can
 * put a confidently wrong value into what the model proposed and watch ordinary
 * deterministic code refuse it, which is the claim the whole site opens with.
 */

const STATUS_STYLE: Record<CheckStatus, string> = {
  pass: 'text-signal border-signal',
  flag: 'text-ink border-ink',
  reject: 'text-ink border-ink bg-ink/5',
}

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: 'pass',
  flag: 'needs a human',
  reject: 'rejected',
}

function StatusChip({ status }: { status: CheckStatus }) {
  return (
    <span
      className={`annotation shrink-0 border px-1.5 py-0.5 ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function draftFrom(fixture: MessageFixture): OrderDraft {
  return {
    lines: fixture.parse.lines.map((line) => ({
      sku: line.sku ?? '',
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? 0,
    })),
    customerName: fixture.parse.customerName,
    address: fixture.parse.address,
  }
}

/** A small labelled input that reports edits upward. */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  width = 'w-full',
}: {
  label: string
  value: string
  onChange: (next: string) => void
  type?: 'text' | 'number'
  width?: string
}) {
  return (
    <label className={`block ${width}`}>
      <span className="annotation block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={type === 'number' ? 'decimal' : undefined}
        className="mt-1 w-full border border-graticule bg-surface px-2 py-1.5 font-mono text-xs text-ink focus:border-signal focus:outline-none"
      />
    </label>
  )
}

export function ValidationSandbox() {
  const { recordEngagement } = useInference()
  const [fixtureId, setFixtureId] = useState(MESSAGE_FIXTURES[0]!.id)
  const fixture =
    MESSAGE_FIXTURES.find((f) => f.id === fixtureId) ?? MESSAGE_FIXTURES[0]!
  const [draft, setDraft] = useState<OrderDraft>(() => draftFrom(fixture))

  /*
   * Escalating credit: opening the module is worth less than operating it, and
   * operating it is worth less than driving it to a clean pass by hand.
   *
   * All of it happens in event handlers. Working this out during render would
   * mean firing a signal as a side effect of drawing, which is both a React
   * error and the wrong idea — the engagement is caused by the person, not by
   * the component re-rendering.
   */
  const depth = useRef<'opened' | 'interacted' | 'completed'>('opened')
  const engaged = useRef(false)

  /** Applies an edit and awards whatever depth of engagement it earned. */
  function applyDraft(next: OrderDraft) {
    setDraft(next)

    if (depth.current === 'opened') {
      depth.current = 'interacted'
      recordEngagement(1, 'interacted')
      return
    }

    if (depth.current === 'interacted') {
      // Reaching a clean pass by hand means they worked out the rules well
      // enough to satisfy them.
      const nextResult = validateOrder(next, CATALOGUE, DELIVERY_ZONES)
      if (nextResult.outcome === 'pass') {
        depth.current = 'completed'
        recordEngagement(1, 'completed')
      }
    }
  }

  function selectFixture(id: string) {
    const next = MESSAGE_FIXTURES.find((f) => f.id === id)
    if (!next) return
    setFixtureId(id)
    setDraft(draftFrom(next))
    if (!engaged.current) {
      engaged.current = true
      recordEngagement(1, 'opened')
    }
  }

  const result = useMemo(
    () => validateOrder(draft, CATALOGUE, DELIVERY_ZONES),
    [draft],
  )

  const parserRan = fixture.parse.confidence > 0

  function updateLine(index: number, patch: Partial<OrderDraft['lines'][0]>) {
    applyDraft({
      ...draft,
      lines: draft.lines.map((line, i) =>
        i === index ? { ...line, ...patch } : line,
      ),
    })
  }

  return (
    <>
      {/* Which message arrived. */}
      <Panel label="Inbound message">
        <div role="radiogroup" aria-label="Choose a customer message">
          {MESSAGE_FIXTURES.map((option) => {
            const active = option.id === fixtureId
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectFixture(option.id)}
                className={`block w-full border-b border-graticule px-4 py-3 text-left last:border-b-0 ${
                  active ? 'bg-surface' : 'hover:bg-surface/60'
                }`}
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="annotation">{option.script}</span>
                  {active ? (
                    <span className="annotation text-signal">selected</span>
                  ) : null}
                </span>
                <span
                  dir="auto"
                  lang="ar"
                  className="mt-2 block font-arabic text-base leading-snug text-ink"
                >
                  {option.message}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      {/* Stage 1 — cheap deterministic checks, before any model runs. */}
      <Panel label="1 · Pre-filter" className="mt-8">
        <div className="flex items-start gap-3 px-4 py-4">
          <StatusChip status={fixture.prefilter.status === 'pass' ? 'pass' : 'reject'} />
          <div>
            <p className="text-sm text-ink-muted">{fixture.prefilter.detail}</p>
            <ul className="mt-2 space-y-1">
              {fixture.prefilter.checks.map((check) => (
                <li key={check} className="font-mono text-xs text-ink-muted">
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      {/* Stage 2 — the only part a model touches, and it is pre-computed. */}
      <Panel label="2 · Parse — the model's proposal" className="mt-8">
        {parserRan ? (
          <div className="px-4 py-4">
            <div className="flex items-baseline gap-3">
              <span className="annotation">Model confidence</span>
              <span className="font-mono text-sm">
                {fixture.parse.confidence.toFixed(2)}
              </span>
              <span className="ml-auto text-xs text-ink-muted">
                Edit anything below — the gate re-runs as you type.
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {draft.lines.map((line, i) => (
                <div key={i} className="flex flex-wrap gap-3">
                  <Field
                    label="sku"
                    value={line.sku}
                    width="w-28"
                    onChange={(sku) => updateLine(i, { sku })}
                  />
                  <Field
                    label="quantity"
                    type="number"
                    value={String(line.quantity)}
                    width="w-24"
                    onChange={(q) => updateLine(i, { quantity: Number(q) })}
                  />
                  <Field
                    label="unit price"
                    type="number"
                    value={String(line.unitPrice)}
                    width="w-24"
                    onChange={(p) => updateLine(i, { unitPrice: Number(p) })}
                  />
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <Field
                  label="customer name"
                  value={draft.customerName ?? ''}
                  width="w-44"
                  onChange={(customerName) =>
                    applyDraft({ ...draft, customerName })
                  }
                />
                <Field
                  label="address"
                  value={draft.address ?? ''}
                  width="w-44"
                  onChange={(address) => applyDraft({ ...draft, address })}
                />
              </div>
            </div>

            <p className="mt-4 border-t border-graticule pt-3 text-sm text-ink-muted">
              {fixture.parse.note}
            </p>
          </div>
        ) : (
          <p className="px-4 py-4 text-sm text-ink-muted">{fixture.parse.note}</p>
        )}
      </Panel>

      {/* Stage 3 — real code, running now. */}
      <Panel label="3 · Validate — deterministic, running in your browser" className="mt-8">
        <div aria-live="polite">
          <div className="flex items-center gap-3 border-b border-graticule px-4 py-3">
            <StatusChip status={result.outcome} />
            <p className="text-sm">{result.summary}</p>
            <span className="ml-auto font-mono text-xs text-ink-muted">
              total {draftTotal(draft).toFixed(2)}
            </span>
          </div>

          <ul>
            {result.checks.map((check) => (
              <li
                key={check.field + check.rule}
                className="flex gap-3 border-b border-graticule/60 px-4 py-3 last:border-b-0"
              >
                <StatusChip status={check.status} />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink">{check.field}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    <span className="text-ink">{check.rule}.</span> {check.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <p className="prose-measure mt-6 text-sm">
        The parse above is pre-computed — there is no model call on this page.
        The validation below it is not: that is{' '}
        <span className="font-mono text-xs">validateOrder()</span> running here,
        the same pure function its unit tests cover. It has no access to the
        confidence score, which is why editing the price to whatever the customer
        claimed still gets refused.
      </p>
    </>
  )
}
