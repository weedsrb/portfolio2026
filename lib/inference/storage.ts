/**
 * The one thing this page remembers.
 *
 * A single key holding a coarse persona label and a timestamp. Nothing else —
 * no identifier, no history, no counts. Phase 5 reads and writes it; it is
 * defined here now so the disclosure panel's "forget me" button and the code
 * that stores the value can never disagree about what is being cleared.
 */

import { PERSONAS, type Persona } from './personas'

export const STORAGE_KEY = 'wsp.visit'

export type StoredVisit = {
  persona: Persona
  /** ms epoch. */
  at: number
}

export function readVisit(): StoredVisit | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const { persona, at } = parsed as Record<string, unknown>
    if (typeof at !== 'number' || !Number.isFinite(at)) return null
    if (!PERSONAS.includes(persona as Persona)) return null

    return { persona: persona as Persona, at }
  } catch {
    // Storage disabled, private mode, or someone put junk in the key.
    return null
  }
}

export function writeVisit(visit: StoredVisit): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visit))
  } catch {
    // Nothing to recover from — remembering is a nicety, not a requirement.
  }
}

export function clearVisit(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Already effectively cleared.
  }
}
