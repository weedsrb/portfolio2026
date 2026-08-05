'use client'

import { useId, useState, type ReactNode } from 'react'

/**
 * One claim, readable in about two seconds, with the sandbox folded away behind
 * a control.
 *
 * This is the answer to the old page's real failure: seven consecutive
 * instruments, each demanding to be operated before it paid out anything. The
 * claim and its one-line proof are always visible; the thing you work is opt-in.
 *
 * Collapsed content is unmounted rather than hidden, so a closed sandbox costs
 * nothing — several of these run timers and canvases.
 */
export function WorkBlock({
  claim,
  standfirst,
  openLabel,
  children,
}: {
  claim: string
  standfirst: string
  openLabel: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <article className="border-graticule border-t px-5 py-16 sm:px-7 sm:py-24">
      {/*
        Two columns from lg up: the claim carries the left, the reading copy and
        its control sit right and slightly lower, so the eye lands on the claim
        and then falls into the prose. Below lg it stacks in that same order.
      */}
      <div className="grid gap-x-10 gap-y-7 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="display text-[clamp(2.1rem,5.4vw,4.4rem)]">{claim}</h2>
        </div>

        <div className="lg:col-span-5 lg:pt-14">
          <p className="max-w-[44ch] text-lg leading-relaxed">{standfirst}</p>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="pill mt-6 hover:-translate-y-0.5"
          >
            {open ? 'Close it' : openLabel}
            {/* Drawn, not a Unicode arrow — same 16×16 box and stroke as the lens marks. */}
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={open ? 'rotate-180' : undefined}
            >
              <path d="M8 3.5 V12.5 M4 8.5 L8 12.5 L12 8.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* The instrument gets the full measure — it was built for the width. */}
      {open && (
        <div id={panelId} className="mt-10">
          {children}
        </div>
      )}
    </article>
  )
}
