import { describe, expect, it } from 'vitest'

import { constrainToBelowFold, type Measured } from './flip'
import { SECTION_ORDERS, type SectionId } from '@/lib/inference/personas'

/**
 * The below-fold constraint.
 *
 * This is the rule that keeps the re-rank from being infuriating, and it is
 * pure, so it gets tested rather than eyeballed. A page that moves text out
 * from under someone's eyes is broken no matter how good the spring looks.
 */

/** Sections stacked a thousand pixels apart, in the given order. */
function layout(order: readonly SectionId[]): Measured {
  const tops: Measured = new Map()
  order.forEach((id, i) => tops.set(id, i * 1000))
  return tops
}

const DEFAULT: readonly SectionId[] = [1, 2, 4, 3, 5, 7, 6]

describe('constrainToBelowFold', () => {
  it('re-ranks everything when the reader is at the top', () => {
    const { order, frozenCount } = constrainToBelowFold(
      DEFAULT,
      SECTION_ORDERS.client,
      layout(DEFAULT),
      0,
    )
    expect(order).toEqual([...SECTION_ORDERS.client])
    expect(frozenCount).toBe(0)
  })

  it('never moves a section the reader has already scrolled past', () => {
    // Scrolled to 2500: sections at 0, 1000 and 2000 are above the fold.
    const { order, frozenCount } = constrainToBelowFold(
      DEFAULT,
      SECTION_ORDERS.client,
      layout(DEFAULT),
      2500,
    )

    expect(frozenCount).toBe(3)
    // The first three keep both their identity and their relative order.
    expect(order.slice(0, 3)).toEqual([1, 2, 4])
    // The rest are the client ordering of whatever was left.
    expect(order.slice(3)).toEqual(
      SECTION_ORDERS.client.filter((id) => [3, 5, 7, 6].includes(id)),
    )
  })

  it('keeps every section exactly once', () => {
    for (const viewportTop of [0, 500, 2500, 4500, 99_999]) {
      const { order } = constrainToBelowFold(
        DEFAULT,
        SECTION_ORDERS.peer,
        layout(DEFAULT),
        viewportTop,
      )
      expect([...order].sort()).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })

  it('changes nothing once the reader is past everything', () => {
    const { order, frozenCount } = constrainToBelowFold(
      DEFAULT,
      SECTION_ORDERS.data,
      layout(DEFAULT),
      99_999,
    )
    expect(order).toEqual([...DEFAULT])
    expect(frozenCount).toBe(DEFAULT.length)
  })

  it('treats a section starting exactly at the fold as movable', () => {
    // Its top is level with the viewport top, so none of it has been read.
    const { order, frozenCount } = constrainToBelowFold(
      DEFAULT,
      SECTION_ORDERS.client,
      layout(DEFAULT),
      1000,
    )
    expect(frozenCount).toBe(1)
    expect(order[0]).toBe(1)
  })

  it('does not lose a section that has no measurement yet', () => {
    const partial = layout(DEFAULT)
    partial.delete(5)
    const { order } = constrainToBelowFold(
      DEFAULT,
      SECTION_ORDERS.client,
      partial,
      0,
    )
    expect([...order].sort()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})
