/**
 * Fixtures for the order validation trace (section 1).
 *
 * Every trace here is pre-computed. There is no model call on this page, and
 * there never will be — the point of the section is the deterministic gate, and
 * a live call would only add latency and a dependency to something that is
 * meant to demonstrate not depending on the model.
 *
 * The third fixture is the important one: the parse is fluent, well-formed and
 * wrong, and the validator catches it anyway because it does not consult the
 * parse's confidence.
 */

export type PipelineStage = 'prefilter' | 'parse' | 'validate'

export type StageStatus = 'pass' | 'flag' | 'reject'

export type ValidationCheck = {
  field: string
  rule: string
  status: StageStatus
  detail: string
}

export type ParsedLine = {
  sku: string | null
  item: string
  quantity: number
  unitPrice: number | null
}

export type MessageFixture = {
  id: string
  /** What arrived, verbatim. */
  message: string
  /** Language(s) actually present, for the annotation label. */
  script: string
  prefilter: {
    status: StageStatus
    detail: string
    /** Cheap deterministic checks that run before any model is invoked. */
    checks: string[]
  }
  parse: {
    /** The model's own reported confidence. Deliberately shown, then ignored. */
    confidence: number
    lines: ParsedLine[]
    customerName: string | null
    address: string | null
    note: string
  }
  validate: {
    status: StageStatus
    checks: ValidationCheck[]
    outcome: string
  }
}

/** Where this merchant delivers. Anything else is refused, not guessed at. */
export const DELIVERY_ZONES = ['Al-Bireh', 'Ramallah', 'Betunia'] as const

/** Catalogue the validator checks against. Small on purpose — it is the point. */
export const CATALOGUE = [
  { sku: 'KNF-004', name: 'Knafeh tray, large', price: 45, maxQuantity: 10 },
  { sku: 'KNF-002', name: 'Knafeh tray, small', price: 25, maxQuantity: 20 },
  { sku: 'BKL-011', name: 'Baklava box, 500g', price: 32, maxQuantity: 15 },
  { sku: 'MAM-007', name: 'Maamoul, dozen', price: 28, maxQuantity: 20 },
  { sku: 'CFE-001', name: 'Arabic coffee, 250g', price: 18, maxQuantity: 30 },
] as const

export const MESSAGE_FIXTURES: MessageFixture[] = [
  {
    id: 'clean-mixed',
    message: 'مرحبا 👋 بدي 2 knafeh tray large و box بقلاوة، توصيل عالبيرة بكرا',
    script: 'Arabic + English, code-switched',
    prefilter: {
      status: 'pass',
      detail: 'Looks like an order. Sent to the parser.',
      checks: [
        'Contains a quantity token',
        'Matches at least one catalogue term',
        'Not a greeting-only message',
        'Not a duplicate of a message seen in the last 60s',
      ],
    },
    parse: {
      confidence: 0.91,
      lines: [
        { sku: 'KNF-004', item: 'Knafeh tray, large', quantity: 2, unitPrice: 45 },
        { sku: 'BKL-011', item: 'Baklava box, 500g', quantity: 1, unitPrice: 32 },
      ],
      customerName: null,
      address: 'Al-Bireh',
      note: 'Delivery requested for tomorrow.',
    },
    validate: {
      status: 'flag',
      checks: [
        {
          field: 'lines[0].sku',
          rule: 'SKU exists in catalogue',
          status: 'pass',
          detail: 'KNF-004 found.',
        },
        {
          field: 'lines[0].unitPrice',
          rule: 'Price matches catalogue',
          status: 'pass',
          detail: '45 matches catalogue price.',
        },
        {
          field: 'lines[1].sku',
          rule: 'SKU exists in catalogue',
          status: 'pass',
          detail: 'BKL-011 found.',
        },
        {
          field: 'customerName',
          rule: 'Required before the order can be confirmed',
          status: 'flag',
          detail: 'Not present in the message. Merchant is asked, not guessed.',
        },
        {
          field: 'address',
          rule: 'Must resolve to a served delivery area',
          status: 'pass',
          detail: 'Al-Bireh is in the merchant’s delivery zone.',
        },
      ],
      outcome:
        'Draft created with one open question. The merchant sees the missing name before anything is confirmed.',
    },
  },
  {
    id: 'not-an-order',
    message: 'كيف الأسعار اليوم؟ في عروض؟',
    script: 'Arabic',
    prefilter: {
      status: 'reject',
      detail: 'Not an order. Routed to the conversation inbox, no model call made.',
      checks: [
        'No quantity token',
        'No catalogue term matched',
        'Interrogative form detected',
      ],
    },
    parse: {
      confidence: 0,
      lines: [],
      customerName: null,
      address: null,
      note: 'Parser never ran. This is the cheap path, and most messages take it.',
    },
    validate: {
      status: 'pass',
      checks: [],
      outcome:
        'Nothing to validate. The message becomes a conversation, which is what it is.',
    },
  },
  {
    id: 'confidently-wrong',
    message: 'بدي ٣٠ صينية كنافة كبيرة للعرس، والسعر اللي اتفقنا عليه ٣٠ شيكل للوحدة',
    script: 'Arabic, Eastern Arabic numerals',
    prefilter: {
      status: 'pass',
      detail: 'Looks like an order. Sent to the parser.',
      checks: [
        'Contains a quantity token (٣٠ normalised to 30)',
        'Matches catalogue term',
        'Not a greeting-only message',
      ],
    },
    parse: {
      confidence: 0.94,
      lines: [
        { sku: 'KNF-004', item: 'Knafeh tray, large', quantity: 30, unitPrice: 30 },
      ],
      customerName: null,
      address: null,
      note: 'Fluent, well-formed, and wrong twice. High confidence throughout.',
    },
    validate: {
      status: 'reject',
      checks: [
        {
          field: 'lines[0].sku',
          rule: 'SKU exists in catalogue',
          status: 'pass',
          detail: 'KNF-004 found.',
        },
        {
          field: 'lines[0].quantity',
          rule: 'Quantity within catalogue maximum',
          status: 'reject',
          detail: '30 exceeds the maximum of 10 for KNF-004.',
        },
        {
          field: 'lines[0].unitPrice',
          rule: 'Price matches catalogue, or has an approved override',
          status: 'reject',
          detail:
            'Customer asserted 30; catalogue price is 45. No approved override exists. A customer stating a price does not make it the price.',
        },
        {
          field: 'address',
          rule: 'Required for a delivery order',
          status: 'flag',
          detail: 'Not present.',
        },
      ],
      outcome:
        'Rejected to the merchant with both problems named. The parse was 0.94 confident and it did not matter — the validator never reads that number.',
    },
  },
]
