/**
 * Every string and every number on this site.
 *
 * Nothing is hardcoded in JSX. That rule exists so the honesty check is
 * mechanical: if a number appears on the page, it appears here, and it can be
 * traced to something real.
 */

import type { SectionId } from '@/lib/inference/personas'

/* -------------------------------------------------------------------------- */
/* Identity and links                                                          */
/*                                                                             */
/* Anything still unknown stays null rather than guessed. Components render     */
/* nothing at all when a value is missing — a broken link is worse than none.   */
/* -------------------------------------------------------------------------- */

/** TODO(waleed): LinkedIn profile URL. */
export const TODO_LINKEDIN_URL: string | null = null

/** Served from /public. */
export const CV_FILE: string | null = '/waleed-barghouthi-cv.pdf'

/**
 * TODO(waleed): current status of the contract/schedule risk retrieval project.
 * Until this is filled in, the project is described as in progress and is not
 * claimed to be demoable.
 */
export const TODO_RETRIEVAL_STATUS: string | null = null

/* -------------------------------------------------------------------------- */
/* Person                                                                      */
/* -------------------------------------------------------------------------- */

export const PERSON = {
  name: 'Waleed Barghouthi',
  role: 'Product & AI engineering',
  /** One line of what he builds. Sits under the name, at display size. */
  line: 'I build systems that let a model propose and a machine decide.',
  email: 'waleedsrb@gmail.com',
  github: 'https://github.com/weedsrb',
  githubLabel: 'github.com/weedsrb',
} as const

export const SITE = {
  url: 'https://waleedbarghouthi.com',
  description:
    'Waleed Barghouthi builds AI product and data systems. This page works out who you probably are, shows its reasoning, and lets you overrule it.',
  /** Publishing the source of a site that profiles you is the whole point. */
  repo: 'https://github.com/weedsrb/portfolio2026',
  repoLabel: 'Source for this page',
} as const

/**
 * The primary claim. Chosen because it is the most defensible thing on the
 * site, and because it has the best interactive proof available.
 */
export const PRIMARY_CLAIM = 'The model proposes. My code decides.' as const

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

export type SectionContent = {
  id: SectionId
  /** Instrument-style label for the left annotation gutter. */
  index: string
  claim: string
  /** One or two sentences under the claim. Plain, active, specific. */
  standfirst: string
  /** What the proof panel is called. */
  proofLabel: string
  /** The short technical note that closes the section. */
  note: string
  /**
   * Set when the section's data is synthetic. Rendered as a visible label on
   * the section itself, never as a footnote. The honesty rule applies to me
   * too.
   */
  syntheticLabel?: string
  /** True once the proof is operable rather than a rendered still. */
  interactive: boolean
}

