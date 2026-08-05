/**
 * The four hypotheses the page can hold about who is reading it.
 *
 * There is deliberately no `unknown` persona. "We don't know yet" is a state of
 * the distribution (low confidence), not a fifth thing the visitor could be.
 */

export const PERSONAS = ['ai_product', 'data', 'client', 'peer'] as const

export type Persona = (typeof PERSONAS)[number]

/** A probability distribution over the personas. Sums to 1. */
export type Distribution = Record<Persona, number>

/** A vector of log-odds weights over the personas. Does not sum to anything. */
export type PersonaVector = Record<Persona, number>

export const PERSONA_LABELS: Record<Persona, string> = {
  ai_product: 'AI product',
  data: 'Data & analytics',
  client: 'Prospective client',
  peer: 'Engineer',
}

/**
 * How the readout names its own hypothesis. Written as a claim about intent
 * rather than a category, because that is what the page is actually guessing.
 */
export const PERSONA_HYPOTHESIS: Record<Persona, string> = {
  ai_product: "You're evaluating how I build with models",
  data: "You're looking for someone who can work the data",
  client: "You're weighing up whether to hire me for a job",
  peer: "You're here for the engineering",
}

/** Section ids, 1–7, as numbered in the build document. */
export const SECTION_IDS = [1, 2, 3, 4, 5, 6, 7] as const
export type SectionId = (typeof SECTION_IDS)[number]

/**
 * Every persona defines a full ordering, never a filter. Nothing is hidden;
 * re-ranking changes sequence only, so a `data` visitor still reaches the
 * Mo'een sandbox — it just isn't first.
 */
export const SECTION_ORDERS: Record<Persona | 'default', readonly SectionId[]> = {
  ai_product: [1, 3, 4, 7, 2, 5, 6],
  data: [2, 5, 1, 7, 3, 4, 6],
  client: [6, 1, 2, 7, 5, 3, 4],
  peer: [4, 3, 1, 2, 5, 7, 6],
  default: [1, 2, 4, 3, 5, 7, 6],
}

export const DEFAULT_ORDER = SECTION_ORDERS.default

/** Short names for the re-rank announcement, so it reads as a sentence. */
export const SECTIONS_LABEL: Record<SectionId, string> = {
  1: 'the validation trace',
  2: 'the query console',
  3: 'the similarity explorer',
  4: 'the queue worker',
  5: 'cohort retention',
  6: 'what I’d build for you',
  7: 'the track record',
}

/** A zero vector, used as the starting point for weight accumulation. */
export function zeroVector(): PersonaVector {
  return { ai_product: 0, data: 0, client: 0, peer: 0 }
}

export function uniformDistribution(): Distribution {
  const p = 1 / PERSONAS.length
  return { ai_product: p, data: p, client: p, peer: p }
}
