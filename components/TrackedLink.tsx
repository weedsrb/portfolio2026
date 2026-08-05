'use client'

import type { ReactNode } from 'react'

import { useInference } from '@/hooks/useInference'
import type { SignalId } from '@/lib/inference/signals'

/**
 * An outbound link that reports having been followed.
 *
 * Near-terminal evidence: someone opening a CV or heading for the source is
 * telling you what they came for more clearly than any amount of dwell time.
 * The signal is recorded locally and, as everywhere else here, goes nowhere.
 */
export function TrackedLink({
  href,
  signal,
  external,
  className,
  children,
}: {
  href: string
  signal: SignalId
  external?: boolean
  className?: string
  children: ReactNode
}) {
  const { recordEvent } = useInference()

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      onClick={() => recordEvent(signal)}
    >
      {children}
    </a>
  )
}