export const SECTIONS: Record<SectionId, SectionContent> = {
  1: {
    id: 1,
    index: '01',
    // Not a verbatim repeat of PRIMARY_CLAIM, which sits a few lines above this
    // in the fixed opening. The claim is already made; this section proves it.
    claim: 'Watch it catch a confident mistake.',
    standfirst:
      'A customer sends a message in Arabic, English, or both at once. The model reads it and suggests an order. Nothing it suggests reaches the merchant until deterministic code has checked every field against the catalogue and the rules.',
    proofLabel: 'Order validation sandbox',
    note: 'The parse step is the only part a model touches. Everything after it is ordinary code with ordinary tests: catalogue lookup, quantity bounds, price reconciliation, address completeness. A confident wrong parse is still caught, because the validator does not care how confident the parse was.',
    interactive: true,
  },
  2: {
    id: 2,
    index: '02',
    claim: 'I write SQL against real data.',
    standfirst:
      'Not “familiar with SQL”. Here is a schema shaped like the one Mo’een runs on, and here are queries I actually write against it.',
    proofLabel: 'Query console',
    note: 'The schema mirrors production: orders, order lines, merchants, and the message each order was parsed from. Multi-tenant, so every query has to be ownership-aware — the tenant predicate is not optional and is enforced in the database as well as the API.',
    syntheticLabel:
      'Synthetic data, shaped like the real schema. Pilot merchants’ orders are theirs, not mine to publish.',
    interactive: false,
  },
  3: {
    id: 3,
    index: '03',
    claim: 'I understand retrieval, not the buzzword.',
    standfirst:
      'Documents get chunked, embedded, and searched by cosine similarity. I wrote the cosine by hand rather than pulling a library, because the interesting decisions are in the chunking and the cutoff, not the dot product.',
    proofLabel: 'Similarity explorer',
    note: 'Similarity is not relevance. A high cosine score means two chunks talk alike, which is why the cutoff matters more than the ranking: past a certain score, you are retrieving noise that reads plausibly, and that is worse than retrieving nothing.',
    interactive: false,
  },
  4: {
    id: 4,
    index: '04',
    claim: 'I ship production systems, not demos.',
    standfirst:
      'Mo’een’s worker processes every inbound message through a queue with leases, retries, dead-lettering and heartbeats. The interesting part is not the happy path. It is what happens when a worker dies holding a lease.',
    proofLabel: 'Queue worker',
    note: 'A lease is a claim with an expiry, so a worker that dies mid-job cannot block the queue forever — the lease lapses and the job is reclaimed. Retries are bounded and back off; anything that exhausts them goes to the dead-letter table with its error, where it can be inspected instead of silently disappearing.',
    interactive: false,
  },
  5: {
    id: 5,
    index: '05',
    claim: 'I turn data into decisions.',
    standfirst:
      'Retention by weekly cohort. The question is never “what is our retention” — it is which cohort, measured from when, and what you plan to do differently depending on the answer.',
    proofLabel: 'Cohort retention',
    note: 'Cohorting by signup week rather than by calendar week is what makes the curve mean anything: it separates “our product got better” from “we acquired different people”. The window definition changes the number more than most product changes do.',
    syntheticLabel:
      'Synthetic cohorts, modelled on pilot-shaped retention. The pilot’s real numbers are not mine to publish.',
    interactive: false,
  },
  6: {
    id: 6,
    index: '06',
    claim: 'Here is what I would build for you.',
    standfirst:
      'Scoped, with a deliverable and a timeline rather than a day rate and a vague promise.',
    proofLabel: 'Scoped work',
    note: 'Each of these is something I have already built once. The timeline is what it took, not what I hope it would take.',
    interactive: false,
  },
  7: {
    id: 7,
    index: '07',
    claim: 'Track record.',
    standfirst:
      'Work, study and cities, on one axis. The overlap is the information — the master’s and full-time work ran at the same time, in a different country from where I started.',
    proofLabel: 'Timeline',
    note: 'Two of these overlap by two years. That was the point: the degree was in business informatics while the work was in data engineering, and each was the reason the other made sense.',
    interactive: false,
  },
}

/* -------------------------------------------------------------------------- */
/* Now / building / before                                                     */
/* -------------------------------------------------------------------------- */

export const MOEEN = {
  name: 'Mo’een',
  tagline:
    'An Instagram-first order and conversation workspace for Palestinian and MENA small businesses.',
  description:
    'It turns Arabic, English and mixed customer messages into validated order drafts, with the merchant in control of every one.',
  pilotMerchants: 8,
  stack: [
    'Next.js 16',
    'React 19',
    'TypeScript',
    'Tailwind v4',
    'Supabase',
    'Postgres',
  ],
  architecture: [
    'Provider-neutral AI adapter, so no model vendor is load-bearing',
    'Queue-backed worker with leases, retries and dead-letter handling',
    'Multi-tenant, with ownership enforced at both the database and the API layer',
  ],
} as const

export const TIMELINE = [
  {
    label: 'Product Management Specialist, Consumer',
    org: 'Jawwal',
    city: 'Ramallah',
    start: '2024-01',
    end: null,
    kind: 'work',
    note: 'Fintech products, fixed and mobile features, campaign delivery.',
  },
  {
    label: 'Founder',
    org: 'Mo’een',
    city: 'Ramallah',
    start: '2025-01',
    end: null,
    kind: 'work',
    note: 'In pilot with 8 merchants.',
  },
  {
    label: 'MSc Business Informatics',
    org: 'Corvinus University',
    city: 'Budapest',
    start: '2021-09',
    end: '2023-06',
    kind: 'study',
    note: 'Stipendium Hungaricum scholarship.',
  },
  {
    label: 'BSc Computer Science',
    org: 'ELTE',
    city: 'Budapest',
    start: '2018-09',
    end: '2021-06',
    kind: 'study',
    note: null,
  },
  {
    label: 'Data Engineering Intern',
    org: 'ASAL Technologies',
    city: 'Ramallah',
    start: '2022-06',
    end: '2022-09',
    kind: 'work',
    note: 'ETL pipelines, AWS, analytics integration.',
  },
] as const

/**
 * Fixed axis bounds for the timeline chart.
 *
 * Deliberately constant rather than `new Date()`: a chart whose axis depends on
 * when it renders produces a different server and client output, and the
 * hydration mismatch is the least of the problems with that.
 */
