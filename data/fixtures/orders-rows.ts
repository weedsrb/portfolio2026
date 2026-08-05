/**
 * The rows behind the query console.
 *
 * Synthetic and labelled as such on the page, generated from a fixed seed so
 * every visitor queries exactly the same data and any result can be checked.
 *
 * Shaped to carry one true finding rather than to look tidy: parse confidence
 * correlates with the merchant leaving a draft alone, but it flattens badly at
 * the top. Roughly a quarter of the most confident parses still need an edit,
 * which is the whole argument for the validation gate in section 1.
 */

import type { Row } from '@/lib/sql/execute'

/** Deterministic PRNG (mulberry32). No Math.random anywhere in this file. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEMO_TENANT = 'm_7f3a'

const MERCHANTS = [
  { id: 'm_7f3a', handle: 'knafeh.house', city: 'Ramallah' },
  { id: 'm_2c91', handle: 'beit.sweets', city: 'Al-Bireh' },
  { id: 'm_5e08', handle: 'dar.coffee', city: 'Nablus' },
]

const SKUS = ['KNF-004', 'KNF-002', 'BKL-011', 'MAM-007', 'CFE-001']
const SCRIPTS = ['ar', 'ar', 'ar', 'mixed', 'mixed', 'en']

/**
 * Probability the merchant left the draft untouched, given the model's
 * confidence. Rises, then flattens — that flattening is the point.
 */
function untouchedChance(confidence: number): number {
  if (confidence < 0.6) return 0.22
  if (confidence < 0.7) return 0.35
  if (confidence < 0.8) return 0.52
  if (confidence < 0.9) return 0.68
  return 0.75
}

function buildOrders(): Row[] {
  const random = rng(20260805)
  const rows: Row[] = []
  const start = Date.UTC(2026, 4, 8) // 2026-05-08
  const days = 90

  for (let i = 0; i < 1002; i++) {
    const merchant = MERCHANTS[Math.floor(random() * MERCHANTS.length)]!

    // Confidence skews high: most parses are easy, which is why the tail
    // matters more than the average.
    const confidence = Number(
      Math.min(0.99, 0.5 + Math.pow(random(), 0.55) * 0.5).toFixed(2),
    )

    const neededEdit = random() > untouchedChance(confidence)
    // A draft the merchant had to fix is likelier to be abandoned than confirmed.
    const confirmed = neededEdit ? random() < 0.62 : random() < 0.94

    const dayOffset = Math.floor(random() * days)
    const created = new Date(start + dayOffset * 86_400_000)

    rows.push({
      id: `o_${String(i).padStart(4, '0')}`,
      merchant_id: merchant.id,
      message_id: `msg_${String(i).padStart(4, '0')}`,
      status: confirmed ? 'confirmed' : neededEdit ? 'rejected' : 'draft',
      parse_confidence: confidence,
      needed_edit: neededEdit,
      script: SCRIPTS[Math.floor(random() * SCRIPTS.length)]!,
      sku: SKUS[Math.floor(random() * SKUS.length)]!,
      quantity: 1 + Math.floor(random() * 4),
      created_at: created.toISOString().slice(0, 10),
    })
  }

  return rows
}

export const ORDER_ROWS: Row[] = buildOrders()

export const MERCHANT_ROWS: Row[] = MERCHANTS.map((m) => ({
  id: m.id,
  handle: m.handle,
  city: m.city,
}))
