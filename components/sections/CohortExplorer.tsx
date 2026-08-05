import { CohortControls } from '@/components/sections/CohortControls'
import { Section } from '@/components/sections/Section'
import { SECTIONS } from '@/data/content'

/**
 * Section 5 — cohort retention.
 *
 * The shell stays server-rendered; the definition controls and the chart they
 * drive are client-side.
 */
export function CohortExplorer() {
  return (
    <Section content={SECTIONS[5]}>
      <CohortControls />
    </Section>
  )
}
