/**
 * Fixtures for the cohort retention explorer (section 5).
 *
 * Synthetic, and labelled as such on the page. Shaped to behave like real
 * early-pilot retention: a steep week-one drop, a flattening tail, and later
 * cohorts doing visibly better than earlier ones.
 *
 * Stored as *weekly activity* — whether the cohort was active in that specific
 * week — rather than as a smooth decreasing curve. That matters: real merchants
 * go quiet for a week and come back, so the series wobbles. A monotonic curve
 * would make "active that week" and "active that week or since" identical by
 * construction, which would quietly turn the section's whole point into a
 * no-op.
 */

export type Cohort = {
  /** ISO week the merchant signed up. */
  label: string
  size: number
  /**
   * Share of the cohort active in each week since signup. Week 0 is 1.0 by
   * definition. Not monotonic — people lapse and return.
   */
  retention: number[]
}

/*
 * The week-to-week swings are deliberate and are not noise in the pejorative
 * sense — at these cohort sizes a single merchant is worth 3 to 7 percentage
 * points, so one person going quiet and coming back moves the line visibly.
 * That is what pilot data actually looks like, and smoothing it would hide the
 * most useful caveat this section has.
 */
export const COHORTS: Cohort[] = [
  { label: 'W01', size: 14, retention: [1.0, 0.5, 0.29, 0.36, 0.14, 0.29, 0.21] },
  { label: 'W02', size: 18, retention: [1.0, 0.56, 0.39, 0.28, 0.22, 0.33, 0.22] },
  { label: 'W03', size: 22, retention: [1.0, 0.59, 0.45, 0.32, 0.27, 0.36] },
  { label: 'W04', size: 19, retention: [1.0, 0.63, 0.42, 0.47, 0.32] },
  { label: 'W05', size: 26, retention: [1.0, 0.69, 0.5, 0.46] },
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
  'Switching the definition moves week-4 retention by about nine points without a single number in the underlying data changing. That is the point: “retention” is not a measurement until you say what it counts. Note the cohort sizes too — at n=14 one merchant is seven points, so a week-to-week swing here is one person going quiet, not a trend. Later cohorts holding better than earlier ones is the only part of this chart that is evidence the product changed rather than the customers.'
