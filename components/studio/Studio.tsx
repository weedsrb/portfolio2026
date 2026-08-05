'use client'

import { useState } from 'react'

import { AdaptiveSections, type SectionChild } from '@/components/AdaptiveSections'
import { LENS_LABEL, orderFor, type Lens } from '@/lib/lens'

import { Chrome } from './Chrome'
import { Hero } from './Hero'

/**
 * Owns the one piece of state the page turns on: which lens the visitor
 * declared, or none.
 *
 * Sections arrive pre-rendered from the server component so the page is
 * complete and ordered with JavaScript off; this only decides sequence.
 */
export function Studio({ sections }: { sections: SectionChild[] }) {
  const [lens, setLens] = useState<Lens | null>(null)

  return (
    <>
      <Chrome />
      <Hero lens={lens} onLensChange={setLens} />

      <main id="work" className="relative z-1">
        <AdaptiveSections
          sections={sections}
          desiredOrder={orderFor(lens)}
          reason={lens ? `for “${LENS_LABEL[lens]}”` : undefined}
        />
      </main>
    </>
  )
}