export const TIMELINE_AXIS = { start: '2018-06', end: '2026-12' } as const

export const TOOLS = [
  'SQL / PostgreSQL',
  'Python',
  'TypeScript',
  'Databricks',
  'Power BI',
  'SAP',
  'Supabase',
  'Vercel',
] as const

/* -------------------------------------------------------------------------- */
/* Services (section 6)                                                        */
/* -------------------------------------------------------------------------- */

export const SERVICES = [
  {
    title: 'Document to structured data',
    deliverable:
      'A pipeline that turns your PDFs, invoices or messages into validated rows, with a review step for anything it is unsure about.',
    timeline: '3–4 weeks',
    detail:
      'Includes the validation layer, not just the extraction. The failure mode you care about is a confident wrong answer, and that is what the gate is for.',
  },
  {
    title: 'Churn and cohort analysis',
    deliverable:
      'Cohorted retention over your actual data, with the queries handed over so you can re-run them without me.',
    timeline: '2 weeks',
    detail:
      'You get the SQL and the definitions, not a dashboard you cannot change. The definitions are the deliverable.',
  },
  {
    title: 'Arabic and MENA-language AI systems',
    deliverable:
      'Extraction or classification that works on mixed Arabic/English text, evaluated on your data rather than on a benchmark.',
    timeline: '4–6 weeks',
    detail:
      'Mixed-script, dialectal and code-switched text breaks most off-the-shelf pipelines. I have shipped this and I know where it breaks.',
  },
] as const

/* -------------------------------------------------------------------------- */
/* Closing                                                                     */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* The readout                                                                 */
/*                                                                             */
/* Plain and never coy. "I think you're here to evaluate technical depth" beats */
/* "Analyzing visitor profile…". The copy must also never claim the page is     */
/* doing something it is not — there is no AI watching, and saying so would be  */
/* the one lie that discredits everything else.                                 */
/* -------------------------------------------------------------------------- */

export const READOUT = {
  title: 'What I think you came for',
  unresolved: {
    heading: 'Still working it out.',
    body: 'Not enough to go on yet. Everything below is in its default order.',
  },
  forming: {
    heading: 'Starting to think:',
    body: 'Not confident enough to reorder anything on that yet.',
  },
  resolved: {
    heading: 'I think:',
    body: 'The sections below are ordered for that.',
  },
  pinned: {
    heading: 'Set by you:',
    body: 'I’ll stop guessing and leave the order alone.',
  },
  confidenceLabel: 'Confidence',
  signalsLabel: 'What I’m going on',
  overridePrompt: 'Not you?',
  clearLabel: 'Let it guess again',
  expandLabel: 'Show the reasoning',
  collapseLabel: 'Hide the reasoning',
  disclosureLabel: 'How this works',
} as const

/** The disclosure panel, in the interface's voice rather than a legal one. */
export const HOW_THIS_WORKS = {
  heading: 'How this works',
  intro:
    'This page guesses what you came for and reorders its sections to match. Here is exactly how, because a page that profiles you and will not say how is not worth trusting.',
  points: [
    {
      title: 'Nothing leaves your browser',
      body: 'No analytics, no cookie, no network request, no server. The scoring runs here, on this page, and the result is never sent anywhere. You can check — open the network tab and reload.',
    },
    {
      title: 'It is not an AI',
      body: 'It is a scoring model: each signal below adds or subtracts a fixed number for each of four guesses, and the totals become probabilities. That is why every number here can be explained. It also means it is instant, free, and works offline.',
    },
    {
      title: 'Confidence means how sharp, not how high',
      body: 'If two guesses are close, confidence is low even when one is technically ahead. That is honest: a near-tie is not knowledge, and reporting it as though it were would be the easy lie to tell here.',
    },
    {
      title: 'What is remembered',
      body: 'One entry in this browser’s local storage: a single word for the guess and the time. Nothing else, and you can wipe it below.',
    },
  ],
  weightsHeading: 'Every signal, and what it is worth',
  weightsNote:
    'Read straight out of the source rather than retyped, so this table cannot drift out of date. Positive numbers argue for a guess, negative against.',
  clearDataLabel: 'Forget me',
  clearDataDone: 'Cleared.',
} as const

export const CLOSING = {
  claim: 'Get in touch.',
  standfirst:
    'The fastest way to work out whether I can help is to describe the problem. I will tell you if I am the wrong person for it.',
} as const
