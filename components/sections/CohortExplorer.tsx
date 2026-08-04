import { RetentionChart } from '@/components/charts/RetentionChart'
import { Panel, Section } from '@/components/sections/Section'
import { SECTIONS } from '@/data/content'
import { COHORT_DEFINITION, COHORT_READING } from '@/data/fixtures/cohorts'

/**
 * Section 5 — cohort retention.
 *
 * Phase 2 renders the curves against one fixed definition. Phase 6 makes the
 * window and cohort definition adjustable, which is the point: changing the
 * definition moves the number more than most product changes do.
 */
export function CohortExplorer() {
  return (
    <Section content={SECTIONS[5]}>
      <Panel label="Retention by cohort">
        <div className="px-4 py-6">
          <RetentionChart />
        </div>
      </Panel>

      {/* The definition is the deliverable, so it goes on the page. */}
      <Panel label="Definition" className="mt-8">
        <dl className="divide-y divide-graticule/60">
          {[
            ['Cohorted by', COHORT_DEFINITION.cohortBy],
            ['Retained if', COHORT_DEFINITION.retainedIf],
            ['Excludes', COHORT_DEFINITION.excludes],
          ].map(([term, value]) => (
            <div key={term} className="px-4 py-3 sm:flex sm:gap-6">
              <dt className="annotation sm:w-32 sm:shrink-0 sm:pt-0.5">{term}</dt>
              <dd className="mt-1 text-sm text-ink-muted sm:mt-0">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <p className="prose-measure mt-6 text-sm">{COHORT_READING}</p>
    </Section>
  )
}
