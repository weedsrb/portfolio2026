import { Page } from '@/components/layout/Grid'
import { Closing } from '@/components/sections/Closing'
import { CohortExplorer } from '@/components/sections/CohortExplorer'
import { Opening } from '@/components/sections/Opening'
import { QueryConsole } from '@/components/sections/QueryConsole'
import { QueueWorker } from '@/components/sections/QueueWorker'
import { ScopedWork } from '@/components/sections/ScopedWork'
import { SimilarityExplorer } from '@/components/sections/SimilarityExplorer'
import { TrackRecord } from '@/components/sections/TrackRecord'
import { ValidationTrace } from '@/components/sections/ValidationTrace'
import { DEFAULT_ORDER, type SectionId } from '@/lib/inference/personas'

/**
 * Server component. Everything static renders here, in the default order.
 *
 * In phase 5 the inference layer hydrates and takes over ordering client-side.
 * First paint always shows this default order — no flash, no layout shift, and
 * the page stays complete and correct with JavaScript switched off entirely.
 */

const SECTION_COMPONENTS: Record<SectionId, () => React.JSX.Element> = {
  1: ValidationTrace,
  2: QueryConsole,
  3: SimilarityExplorer,
  4: QueueWorker,
  5: CohortExplorer,
  6: ScopedWork,
  7: TrackRecord,
}

export default function Home() {
  return (
    <Page>
      <Opening />

      <main>
        {DEFAULT_ORDER.map((id) => {
          const SectionComponent = SECTION_COMPONENTS[id]
          return <SectionComponent key={id} />
        })}
      </main>

      <Closing />
    </Page>
  )
}
