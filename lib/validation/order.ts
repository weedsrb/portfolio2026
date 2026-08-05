/**
 * The validation gate.
 *
 * This is the real thing, not a description of it. The section that claims "the
 * model proposes, my code decides" runs this function in your browser, on a
 * draft you can edit — so you can put a confidently wrong value into the parse
 * output and watch deterministic code refuse it.
 *
 * Pure: draft in, checks out. No model, no network, no confidence score. It
 * deliberately has no access to how sure the parser was, because that is the
 * entire point — a gate that consults the model's confidence is not a gate.
 */

export type CheckStatus = 'pass' | 'flag' | 'reject'

export type CatalogueItem = {
  sku: string
  name: string
  price: number
  maxQuantity: number
}

export type DraftLine = {
  sku: string
  quantity: number
  unitPrice: number
}

export type OrderDraft = {
  lines: DraftLine[]
  customerName: string | null
  address: string | null
}

export type Check = {
  field: string
  rule: string
  status: CheckStatus
  detail: string
}

export type ValidationResult = {
  checks: Check[]
  /** The worst status in the set: one rejection rejects the order. */
  outcome: CheckStatus
  summary: string
}

/** Rounds money comparisons so 45 and 45.00000001 are the same price. */
function sameMoney(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005
}

export function validateOrder(
  draft: OrderDraft,
  catalogue: readonly CatalogueItem[],
  deliveryZones: readonly string[],
): ValidationResult {
  const checks: Check[] = []

  draft.lines.forEach((line, i) => {
    const item = catalogue.find((entry) => entry.sku === line.sku)

    if (!item) {
      checks.push({
        field: `lines[${i}].sku`,
        rule: 'SKU exists in the catalogue',
        status: 'reject',
        detail: `${line.sku || '(empty)'} is not a product. Nothing downstream gets to invent one.`,
      })
      return
    }

    checks.push({
      field: `lines[${i}].sku`,
      rule: 'SKU exists in the catalogue',
      status: 'pass',
      detail: `${item.sku} — ${item.name}.`,
    })

    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      checks.push({
        field: `lines[${i}].quantity`,
        rule: 'Quantity is a whole number, at least 1',
        status: 'reject',
        detail: `Got ${line.quantity}.`,
      })
    } else if (line.quantity > item.maxQuantity) {
      checks.push({
        field: `lines[${i}].quantity`,
        rule: 'Quantity within the catalogue maximum',
        status: 'reject',
        detail: `${line.quantity} exceeds the maximum of ${item.maxQuantity} for ${item.sku}.`,
      })
    } else {
      checks.push({
        field: `lines[${i}].quantity`,
        rule: 'Quantity within the catalogue maximum',
        status: 'pass',
        detail: `${line.quantity} of a possible ${item.maxQuantity}.`,
      })
    }

    if (sameMoney(line.unitPrice, item.price)) {
      checks.push({
        field: `lines[${i}].unitPrice`,
        rule: 'Price matches the catalogue',
        status: 'pass',
        detail: `${line.unitPrice} matches.`,
      })
    } else {
      checks.push({
        field: `lines[${i}].unitPrice`,
        rule: 'Price matches the catalogue, or has an approved override',
        status: 'reject',
        detail:
          `Draft says ${line.unitPrice}; the catalogue says ${item.price}. ` +
          'A customer stating a price does not make it the price.',
      })
    }
  })

  if (draft.lines.length === 0) {
    checks.push({
      field: 'lines',
      rule: 'An order has at least one line',
      status: 'reject',
      detail: 'Nothing to order.',
    })
  }

  // Missing information is a question for the merchant, not a guess. This is
  // the difference between `flag` and `reject`: one asks, the other refuses.
  checks.push(
    draft.customerName?.trim()
      ? {
          field: 'customerName',
          rule: 'Required before the order can be confirmed',
          status: 'pass',
          detail: draft.customerName.trim(),
        }
      : {
          field: 'customerName',
          rule: 'Required before the order can be confirmed',
          status: 'flag',
          detail: 'Not in the message. The merchant is asked, never guessed at.',
        },
  )

  const address = draft.address?.trim()
  if (!address) {
    checks.push({
      field: 'address',
      rule: 'Required for a delivery order',
      status: 'flag',
      detail: 'Not in the message.',
    })
  } else if (
    deliveryZones.some((zone) => zone.toLowerCase() === address.toLowerCase())
  ) {
    checks.push({
      field: 'address',
      rule: 'Resolves to a served delivery area',
      status: 'pass',
      detail: `${address} is in the merchant’s delivery zone.`,
    })
  } else {
    checks.push({
      field: 'address',
      rule: 'Resolves to a served delivery area',
      status: 'reject',
      detail: `${address} is outside the zones this merchant delivers to.`,
    })
  }

  const outcome: CheckStatus = checks.some((c) => c.status === 'reject')
    ? 'reject'
    : checks.some((c) => c.status === 'flag')
      ? 'flag'
      : 'pass'

  const rejected = checks.filter((c) => c.status === 'reject').length
  const flagged = checks.filter((c) => c.status === 'flag').length

  const summary =
    outcome === 'reject'
      ? `Rejected on ${rejected} ${rejected === 1 ? 'rule' : 'rules'}. The merchant sees exactly which, and why.`
      : outcome === 'flag'
        ? `Draft created with ${flagged} open ${flagged === 1 ? 'question' : 'questions'}. Nothing is confirmed until answered.`
        : 'Every rule passed. The draft goes to the merchant to confirm.'

  return { checks, outcome, summary }
}

/** Total of the draft, for display. Not a validation rule. */
export function draftTotal(draft: OrderDraft): number {
  return draft.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  )
}
