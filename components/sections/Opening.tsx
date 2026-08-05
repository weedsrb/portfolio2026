import { Row } from '@/components/layout/Grid'
import { MOEEN, PERSON, PRIMARY_CLAIM } from '@/data/content'

/**
 * The fixed opening. Never re-ranks, never moves.
 *
 * Name, one line of what he builds, and one claim — chosen because it is the
 * most defensible thing on the site and has the best proof attached. No nav, no
 * stat row, no scroll hint. Anything else here would be filler.
 */
export function Opening() {
  return (
    <header className="py-20 md:py-32">
      <Row annotation={<span className="annotation">{PERSON.name}</span>}>
        <h1 className="display text-3xl md:text-4xl">{PERSON.line}</h1>

        <p className="prose-measure mt-8 text-lg text-ink-muted">
          I&rsquo;m {PERSON.name}. I build{' '}
          <span className="text-ink">{MOEEN.name}</span> — {MOEEN.tagline}{' '}
          {MOEEN.description}
        </p>

        <p className="display mt-16 max-w-[20ch] text-xl md:text-2xl">
          {PRIMARY_CLAIM}
        </p>
        <p className="prose-measure mt-4 text-sm text-ink-muted">
          The proof is directly below, and you can read the trace yourself.
        </p>
      </Row>
    </header>
  )
}
