'use client'

import { LENS_PROMISE, type Lens } from '@/lib/lens'

import { LensPills } from './LensPills'

/**
 * The first viewport. Three jobs, in order: say who this is, state the claim at
 * the scale of a wordmark, and let the visitor declare why they came.
 *
 * The old opening led with the thesis and put the name in 11px of muted mono in
 * the gutter. Here the claim IS the display type and the name is the first
 * thing read.
 */
export function Hero({
  lens,
  onLensChange,
}: {
  lens: Lens | null
  onLensChange: (lens: Lens) => void
}) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center px-5 pt-28 pb-10 sm:px-7">
      <p className="text-base sm:text-lg">Hello — I&apos;m Waleed, product &amp; AI engineering</p>

      {/*
        `decides.` is the one place the bright vermilion is allowed: at this
        size it is large text, where 3.28:1 clears AA. Everything smaller uses
        --color-signal, which clears 4.5:1.
      */}
      <h1 className="display mt-5 text-[clamp(3.2rem,12.2vw,11rem)]">
        A model proposes.
        <br />
        My code <em className="text-signal-display not-italic">decides.</em>
      </h1>

      {/*
        The standfirst sits right of centre against the claim's left edge, so
        the viewport is not a narrow column with a dead right half.
      */}
      <div className="mt-7 grid gap-y-7 lg:grid-cols-12">
        <p className="text-lg leading-relaxed sm:text-xl lg:col-span-5 lg:col-start-7">
          Inference you can read, argue with, and{' '}
          <strong className="font-semibold">overrule</strong>. Every claim here ships with something
          you can actually operate.
        </p>
      </div>

      <div className="mt-12">
        <LensPills value={lens} onChange={onLensChange} />
        {/*
          Reserved whether or not a lens is set, so choosing one does not shove
          the page down by a line. aria-live announces the new promise without
          moving focus off the pill the visitor just chose.
        */}
        <p
          aria-live="polite"
          className="text-ink-muted mt-4 min-h-[2.6rem] max-w-[52ch] text-sm leading-snug"
        >
          {lens ? LENS_PROMISE[lens] : 'Or just scroll — nothing here is hidden behind a choice.'}
        </p>
      </div>
    </section>
  )
}
