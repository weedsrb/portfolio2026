import { type SectionChild } from '@/components/AdaptiveSections'
import { DebugPanel } from '@/components/readout/DebugPanel'
import { Studio } from '@/components/studio/Studio'
import { WorkBlock } from '@/components/studio/WorkBlock'
import { Closing } from '@/components/sections/Closing'
import { CohortExplorer } from '@/components/sections/CohortExplorer'
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
 *
 * Each section is now wrapped in a WorkBlock: the claim reads immediately and
 * the instrument is opt-in. The instruments themselves are unchanged.
 */

const BLOCKS = {
  1: {
    claim: 'The model proposes. My code decides.',
    standfirst:
      'A language model reads a customer message and proposes an order. A validation gate — ordinary, testable code — decides whether it may exist. Edit the parsed order and watch the gate refuse it.',
    openLabel: 'Open the validation sandbox',
    Component: ValidationTrace,
  },
  2: {
    claim: 'I write SQL against real schemas.',
    standfirst:
      'Multi-tenant, ownership-aware, and enforced in the database as well as the API. Write and run your own query against 1,002 rows, on a SQL engine I wrote by hand.',
    openLabel: 'Open the query console',
    Component: QueryConsole,
  },
  3: {
    claim: 'Retrieval, not the buzzword.',
    standfirst:
      'Similarity is not relevance. Past a certain score you retrieve noise that reads plausibly, which is worse than retrieving nothing. Move the cutoff and watch boilerplate cross the line.',
    openLabel: 'Open the similarity explorer',
    Component: SimilarityExplorer,
  },
  4: {
    claim: 'Production systems, not demos.',
    standfirst:
      'Leases, retries, dead-lettering, heartbeats. The interesting part is never the happy path — kill a worker mid-lease and trace how the job comes back.',
    openLabel: 'Open the queue worker',
    Component: QueueWorker,
  },
  5: {
    claim: 'I turn data into decisions.',
    standfirst:
      'A retention number is a definition before it is a figure. Change what counts as retained and watch the answer move — that argument is the actual work.',
    openLabel: 'Open the cohort explorer',
    Component: CohortExplorer,
  },
  6: {
    claim: "Here's what I'd build for you.",
    standfirst:
      'Scoped pieces of work with timelines that are what they actually took, not what they should have taken.',
    openLabel: 'See the scoped work',
    Component: ScopedWork,
  },
  7: {
    claim: 'Work, study, and cities on one axis.',
    standfirst: 'The overlap is the information — where the threads run at the same time.',
    openLabel: 'Open the track record',
    Component: TrackRecord,
  },
} as const

export default function Home() {
  const sections: SectionChild[] = DEFAULT_ORDER.map((id) => {
    const { Component, ...block } = BLOCKS[id]
    return {
      id,
      node: (
        <WorkBlock {...block}>
          <Component />
        </WorkBlock>
      ),
    }
  })

  return (
    <InferenceProvider>
      <Studio sections={sections} />
      <Closing />
      <DebugPanel />
    </InferenceProvider>
  )
}
