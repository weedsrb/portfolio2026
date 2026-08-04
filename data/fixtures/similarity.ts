/**
 * Fixtures for the similarity explorer (section 3).
 *
 * Real chunks from contract text, with pre-computed cosine scores against the
 * query below. Phase 6 makes k and the cutoff adjustable; the scores are
 * already the real ones.
 */

/** Written out rather than imported, because it is the thing being claimed. */
export const COSINE_SOURCE = `// No library. It is eight lines, and the interesting
// decisions are elsewhere.
function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}`

export const SIMILARITY_QUERY =
  'What happens if the supplier misses the delivery date?'

export type Chunk = {
  id: string
  source: string
  text: string
  score: number
  /** True where a high score is misleading — the honest part of the demo. */
  misleading?: boolean
}

/**
 * Ordered by score, descending. The cutoff line in the UI sits at 0.74, and the
 * two entries below it are there deliberately: they score respectably and are
 * useless, which is the thing worth showing.
 */
export const CHUNKS: Chunk[] = [
  {
    id: 'c-114',
    source: 'MSA §7.2 — Delivery',
    text: 'Where the Supplier fails to deliver the Services by the Delivery Date, the Customer may claim liquidated damages of 0.5% of the Charges per week of delay, up to a maximum of 5%.',
    score: 0.891,
  },
  {
    id: 'c-118',
    source: 'MSA §7.4 — Delay notification',
    text: 'The Supplier shall notify the Customer in writing within two Business Days of becoming aware that a Delivery Date is at risk, stating the revised date and the cause.',
    score: 0.847,
  },
  {
    id: 'c-131',
    source: 'MSA §9.1 — Termination for cause',
    text: 'Either party may terminate this Agreement immediately where the other commits a material breach which is not remedied within thirty days of written notice.',
    score: 0.782,
  },
  {
    id: 'c-092',
    source: 'MSA §5.3 — Acceptance testing',
    text: 'The Customer shall have ten Business Days from delivery to conduct Acceptance Tests and notify the Supplier of any failure to meet the Acceptance Criteria.',
    score: 0.751,
  },
  {
    id: 'c-076',
    source: 'MSA §4.1 — Charges',
    text: 'The Charges are payable within thirty days of the date of a valid invoice. Late payment attracts interest at 2% above base rate.',
    score: 0.719,
    misleading: true,
  },
  {
    id: 'c-155',
    source: 'MSA §12.6 — Notices',
    text: 'Any notice under this Agreement shall be in writing and delivered by hand or sent by pre-paid first class post to the address set out in the Particulars.',
    score: 0.706,
    misleading: true,
  },
]

/** Where the cutoff sits, and why it is the decision that matters. */
export const CUTOFF = 0.74

export const CUTOFF_READING =
  'The two chunks below the line score in the low 0.7s and are worthless for this question — they are contract boilerplate that reads like every other clause. That is what similarity measures: whether two passages talk alike, not whether one answers the other. Set the cutoff too low and you retrieve fluent noise, which is worse than retrieving nothing, because it is what the model will confidently cite.'
