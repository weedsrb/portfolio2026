import { AdaptiveSections, type SectionChild } from '@/components/AdaptiveSections'
import { Page } from '@/components/layout/Grid'
import { DebugPanel } from '@/components/readout/DebugPanel'
import { ReadoutMount } from '@/components/readout/ReadoutMount'
import { Closing } from '@/components/sections/Closing'
import { CohortExplorer } from '@/components/sections/CohortExplorer'
import { Opening } from '@/components/sections/Opening'
import { QueryConsole } from '@/components/sections/QueryConsole'
import { QueueWorker } from '@/components/sections/QueueWorker'
import { ScopedWork } from '@/components/sections/ScopedWork'
import { SimilarityExplorer } from '@/components/sections/SimilarityExplorer'
import { TrackRecord } from '@/components/sections/TrackRecord'
import { ValidationTrace } from '@/components/sections/ValidationTrace'
import { InferenceProvider } from '@/hooks/useInference'
import { DEFAULT_ORDER } from '@/lib/inference/personas'

/**
 * Server component. Every section is rendered here, statically, in the default
 * order — then handed to a client component that decides sequence.
 *
 * First paint is always the default order: no flash, no layout shift, and the
 * page is complete and readable with JavaScript switched off entirely. The
 * adaptation is an enhancement on top of a page that already works.
 */

const SECTION_COMPONENTS = {
  1: ValidationTrace,
  2: QueryConsole,
  3: SimilarityExplorer,
  4: QueueWorker,
  5: CohortExplorer,
  6: ScopedWork,
  7: TrackRecord,
} as const

export default function Home() {
  const sections: SectionChild[] = DEFAULT_ORDER.map((id) => {
    const SectionComponent = SECTION_COMPONENTS[id]
    return { id, node: <SectionComponent /> }
  })

  return (
    <InferenceProvider>
      <Page>
        <Opening />

        <main>
          <AdaptiveSections sections={sections} />
        </main>

        <Closing />
      </Page>

      <ReadoutMount />
      <DebugPanel />
    </InferenceProvider>
  )
}
