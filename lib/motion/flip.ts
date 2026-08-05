import { animate } from 'motion'

import type { SectionId } from '@/lib/inference/personas'

/**
 * The re-rank transition.
 *
 * FLIP: measure where everything is, apply the new order, measure again,
 * invert with transforms, then play. Only `transform` is animated, so the
 * re-rank contributes nothing to layout shift.
 *
 * Two rules that are not negotiable:
 *
 *  - Everything travels together. No stagger. A stagger reads as decoration;
 *    a simultaneous reorganisation reads as a system deciding.
 *  - Nothing fades. Opacity stays at 1 throughout. Fading is how you hide a
 *    reorder; travelling is how you show one.
 */

export const SPRING = { stiffness: 210, damping: 30, mass: 1 } as const

export type Measured = Map<SectionId, number>

/** Records each section's current top, in document coordinates. */
export function measure(
  nodes: Map<SectionId, HTMLElement>,
): Measured {
  const scrollY = window.scrollY
  const measured: Measured = new Map()
  for (const [id, node] of nodes) {
    measured.set(id, node.getBoundingClientRect().top + scrollY)
  }
  return measured
}

/**
 * Constrain a desired order so that nothing at or above the viewport top moves.
 *
 * Sections the reader has already passed keep their current relative order and
 * their positions; the new order applies only beneath them. A page that pulls
 * text out from under someone's eyes is infuriating, and no amount of spring
 * tuning fixes that.
 *
 * @param current     the order currently rendered
 * @param desired     the order the engine wants
 * @param tops        each section's document-space top, from `measure`
 * @param viewportTop the current scroll position, passed in rather than read,
 *                    so this stays a pure function and can be unit-tested
 */
export function constrainToBelowFold(
  current: readonly SectionId[],
  desired: readonly SectionId[],
  tops: Measured,
  viewportTop: number,
): { order: SectionId[]; frozenCount: number } {
  const frozen: SectionId[] = []
  const movable: SectionId[] = []

  for (const id of current) {
    const top = tops.get(id)
    // Anything whose top is above the viewport top is either being read or has
    // been read. It stays exactly where it is.
    if (top === undefined || top < viewportTop) frozen.push(id)
    else movable.push(id)
  }

  const movableSet = new Set(movable)
  const reordered = desired.filter((id) => movableSet.has(id))

  // frozenCount lets the caller announce what actually moved. Naming a frozen
  // section as "now first" would describe a change that did not happen.
  return { order: [...frozen, ...reordered], frozenCount: frozen.length }
}

/**
 * Play the transition from previously-measured positions to current ones.
 *
 * Call after the new order has been committed to the DOM.
 */
export function playFlip(
  before: Measured,
  nodes: Map<SectionId, HTMLElement>,
  options: { reducedMotion: boolean },
): void {
  const after = measure(nodes)

  for (const [id, node] of nodes) {
    const from = before.get(id)
    const to = after.get(id)
    if (from === undefined || to === undefined) continue

    const delta = from - to
    if (Math.abs(delta) < 1) continue

    if (options.reducedMotion) {
      // Instant reorder. The aria-live announcement carries the change instead.
      node.style.transform = ''
      continue
    }

    // Invert, then play. Everything starts together and settles together.
    node.style.transform = `translate3d(0, ${delta}px, 0)`
    node.style.willChange = 'transform'

    animate(
      node,
      { transform: 'translate3d(0, 0px, 0)' },
      { type: 'spring', ...SPRING },
    ).then(() => {
      node.style.transform = ''
      node.style.willChange = ''
    })
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
