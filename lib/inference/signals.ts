/**
 * The signal registry: every piece of evidence the page can observe, what it
 * argues for, what it argues against, and how much it is allowed to matter.
 *
 * This file is the honest core of the whole mechanism. The "How this works"
 * panel reads its numbers straight out of here rather than restating them in
 * prose, so the page cannot drift out of sync with what it actually does.
 *
 * Nothing here touches the DOM and nothing here is sent anywhere.
 */

import type { DecayClass } from './decay'
import { zeroVector, type PersonaVector, type SectionId } from './personas'

/* -------------------------------------------------------------------------- */
/* Section affinities                                                          */
/* -------------------------------------------------------------------------- */

/**
 * What it means when someone spends time on, or operates, a given section.
 *
 * Negative entries carry real information: an engineer lingering on the pricing
 * cards is weak evidence, but an engineer *not* being the one who lingers there
 * is worth encoding. A signal that argues against a persona is as useful as one
 * that argues for it.
 */
export const SECTION_AFFINITY: Record<SectionId, PersonaVector> = {
  // 1 — the model proposes, my code decides (order validation sandbox)
  1: { ai_product: 1.0, data: 0.15, client: 0.25, peer: 0.35 },
  // 2 — I write SQL against real data (in-browser SQL console)
  2: { ai_product: 0.1, data: 1.0, client: -0.1, peer: 0.3 },
  // 3 — retrieval, not the buzzword (similarity explorer)
  3: { ai_product: 0.75, data: 0.2, client: -0.35, peer: 0.7 },
  // 4 — production systems, not demos (queue worker walkthrough)
  4: { ai_product: 0.3, data: -0.05, client: -0.4, peer: 1.0 },
  // 5 — data into decisions (cohort / retention explorer)
  5: { ai_product: 0.05, data: 1.0, client: 0.3, peer: -0.1 },
  // 6 — what I would build for you (scoped offer cards)
  6: { ai_product: -0.2, data: -0.15, client: 1.0, peer: -0.35 },
  // 7 — track record. Everyone reads this one; it discriminates almost nothing.
  7: { ai_product: 0.15, data: 0.15, client: 0.15, peer: 0.1 },
}

/* -------------------------------------------------------------------------- */
/* Signals                                                                     */
/* -------------------------------------------------------------------------- */

export const SIGNAL_IDS = [
  // Entry — read once, on mount.
  'ctx_ai',
  'ctx_data',
  'ctx_client',
  'ctx_eng',
  'ref_linkedin',
  'ref_github',
  'ref_upwork',
  'ref_search',
  'device_small_touch',
  'device_wide_pointer',
  'lang_arabic',
  'return_ai_product',
  'return_data',
  'return_client',
  'return_peer',

  // Behavioural — continuous.
  'dwell_1',
  'dwell_2',
  'dwell_3',
  'dwell_4',
  'dwell_5',
  'dwell_6',
  'dwell_7',
  'engage_1',
  'engage_2',
  'engage_3',
  'engage_4',
  'engage_5',
  'engage_6',
  'engage_7',
  'copy_text',
  'outbound_cv',
  'outbound_github',
  'outbound_email',
] as const

export type SignalId = (typeof SIGNAL_IDS)[number]

export type SignalDefinition = {
  id: SignalId
  /** How the readout and the disclosure panel name this signal. */
  label: string
  /** Plain-language description for the "How this works" panel. */
  note: string
  /** Log-odds contributed per unit of strength. */
  weights: PersonaVector
  /**
   * Ceiling on the total strength this signal can accumulate, however many
   * times it fires. No single behaviour gets to dominate the reading.
   *
   * The cap is on strength rather than on the resulting log-odds, so that
   * saturating a signal scales its weight vector down without changing its
   * direction. Clipping per-persona would quietly distort what the signal
   * argues — the strong persona would clip while the weak ones kept climbing.
   */
  cap: number
  decay: DecayClass
}

/** Scales a section's affinity vector into a weight vector for a signal. */
function fromSection(section: SectionId, magnitude: number): PersonaVector {
  const affinity = SECTION_AFFINITY[section]
  return {
    ai_product: affinity.ai_product * magnitude,
    data: affinity.data * magnitude,
    client: affinity.client * magnitude,
    peer: affinity.peer * magnitude,
  }
}

