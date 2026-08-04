/**
 * Time decay.
 *
 * The hypothesis should track the *current* reading session rather than
 * accumulating forever. Evidence gets a grace period at full strength, then
 * falls off on a half-life.
 *
 * Entry signals (where you came from, what link you followed) decay far more
 * slowly than behavioural ones: the fact that you arrived from GitHub is still
 * true ten minutes later, whereas the fact that you paused on a section for
 * eight seconds stops being interesting once you've moved on.
 */

export type DecayClass = 'none' | 'slow' | 'behavioural'

type DecayProfile = { graceMs: number; halfLifeMs: number }

const PROFILES: Record<Exclude<DecayClass, 'none'>, DecayProfile> = {
  slow: { graceMs: 240_000, halfLifeMs: 900_000 },
  behavioural: { graceMs: 240_000, halfLifeMs: 120_000 },
}

/**
 * Multiplier in (0, 1] applied to an observation's strength.
 *
 * Ages at or below zero are treated as fresh, so callers never have to guard
 * against clock skew producing a factor above 1.
 */
export function decayFactor(ageMs: number, decay: DecayClass): number {
  if (decay === 'none') return 1
  if (ageMs <= 0) return 1

  const profile = PROFILES[decay]
  if (ageMs <= profile.graceMs) return 1

  return Math.pow(2, -(ageMs - profile.graceMs) / profile.halfLifeMs)
}
