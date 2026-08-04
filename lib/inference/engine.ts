/**
 * The inference engine.
 *
 * Pure. No DOM, no React, no side effects, no randomness, no clock reads —
 * every time value is passed in. The same sequence of observations always
 * produces the same output, which is what makes it testable and what makes it
 * possible to explain on a whiteboard.
 *
 * It is not a language model and does not pretend to be one. It is a
 * transparent log-odds scoring model: signals in, distribution out, with every
 * signal's contribution itemised on the way through.
 */

import { decayFactor } from './decay'
import {
  DEFAULT_ORDER,
  PERSONAS,
  SECTION_ORDERS,
  zeroVector,
  type Distribution,
  type Persona,
  type PersonaVector,
  type SectionId,
} from './personas'
import { SIGNALS, type SignalId } from './signals'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type Observation = {
  signal: SignalId
  /** Multiplier on the signal's weight vector, normally in [0, 1]. */
  strength: number
  /** ms epoch at which this was observed. */
  at: number
}

/** One signal's itemised effect on the score, after decay and capping. */
export type Contribution = {
  signal: SignalId
  perPersona: PersonaVector
  /** Largest absolute effect on any persona. Used to rank the signal list. */
  magnitude: number
}

export type ResolveState = 'unresolved' | 'forming' | 'resolved' | 'pinned'

export type Hypothesis = {
  state: ResolveState
  leader: Persona | null
  confidence: number
  distribution: Distribution
  /** Ordered by magnitude, descending. Drives the readout's signal list. */
  contributions: Contribution[]
  order: readonly SectionId[]
  /** ms epoch of the last actual order change. Feeds the rate limiter. */
  orderChangedAt: number
  /** ms epoch this hypothesis was computed. */
  at: number
}

