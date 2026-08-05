import { describe, expect, it } from 'vitest'

import { draftTotal, validateOrder, type CatalogueItem, type OrderDraft } from './order'

/**
 * The gate is the claim the whole site opens with, so it is tested like
 * production code rather than like a demo.
 */

const CATALOGUE: CatalogueItem[] = [
  { sku: 'KNF-004', name: 'Knafeh tray, large', price: 45, maxQuantity: 10 },
  { sku: 'BKL-011', name: 'Baklava box, 500g', price: 32, maxQuantity: 15 },
]

const ZONES = ['Al-Bireh', 'Ramallah']

function draft(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    lines: [{ sku: 'KNF-004', quantity: 2, unitPrice: 45 }],
    customerName: 'Layla',
    address: 'Al-Bireh',
    ...overrides,
  }
}

const run = (d: OrderDraft) => validateOrder(d, CATALOGUE, ZONES)

describe('validateOrder', () => {
  it('passes a clean order', () => {
    const result = run(draft())
    expect(result.outcome).toBe('pass')
    expect(result.checks.every((c) => c.status === 'pass')).toBe(true)
  })

  it('rejects a SKU that is not in the catalogue', () => {
    const result = run(draft({ lines: [{ sku: 'NOPE-1', quantity: 1, unitPrice: 45 }] }))
    expect(result.outcome).toBe('reject')
    expect(result.checks[0]?.field).toBe('lines[0].sku')
    expect(result.checks[0]?.status).toBe('reject')
  })

  it('rejects a quantity above the catalogue maximum', () => {
    const result = run(draft({ lines: [{ sku: 'KNF-004', quantity: 30, unitPrice: 45 }] }))
    expect(result.outcome).toBe('reject')
    expect(
      result.checks.find((c) => c.field === 'lines[0].quantity')?.detail,
    ).toContain('maximum of 10')
  })

  it('rejects a price the customer asserted', () => {
    // The case the section is built around: a fluent, confident parse that got
    // the price from the customer rather than from the catalogue.
    const result = run(draft({ lines: [{ sku: 'KNF-004', quantity: 2, unitPrice: 30 }] }))
    expect(result.outcome).toBe('reject')
    expect(
      result.checks.find((c) => c.field === 'lines[0].unitPrice')?.detail,
    ).toContain('does not make it the price')
  })

  it('rejects zero, negative and fractional quantities', () => {
    for (const quantity of [0, -3, 1.5]) {
      const result = run(draft({ lines: [{ sku: 'KNF-004', quantity, unitPrice: 45 }] }))
      expect(result.outcome).toBe('reject')
    }
  })

  it('flags missing information rather than rejecting it', () => {
    // Missing is a question for the merchant. Wrong is a refusal. Collapsing
    // the two would either lose orders or invent data.
    const result = run(draft({ customerName: null }))
    expect(result.outcome).toBe('flag')
    expect(result.checks.find((c) => c.field === 'customerName')?.status).toBe('flag')
  })

  it('treats whitespace as missing', () => {
    expect(run(draft({ customerName: '   ' })).outcome).toBe('flag')
  })

  it('rejects an address outside the delivery zones', () => {
    const result = run(draft({ address: 'Amman' }))
    expect(result.outcome).toBe('reject')
  })

  it('matches delivery zones case-insensitively', () => {
    expect(run(draft({ address: 'al-bireh' })).outcome).toBe('pass')
  })

  it('rejects an empty order', () => {
    expect(run(draft({ lines: [] })).outcome).toBe('reject')
  })

  it('lets a rejection outrank a flag', () => {
    const result = run(
      draft({ customerName: null, lines: [{ sku: 'KNF-004', quantity: 99, unitPrice: 45 }] }),
    )
    expect(result.outcome).toBe('reject')
  })

  it('checks every line, not just the first', () => {
    const result = run(
      draft({
        lines: [
          { sku: 'KNF-004', quantity: 2, unitPrice: 45 },
          { sku: 'BKL-011', quantity: 999, unitPrice: 32 },
        ],
      }),
    )
    expect(result.outcome).toBe('reject')
    expect(result.checks.some((c) => c.field === 'lines[1].quantity')).toBe(true)
  })

  it('never consults how confident the parse was', () => {
    // There is nowhere to put a confidence score in the input, by design.
    // If this ever stops being true, the gate has stopped being a gate.
    const withConfidence = { ...draft(), parseConfidence: 0.99 } as OrderDraft
    expect(run(withConfidence)).toEqual(run(draft()))
  })

  it('tolerates floating point in price comparison', () => {
    expect(run(draft({ lines: [{ sku: 'KNF-004', quantity: 1, unitPrice: 45.000001 }] })).outcome).toBe('pass')
  })
})

describe('draftTotal', () => {
  it('multiplies and sums the lines', () => {
    expect(
      draftTotal({
        lines: [
          { sku: 'KNF-004', quantity: 2, unitPrice: 45 },
          { sku: 'BKL-011', quantity: 3, unitPrice: 32 },
        ],
        customerName: null,
        address: null,
      }),
    ).toBe(186)
  })

  it('is zero for an empty order', () => {
    expect(draftTotal({ lines: [], customerName: null, address: null })).toBe(0)
  })
})
