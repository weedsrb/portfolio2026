'use client'

import { LENS_LABEL, LENS_MARK, LENSES, type Lens } from '@/lib/lens'

/**
 * The signature control. Nothing on this page guesses at the visitor; they say
 * why they came and the page commits to it.
 *
 * Rendered as real radio inputs so the whole set is one arrow-key group and
 * announces as a choice, with the pill drawn on the label. A row of buttons
 * would have needed roving tabindex to behave the same way.
 */
export function LensPills({
  value,
  onChange,
}: {
  value: Lens | null
  onChange: (lens: Lens) => void
}) {
  return (
    <fieldset className="border-0 p-0">
      {/*
        The legend takes its own line rather than floating into the row: at
        narrow widths the float orphaned the first pill onto the label's line
        and left the rest stacked ragged beneath it.
      */}
      <legend className="annotation mb-3 p-0">Why are you here?</legend>

      <div className="flex flex-wrap items-center gap-2.5">
        {LENSES.map((lens, i) => {
          const on = value === lens
          return (
            <label
              key={lens}
              className="lens-pill pill cursor-pointer select-none"
              data-on={on || undefined}
              style={
                {
                  // Each pill sits at a slightly different angle, alternating,
                  // so the row reads as laid down by hand rather than set on a
                  // grid. Straightens on approach and once chosen.
                  '--tilt': `${i % 2 === 0 ? -1.8 : 1.6}deg`,
                } as React.CSSProperties
              }
            >
              <input
                type="radio"
                name="lens"
                value={lens}
                checked={on}
                onChange={() => onChange(lens)}
                className="sr-only"
              />
              {LENS_LABEL[lens]}
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
              >
                <path d={LENS_MARK[lens]} />
              </svg>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