/**
 * A tagged link is the strongest single signal available: it is the one case
 * where someone has effectively told us the context up front.
 *
 * It argues hard against the other three as well. If I sent you the link for
 * engineers, you are probably not here to buy anything — and that separation is
 * what lets a tagged link resolve the page on arrival rather than merely lean.
 */
function tagged(target: keyof PersonaVector): PersonaVector {
  const v = zeroVector()
  v.ai_product = -0.8
  v.data = -0.8
  v.client = -0.8
  v.peer = -0.8
  v[target] = 2.2
  return v
}

const DWELL_MAGNITUDE = 0.55
const ENGAGE_MAGNITUDE = 1.5

const ENTRY_SIGNALS: SignalDefinition[] = [
  {
    id: 'ctx_ai',
    label: 'Tagged link — AI',
    note: 'You followed a link I tagged for AI and product conversations.',
    weights: tagged('ai_product'),
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ctx_data',
    label: 'Tagged link — data',
    note: 'You followed a link I tagged for data and analytics conversations.',
    weights: tagged('data'),
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ctx_client',
    label: 'Tagged link — client',
    note: 'You followed a link I tagged for client work.',
    weights: tagged('client'),
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ctx_eng',
    label: 'Tagged link — engineering',
    note: 'You followed a link I tagged for engineers.',
    weights: tagged('peer'),
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ref_linkedin',
    label: 'Came from LinkedIn',
    note: 'Your browser said the previous page was LinkedIn. People arrive there to evaluate, more often than to buy.',
    weights: { ai_product: 0.9, data: 0.7, client: -0.3, peer: -0.2 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ref_github',
    label: 'Came from GitHub',
    note: 'Your browser said the previous page was GitHub.',
    weights: { ai_product: 0.6, data: -0.1, client: -0.5, peer: 1.1 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ref_upwork',
    label: 'Came from a freelance marketplace',
    note: 'Your browser said the previous page was Upwork or similar.',
    weights: { ai_product: -0.4, data: -0.3, client: 1.6, peer: -0.5 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'ref_search',
    label: 'Came from a search engine',
    note: 'Barely evidence at all. Everybody arrives this way, so it moves the numbers almost not at all.',
    weights: { ai_product: 0.05, data: 0.05, client: 0.05, peer: 0.05 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'device_small_touch',
    label: 'Small touch screen',
    note: 'Read from screen size and pointer type only — no device fingerprinting. Reading on a phone leans casual rather than evaluative.',
    weights: { ai_product: -0.1, data: -0.1, client: 0.35, peer: -0.25 },
    cap: 1.0,
    decay: 'none',
  },
  {
    id: 'device_wide_pointer',
    label: 'Wide screen, mouse',
    note: 'Read from screen size and pointer type only. Sitting at a desk leans evaluative.',
    weights: { ai_product: 0.2, data: 0.2, client: -0.15, peer: 0.2 },
    cap: 1.0,
    decay: 'none',
  },
  {
    id: 'lang_arabic',
    label: 'Arabic browser language',
    note: 'Very weak, and it never changes the language of the page. It only slightly favours the client hypothesis, because that is who Mo’een serves.',
    weights: { ai_product: -0.05, data: -0.05, client: 0.3, peer: -0.05 },
    cap: 1.0,
    decay: 'none',
  },
  {
    id: 'return_ai_product',
    label: 'You were here before',
    note: 'A previous visit settled on the AI hypothesis. It comes back at 40% strength, as a starting guess rather than a conclusion.',
    weights: { ai_product: 1.0, data: -0.15, client: -0.15, peer: -0.15 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'return_data',
    label: 'You were here before',
    note: 'A previous visit settled on the data hypothesis. It comes back at 40% strength.',
    weights: { ai_product: -0.15, data: 1.0, client: -0.15, peer: -0.15 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'return_client',
    label: 'You were here before',
    note: 'A previous visit settled on the client hypothesis. It comes back at 40% strength.',
    weights: { ai_product: -0.15, data: -0.15, client: 1.0, peer: -0.15 },
    cap: 1.0,
    decay: 'slow',
  },
  {
    id: 'return_peer',
    label: 'You were here before',
    note: 'A previous visit settled on the engineering hypothesis. It comes back at 40% strength.',
    weights: { ai_product: -0.15, data: -0.15, client: -0.15, peer: 1.0 },
    cap: 1.0,
    decay: 'slow',
  },
]

const SECTION_LABELS: Record<SectionId, string> = {
  1: 'the validation sandbox',
  2: 'the SQL console',
  3: 'the similarity explorer',
  4: 'the queue worker',
  5: 'the cohort explorer',
  6: 'what I’d build for you',
  7: 'the track record',
}

function dwellSignal(section: SectionId): SignalDefinition {
  return {
    id: `dwell_${section}` as SignalId,
    label: `Time on ${SECTION_LABELS[section]}`,
    note: `You kept ${SECTION_LABELS[section]} on screen. Only counts while this tab is focused, and fast scrolling past does not count.`,
    weights: fromSection(section, DWELL_MAGNITUDE),
    cap: 1.5,
    decay: 'behavioural',
  }
}

function engageSignal(section: SectionId): SignalDefinition {
  return {
    id: `engage_${section}` as SignalId,
    label: `Used ${SECTION_LABELS[section]}`,
    note: `You actually operated ${SECTION_LABELS[section]}. Doing something counts for far more than looking at it.`,
    weights: fromSection(section, ENGAGE_MAGNITUDE),
    cap: 2.0,
    decay: 'behavioural',
  }
}

const BEHAVIOURAL_SIGNALS: SignalDefinition[] = [
  ...([1, 2, 3, 4, 5, 6, 7] as const).map(dwellSignal),
  ...([1, 2, 3, 4, 5, 6, 7] as const).map(engageSignal),
  {
    id: 'copy_text',
    label: 'Copied something',
    note: 'You selected and copied text. That usually means you are taking something away to use, so it nudges every evaluative reading up slightly.',
    weights: { ai_product: 0.3, data: 0.3, client: 0.2, peer: 0.2 },
    cap: 1.0,
    decay: 'behavioural',
  },
  {
    id: 'outbound_cv',
    label: 'Opened the CV',
    note: 'Close to a decision. People who open a CV are usually assessing a hire.',
    weights: { ai_product: 0.8, data: 0.8, client: 0.2, peer: 0.0 },
    cap: 1.5,
    decay: 'behavioural',
  },
  {
    id: 'outbound_github',
    label: 'Opened GitHub',
    note: 'Going to read the source is an engineer’s move.',
    weights: { ai_product: 0.5, data: 0.0, client: -0.3, peer: 1.0 },
    cap: 1.5,
    decay: 'behavioural',
  },
  {
    id: 'outbound_email',
    label: 'Started an email',
    note: 'The strongest thing anyone does on this page.',
    weights: { ai_product: 0.4, data: 0.3, client: 0.9, peer: -0.1 },
    cap: 1.5,
    decay: 'behavioural',
  },
]

export const SIGNALS: Record<SignalId, SignalDefinition> = Object.fromEntries(
  [...ENTRY_SIGNALS, ...BEHAVIOURAL_SIGNALS].map((s) => [s.id, s]),
) as Record<SignalId, SignalDefinition>

/* -------------------------------------------------------------------------- */
/* Strength functions                                                          */
/* -------------------------------------------------------------------------- */

/** Dwell saturates: the first ten seconds matter far more than the next sixty. */
export const DWELL_SATURATION_SECONDS = 30

/**
 * @param seconds       accumulated focused time on the section
 * @param skimFactor    0 = reading, 1 = scrolling straight past. Scroll velocity
 *                      does not score on its own; it suppresses dwell, so a
 *                      scroll-past never gets counted as reading.
 */
export function dwellStrength(seconds: number, skimFactor = 0): number {
  if (seconds <= 0) return 0
  const saturated = Math.log1p(seconds) / Math.log1p(DWELL_SATURATION_SECONDS)
  const clamped = Math.min(1, saturated)
  return clamped * (1 - Math.min(1, Math.max(0, skimFactor)))
}

/** Escalating credit for how far into a module someone got. */
export const ENGAGEMENT_DEPTH = {
  opened: 0.35,
  interacted: 0.7,
  completed: 1.0,
} as const

export type EngagementDepth = keyof typeof ENGAGEMENT_DEPTH

/** A tagged link read from `?ctx=`. UTM carries the same signal, more weakly. */
export const TAG_STRENGTH = { ctx: 1.0, utm: 0.45 } as const

/** A prior session's conclusion returns at 40% of its final strength. */
export const RETURN_VISIT_STRENGTH = 0.4
