'use client'

import { useEffect, useState } from 'react'

import { PERSON } from '@/data/content'

/**
 * The floating pill nav and the status line.
 *
 * `Get in touch` is present from the first pixel — on the old page the only
 * route to contact sat at the bottom of a fifteen-screen scroll.
 */

const NAV = [
  { label: 'Work', href: '#work' },
  { label: 'Systems', href: '#systems' },
  { label: 'About', href: '#about' },
] as const

/**
 * Ramallah's wall clock. Rendered null on the server and filled in after mount:
 * the server has no business guessing a timezone, and a mismatch here is a
 * hydration error. The dash is a deliberate placeholder, not a loading state.
 */
function LocalTime() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Hebron',
        }).format(new Date()),
      )
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return <span suppressHydrationWarning>{time ?? '—:—'}</span>
}

export function Chrome() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-5 py-5 sm:px-7
        before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-1
        before:h-[140%] before:bg-gradient-to-b before:from-[var(--color-surface)]
        before:via-[var(--color-surface)]/85 before:to-transparent"
    >
      {/*
        Kept on mobile, not hidden: it is the only identity signal in the first
        viewport at that width, and the availability is the thing a hiring
        visitor is looking for. Only the city drops below sm.
      */}
      <p className="annotation whitespace-nowrap">
        <span className="hidden sm:inline">Ramallah · </span>
        <LocalTime /> · Open to roles
      </p>

      {/*
        Hidden below sm. At 390px the status line, the nav, and the primary
        action do not fit on one row, and the first attempt at keeping all three
        pushed "Get in touch" off the right edge — the confirmed primary action,
        unreachable on a phone.
        The nav is in-page anchors only and the page is a short scroll, so it is
        the one of the three that costs least to drop. The status line carries
        identity and availability; the mailto is the whole point.
      */}
      <nav
        aria-label="Primary"
        className="border-graticule bg-surface-raised/85 hidden gap-0.5 rounded-full border p-1.5 backdrop-blur-md sm:flex"
      >
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hover:bg-surface-sunk rounded-full px-4 py-2 text-sm transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <a
        href={`mailto:${PERSON.email}`}
        data-signal="outbound_email"
        className="bg-signal rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Get in touch
      </a>
    </header>
  )
}
