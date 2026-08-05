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
group by 1
order by 1;`


/**
 * What the result actually tells you. Worth stating, because the interesting
 * finding is the one that argues against trusting the model — and it is
 * asserted in lib/sql/execute.test.ts against the real rows, so this sentence
 * cannot quietly stop being true.
 */
export const QUERY_READING =
  'Confidence correlates with being left alone, but it flattens badly at the top: a quarter of the model’s most confident parses still needed a human edit. That flattening is the entire argument for the validation gate.'
