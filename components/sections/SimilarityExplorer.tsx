import { Panel, Section } from '@/components/sections/Section'
import { SimilarityControls } from '@/components/sections/SimilarityControls'
import { SECTIONS } from '@/data/content'
import { COSINE_SOURCE } from '@/data/fixtures/similarity'

/**
 * Section 3 — the similarity explorer.
 *
 * The shell and the source listing stay server-rendered; only the two knobs
 * and the ranked list are client-side.
 */
export function SimilarityExplorer() {
  return (
    <Section content={SECTIONS[3]}>
      <SimilarityControls />

      <Panel label="cosine.ts" className="mt-8">
        <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed">
          <code>{COSINE_SOURCE}</code>
        </pre>
      </Panel>
    </Section>
  )
}