export type EngineInput = {
  observations: readonly Observation[]
  /** Set by the visitor's override. Beats everything until cleared. */
  pinned: Persona | null
  now: number
  sessionStartedAt: number
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/** Below this confidence the page says so plainly and stays in default order. */
export const FLOOR_BASE = 0.25
/** The floor relaxes slowly with time on page, never below this. */
export const FLOOR_MINIMUM = 0.18
/** Above this, a full re-rank is permitted. */
export const RESOLVED_THRESHOLD = 0.55
/** A challenger must beat the incumbent by this much to take the lead. */
export const HYSTERESIS_MARGIN = 0.08
/** At most one re-rank in this window. */
export const RERANK_INTERVAL_MS = 6_000
/** An explicit override is worth more than any amount of inferred evidence. */
export const PIN_PRIOR = 4.0

export const SOFTMAX_TEMPERATURE = 1.0

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export function softmax(
  scores: PersonaVector,
  temperature = SOFTMAX_TEMPERATURE,
): Distribution {
  const values = PERSONAS.map((p) => scores[p] / temperature)
  const max = Math.max(...values)
  const exps = values.map((v) => Math.exp(v - max))
  const total = exps.reduce((a, b) => a + b, 0)

  const out = zeroVector()
  PERSONAS.forEach((p, i) => {
    out[p] = (exps[i] ?? 0) / total
  })
  return out
}

export function entropy(distribution: Distribution): number {
  let h = 0
  for (const p of PERSONAS) {
    const value = distribution[p]
    if (value > 0) h -= value * Math.log(value)
  }
  return h
}

/**
 * Confidence is the sharpness of the distribution, not the leader's raw
 * probability.
 *
 * This matters. Two personas sitting at 45% each is a genuinely uncertain
 * reading, and this returns a low number for it — whereas `max(P)` would report
 * 0.45 and imply we nearly know. Reporting uncertainty honestly is the whole
 * point of putting the number on screen.
 */
export function confidenceOf(distribution: Distribution): number {
  const normalised = entropy(distribution) / Math.log(PERSONAS.length)
  return Math.min(1, Math.max(0, 1 - normalised))
}

/** The confidence floor relaxes as a session goes on, but only so far. */
export function formingFloor(sessionMs: number): number {
  const relaxed = FLOOR_BASE - (Math.max(0, sessionMs) / 1000) * 0.0002
  return Math.max(FLOOR_MINIMUM, relaxed)
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                     */
/* -------------------------------------------------------------------------- */

export type ScoreResult = {
  scores: PersonaVector
  contributions: Contribution[]
}

/**
 * Accumulate log-odds across all observations.
 *
 * Repeated observations of the same signal add up, then the total is clamped to
 * that signal's cap so no single behaviour can dominate the reading.
 */
export function score(
  observations: readonly Observation[],
  now: number,
  pinned: Persona | null = null,
): ScoreResult {
  const effectiveStrength = new Map<SignalId, number>()

  for (const observation of observations) {
    const definition = SIGNALS[observation.signal]
    if (!definition) continue

    const decayed =
      observation.strength * decayFactor(now - observation.at, definition.decay)

    effectiveStrength.set(
      observation.signal,
      (effectiveStrength.get(observation.signal) ?? 0) + decayed,
    )
  }

  const scores = zeroVector()
  const contributions: Contribution[] = []

  for (const [signal, strength] of effectiveStrength) {
    const definition = SIGNALS[signal]
    // Saturate the strength, not the resulting log-odds, so a signal that
    // fires repeatedly keeps arguing the same thing — just no louder.
    const capped = Math.min(definition.cap, Math.max(-definition.cap, strength))

    const perPersona = zeroVector()
    let magnitude = 0

    for (const persona of PERSONAS) {
      const effect = definition.weights[persona] * capped
      perPersona[persona] = effect
      scores[persona] += effect
      magnitude = Math.max(magnitude, Math.abs(effect))
    }

    if (magnitude > 0) contributions.push({ signal, perPersona, magnitude })
  }

  // Deterministic ordering: magnitude first, then signal id to break ties.
  contributions.sort(
    (a, b) => b.magnitude - a.magnitude || a.signal.localeCompare(b.signal),
  )

  // The override is not a signal — it is the visitor telling us directly, so it
  // is applied as a prior and deliberately left out of the itemised list. The
  // readout says "set by you" in this state rather than claiming an inference.
  if (pinned) scores[pinned] += PIN_PRIOR

  return { scores, contributions }
}

/* -------------------------------------------------------------------------- */
/* Resolution                                                                  */
/* -------------------------------------------------------------------------- */

function argmax(distribution: Distribution): Persona {
  let best: Persona = PERSONAS[0]
  for (const persona of PERSONAS) {
    if (distribution[persona] > distribution[best]) best = persona
  }
  return best
}

function sameOrder(a: readonly SectionId[], b: readonly SectionId[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

/**
 * Turn a distribution into a hypothesis the page can act on.
 *
 * Stateful behaviour — hysteresis and rate limiting — with a pure
 * implementation: the previous hypothesis is an argument, not a closure.
 */
export function resolve(
  previous: Hypothesis | null,
  distribution: Distribution,
  contributions: Contribution[],
  input: Pick<EngineInput, 'now' | 'sessionStartedAt' | 'pinned'>,
): Hypothesis {
  const { now, sessionStartedAt, pinned } = input
  const confidence = confidenceOf(distribution)

  if (pinned) {
    const order = SECTION_ORDERS[pinned]
    const changed = !previous || !sameOrder(previous.order, order)
    return {
      state: 'pinned',
      leader: pinned,
      confidence,
      distribution,
      contributions,
      order,
      // An override re-ranks immediately. It is not rate limited, because the
      // visitor just asked for it and a delayed response would read as broken.
      orderChangedAt: changed ? now : (previous?.orderChangedAt ?? now),
      at: now,
    }
  }

  const candidate = argmax(distribution)

  // Once resolved, hold the leader until a challenger clears the margin.
  // Without this the page oscillates, which is both ugly and unconvincing.
  let leader = candidate
  const incumbent = previous?.leader
  if (
    previous?.state === 'resolved' &&
    incumbent &&
    incumbent !== candidate &&
    distribution[candidate] - distribution[incumbent] < HYSTERESIS_MARGIN
  ) {
    leader = incumbent
  }

  const floor = formingFloor(now - sessionStartedAt)

  let state: ResolveState
  if (confidence < floor) state = 'unresolved'
  else if (confidence < RESOLVED_THRESHOLD) state = 'forming'
  else state = 'resolved'

  // A forming hypothesis is shown but not acted on. We only re-rank once we
  // actually believe it.
  const desired = state === 'resolved' ? SECTION_ORDERS[leader] : DEFAULT_ORDER

  let order = desired
  let orderChangedAt = previous?.orderChangedAt ?? now

  if (previous && !sameOrder(previous.order, desired)) {
    if (now - previous.orderChangedAt < RERANK_INTERVAL_MS) {
      order = previous.order
    } else {
      orderChangedAt = now
    }
  } else if (!previous) {
    orderChangedAt = now
  }

  return {
    state,
    leader: state === 'unresolved' ? null : leader,
    confidence,
    distribution,
    contributions,
    order,
    orderChangedAt,
    at: now,
  }
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export function infer(
  input: EngineInput,
  previous: Hypothesis | null = null,
): Hypothesis {
  const { scores, contributions } = score(
    input.observations,
    input.now,
    input.pinned,
  )
  return resolve(previous, softmax(scores), contributions, input)
}

/** The hypothesis before any evidence: default order, nothing claimed. */
export function initialHypothesis(now: number): Hypothesis {
  const scores = zeroVector()
  return {
    state: 'unresolved',
    leader: null,
    confidence: 0,
    distribution: softmax(scores),
    contributions: [],
    order: DEFAULT_ORDER,
    orderChangedAt: now,
    at: now,
  }
}
