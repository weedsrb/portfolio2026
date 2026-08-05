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
            <span aria-hidden="true">{open ? '↑' : '↓'}</span>
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
