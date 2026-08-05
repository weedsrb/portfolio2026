/**
 * Reading the entry signals, once, on mount.
 *
 * Everything here is read from APIs the browser already gives any page. There
 * is no fingerprinting: no canvas, no font probing, no user-agent parsing
 * beyond a media query for pointer type. Nothing read here is sent anywhere.
 */

import type { Observation } from './engine'
import type { Persona } from './personas'
import { RETURN_VISIT_STRENGTH, TAG_STRENGTH, type SignalId } from './signals'
import { readVisit } from './storage'

/** `?ctx=` values, and the UTM values treated as the same evidence. */
const TAG_TO_SIGNAL: Record<string, SignalId> = {
  ai: 'ctx_ai',
  data: 'ctx_data',
  client: 'ctx_client',
  eng: 'ctx_eng',
}

const RETURN_TO_SIGNAL: Record<Persona, SignalId> = {
  ai_product: 'return_ai_product',
  data: 'return_data',
  client: 'return_client',
  peer: 'return_peer',
}

function referrerSignal(): SignalId | null {
  let host: string
  try {
    if (!document.referrer) return null
    host = new URL(document.referrer).hostname.toLowerCase()
  } catch {
    return null
  }

  // Same-origin navigation is not a referral.
  if (host === window.location.hostname) return null

  if (host.includes('linkedin.')) return 'ref_linkedin'
  if (host.includes('github.') || host.includes('githubusercontent.')) {
    return 'ref_github'
  }
  if (host.includes('upwork.') || host.includes('freelancer.')) {
    return 'ref_upwork'
  }
  if (
    host.includes('google.') ||
    host.includes('bing.') ||
    host.includes('duckduckgo.') ||
    host.includes('ecosia.')
  ) {
    return 'ref_search'
  }
  return null
}

function deviceSignal(): SignalId | null {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 820px)').matches
  if (coarse && narrow) return 'device_small_touch'

  const fine = window.matchMedia('(pointer: fine)').matches
  const wide = window.matchMedia('(min-width: 1200px)').matches
  if (fine && wide) return 'device_wide_pointer'

  return null
}

export type EntryRead = {
  observations: Observation[]
  /** Set when a `?ctx=` tag was present, so the caller can strip it. */
  hadTag: boolean
}

let cached: EntryRead | null = null

/**
 * Read the entry signals exactly once per page load.
 *
 * This has to be memoised outside React, because reading is destructive: we
 * strip `?ctx=` from the URL immediately after reading it, so a second read
 * sees a URL with no tag and would quietly replace a strong, correct signal
 * with nothing. StrictMode's double-invoked effects hit this on every dev load,
 * and a Fast Refresh or any genuine remount would hit it in production.
 *
 * Entry signals belong to the page load, not to a component instance, so this
 * is also just the more honest model of what they are.
 */
export function readEntrySignalsOnce(now: number): EntryRead {
  cached ??= read(now)
  return cached
}

/**
 * @param now ms epoch, passed in so this stays testable and the engine never
 *            sees a time it did not receive from its caller.
 */
function read(now: number): EntryRead {
  const observations: Observation[] = []
  const add = (signal: SignalId, strength: number) =>
    observations.push({ signal, strength, at: now })

  const params = new URLSearchParams(window.location.search)

  // A tagged link is the strongest single signal: someone told us up front.
  const ctx = params.get('ctx')?.toLowerCase()
  const tagSignal = ctx ? TAG_TO_SIGNAL[ctx] : undefined
  if (tagSignal) add(tagSignal, TAG_STRENGTH.ctx)

  // UTM carries the same evidence, more weakly — it is likelier to have been
  // forwarded, pasted or rewritten along the way.
  if (!tagSignal) {
    const utm = (
      params.get('utm_campaign') ??
      params.get('utm_source') ??
      ''
    ).toLowerCase()
    const utmSignal = TAG_TO_SIGNAL[utm]
    if (utmSignal) add(utmSignal, TAG_STRENGTH.utm)
  }

  const referrer = referrerSignal()
  if (referrer) add(referrer, 1)

  const device = deviceSignal()
  if (device) add(device, 1)

  if (navigator.language?.toLowerCase().startsWith('ar')) {
    add('lang_arabic', 1)
  }

  // A previous visit comes back as a starting guess, not a conclusion.
  const visit = readVisit()
  if (visit) add(RETURN_TO_SIGNAL[visit.persona], RETURN_VISIT_STRENGTH)

  return { observations, hadTag: Boolean(tagSignal) }
}

/**
 * Strip `?ctx=` from the visible URL after reading it.
 *
 * Without this, a forwarded link carries someone else's context to whoever
 * opens it next, and the page confidently reorders itself for the wrong person.
 */
export function stripTagFromUrl(): void {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('ctx')) return
    url.searchParams.delete('ctx')
    window.history.replaceState({}, '', url.toString())
  } catch {
    // Nothing important depends on the URL looking tidy.
  }
}
