import type { ReactNode } from 'react'

/**
 * The instrument layout.
 *
 * A persistent left annotation gutter holds instrument-style labels — section
 * index, rank position, status. The gutter is what makes this read as a readout
 * rather than a blog. Below 900px it collapses to inline labels above each
 * section and the content runs full width.
 */

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[calc(var(--gutter-width)+var(--content-max))] px-[var(--page-pad)]">
      {children}
    </div>
  )
}

type RowProps = {
  /** Contents of the annotation gutter. */
  annotation?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * One gutter + content row. The gutter is `aria-hidden` when it carries only a
 * positional label, because the index is decoration to a screen reader — the
 * heading already says where you are.
 */
export function Row({ annotation, children, className = '' }: RowProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-x-8 md:grid-cols-[var(--gutter-width)_minmax(0,1fr)] ${className}`}
    >
      <div className="md:pt-1">{annotation}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/**
 * The gutter's standard contents: an index, a label, and optionally a live
 * value. Only `live` may ever carry signal teal — the rest are inert.
 */
export function Annotation({
  index,
  label,
  live,
}: {
  index: string
  label: string
  live?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3 md:mb-0 md:block md:sticky md:top-8">
      <span className="annotation text-ink" aria-hidden="true">
        {index}
      </span>
      <span className="annotation md:mt-2 md:block">{label}</span>
      {live ? <div className="md:mt-2">{live}</div> : null}
    </div>
  )
}
