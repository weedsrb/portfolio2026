import type { ReactNode } from 'react'

import { Annotation, Row } from '@/components/layout/Grid'
import type { SectionContent } from '@/data/content'

/**
 * The shell every evidence module shares: a claim, an operable proof, and a
 * short technical note.
 *
 * The proof is the argument. The note explains the thing the proof cannot show
 * on its own. Neither is a paragraph asserting that the claim is true.
 */
export function Section({
  content,
  children,
}: {
  content: SectionContent
  children: ReactNode
}) {
  return (
    <section
      id={`section-${content.id}`}
      aria-labelledby={`claim-${content.id}`}
      className="hairline scroll-mt-8 py-16 md:py-24"
    >
      <Row annotation={<Annotation index={content.index} label={content.proofLabel} />}>
        <h2
          id={`claim-${content.id}`}
          className="display text-2xl md:text-3xl"
        >
          {content.claim}
        </h2>

        <p className="prose-measure mt-6 text-base text-ink-muted">
          {content.standfirst}
        </p>

        {content.syntheticLabel ? (
          <SyntheticNotice>{content.syntheticLabel}</SyntheticNotice>
        ) : null}

        <div className="mt-10">{children}</div>

        <TechnicalNote>{content.note}</TechnicalNote>
      </Row>
    </section>
  )
}

/**
 * Synthetic data gets a visible label on the section, not a footnote. The
 * honesty rule that applies to the inference engine applies here too.
 */
export function SyntheticNotice({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 flex max-w-[68ch] gap-3 border-l-2 border-graticule py-1 pl-4 text-sm text-ink-muted">
      <span className="annotation shrink-0 pt-[3px]">Synthetic</span>
      <span>{children}</span>
    </p>
  )
}

export function TechnicalNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 border-t border-graticule pt-5">
      <p className="annotation">Note</p>
      <p className="prose-measure mt-2 text-sm text-ink-muted">{children}</p>
    </div>
  )
}

/** A recessed measurement surface. Where proofs live. */
export function Panel({
  children,
  className = '',
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={`border border-graticule bg-surface-sunk ${className}`}>
      {label ? (
        <div className="border-b border-graticule px-4 py-2">
          <span className="annotation">{label}</span>
        </div>
      ) : null}
      {children}
    </div>
  )
}
