/**
 * Fixtures for the cohort retention explorer (section 5).
 *
 * Synthetic, and labelled as such on the page. Shaped to behave like real
 * early-pilot retention: a steep week-one drop, a flattening tail, and later
 * cohorts doing visibly better than earlier ones.
 */

export type Cohort = {
  /** ISO week the merchant signed up. */
  label: string
  size: number
  /** Retention by week offset, starting at week 0 = 1.0 (implicit). */
  retention: number[]
}

export const COHORTS: Cohort[] = [
  { label: 'W01', size: 14, retention: [1.0, 0.5, 0.36, 0.29, 0.21, 0.21, 0.14] },
  { label: 'W02', size: 18, retention: [1.0, 0.56, 0.39, 0.33, 0.28, 0.22, 0.22] },
  { label: 'W03', size: 22, retention: [1.0, 0.59, 0.45, 0.36, 0.32, 0.27] },
  { label: 'W04', size: 19, retention: [1.0, 0.63, 0.47, 0.42, 0.37] },
  { label: 'W05', size: 26, retention: [1.0, 0.69, 0.54, 0.46] },
  { label: 'W06', size: 24, retention: [1.0, 0.71, 0.58] },
  { label: 'W07', size: 31, retention: [1.0, 0.74] },
]

export const MAX_WEEKS = 6

/**
 * The definition is the deliverable. Stating it on the page is the difference
 * between a retention chart and a retention number.
 */
export const COHORT_DEFINITION = {
  cohortBy: 'Week the merchant connected their Instagram account',
  retainedIf: 'Confirmed at least one order in that week',
  excludes: 'Merchants who never completed onboarding',
} as const

export const COHORT_READING =
  'Week one is where it is decided — a merchant who confirms an order in their first week is roughly three times as likely to still be here at week six. Later cohorts hold better than earlier ones, which is the only part of this chart that is evidence the product changed rather than the customers.'
