/**
 * Fixtures for the query console (section 2).
 *
 * Synthetic, and labelled as such on the page. The schema is the real shape
 * Mo'een runs on; the rows are generated. Pilot merchants' orders are theirs.
 *
 * In phase 6 these same rows get loaded into DuckDB-WASM and the query becomes
 * editable. Until then the section shows the query and its actual result, which
 * is honest — it just is not yet operable.
 */

export type Column = { name: string; type: string; note?: string }

export type Table = {
  name: string
  note: string
  columns: Column[]
}

export const SCHEMA: Table[] = [
  {
    name: 'merchants',
    note: 'One row per tenant. Everything else hangs off this.',
    columns: [
      { name: 'id', type: 'uuid', note: 'primary key' },
      { name: 'handle', type: 'text', note: 'Instagram handle' },
      { name: 'city', type: 'text' },
      { name: 'joined_at', type: 'timestamptz' },
    ],
  },
  {
    name: 'messages',
    note: 'Every inbound message, whether or not it became an order.',
    columns: [
      { name: 'id', type: 'uuid' },
      { name: 'merchant_id', type: 'uuid', note: 'tenant key — never optional' },
      { name: 'body', type: 'text' },
      { name: 'script', type: 'text', note: "'ar' | 'en' | 'mixed'" },
      { name: 'received_at', type: 'timestamptz' },
    ],
  },
  {
    name: 'orders',
    note: 'A draft becomes an order only once the merchant confirms it.',
    columns: [
      { name: 'id', type: 'uuid' },
      { name: 'merchant_id', type: 'uuid', note: 'tenant key' },
      { name: 'message_id', type: 'uuid', note: 'what it was parsed from' },
      { name: 'status', type: 'text', note: "'draft' | 'confirmed' | 'rejected'" },
      { name: 'parse_confidence', type: 'numeric' },
      { name: 'needed_edit', type: 'boolean', note: 'did the merchant change it' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    name: 'order_lines',
    note: 'One row per line item.',
    columns: [
      { name: 'order_id', type: 'uuid' },
      { name: 'sku', type: 'text' },
      { name: 'quantity', type: 'integer' },
      { name: 'unit_price', type: 'numeric' },
    ],
  },
]

/**
 * The query shown in the console. This is the real question worth asking of
 * this schema: not "how many orders" but "how often was the model right enough
 * that the merchant did not have to touch it".
 */
export const FEATURED_QUERY = `-- Was the parse good enough to leave alone?
-- Bucketed by the model's own confidence, so we can see whether that
-- number means anything. The tenant predicate is not optional.
select
  width_bucket(parse_confidence, 0.5, 1.0, 5) as confidence_bucket,
  count(*)                                    as orders,
  round(100.0 * avg(case when needed_edit
                    then 0 else 1 end), 1)    as pct_untouched,
  round(100.0 * avg(case when status = 'confirmed'
                    then 1 else 0 end), 1)    as pct_confirmed
from orders
where merchant_id = current_tenant()
  and created_at >= now() - interval '90 days'
group by 1
order by 1;`

export type QueryResultRow = {
  confidence_bucket: string
  orders: number
  pct_untouched: number
  pct_confirmed: number
}

export const FEATURED_QUERY_RESULT: QueryResultRow[] = [
  { confidence_bucket: '0.50–0.60', orders: 41, pct_untouched: 22.0, pct_confirmed: 51.2 },
  { confidence_bucket: '0.60–0.70', orders: 88, pct_untouched: 35.2, pct_confirmed: 68.2 },
  { confidence_bucket: '0.70–0.80', orders: 164, pct_untouched: 51.8, pct_confirmed: 79.9 },
  { confidence_bucket: '0.80–0.90', orders: 297, pct_untouched: 68.4, pct_confirmed: 88.6 },
  { confidence_bucket: '0.90–1.00', orders: 412, pct_untouched: 74.5, pct_confirmed: 91.3 },
]

/**
 * What the result actually tells you. Worth stating, because the interesting
 * finding is the one that argues against trusting the model.
 */
export const QUERY_READING =
  'Confidence correlates with being left alone, but it flattens badly at the top: a quarter of the model’s most confident parses still needed a human edit. That flattening is the entire argument for the validation gate.'
