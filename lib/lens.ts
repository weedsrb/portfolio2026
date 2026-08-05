import { SECTION_ORDERS, type SectionId } from '@/lib/inference/personas'

/**
 * A lens is a visitor's own declaration of why they came.
 *
 * It replaces the inferred persona as the thing that orders the page. The
 * scoring engine in lib/inference still exists and still runs — but as an
 * exhibit the visitor opens deliberately, never as ambient chrome that reaches
 * a conclusion about someone who never asked it to.
 *
 * The orderings are reused from `SECTION_ORDERS` rather than restated, so the
 * declared path and the inferred path cannot drift apart.
 */

export const LENSES = ['hire', 'build', 'data', 'code'] as const
export type Lens = (typeof LENSES)[number]

export const LENS_LABEL: Record<Lens, string> = {
  hire: "I'm hiring",
  build: 'Scoping a build',
  data: 'Here for the data',
  code: 'Here for the code',
}

/**
 * Each pill's mark, drawn as SVG path data on a shared 16×16 box at one stroke
 * weight. These were Unicode characters (↗ ✱ ▦ ⌘) until the finish review:
 * glyphs standing in for an icon system render differently on every platform,
 * and ⌘ reads as a Mac modifier key rather than "code".
 */
export const LENS_MARK: Record<Lens, string> = {
  hire: 'M4 12 L12 4 M6.5 4 H12 V9.5',
  build: 'M8 2.5 V13.5 M3.2 5.2 L12.8 10.8 M12.8 5.2 L3.2 10.8',
  data: 'M2.5 3.5 H13.5 V12.5 H2.5 Z M2.5 8 H13.5 M8 3.5 V12.5',
  code: 'M6 4 L2.5 8 L6 12 M10 4 L13.5 8 L10 12',
}

/**
 * What the page says about itself once a lens is chosen. Written as a promise
 * about what comes next, not as a claim about who the visitor is.
 */
export const LENS_PROMISE: Record<Lens, string> = {
  hire: 'Scoped work and the track record first — what I would build, and what it actually took.',
  build: 'The delivery record first — how work gets scoped, shipped, and kept running.',
  data: 'The data work first — real schemas, real queries, and the decisions they informed.',
  code: 'The engineering first — queues, leases, failure, and the code that survives it.',
}

/** Lenses map onto the personas the section orderings are already keyed by. */
const LENS_TO_ORDER = {
  hire: 'client',
  build: 'client',
  data: 'data',
  code: 'peer',
} as const

export function orderFor(lens: Lens | null): readonly SectionId[] {
  if (lens === null) return SECTION_ORDERS.default
  if (lens === 'build') return SECTION_ORDERS.ai_product
  return SECTION_ORDERS[LENS_TO_ORDER[lens]]
}
