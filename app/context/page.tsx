import type { Metadata } from 'next'
import Link from 'next/link'

import { Page, Row } from '@/components/layout/Grid'
import { PERSON, SECTIONS, SITE } from '@/data/content'
import { PERSONA_HYPOTHESIS, PERSONA_LABELS, SECTION_ORDERS } from '@/lib/inference/personas'

/**
 * The tagged-link reference. For Waleed, not for visitors.
 *
 * noindex because it is a private cheat sheet, and because a search result
 * explaining how to pre-seed the page's guess would be an odd first impression.
 */
export const metadata: Metadata = {
  title: `Tagged links — ${PERSON.name}`,
  robots: { index: false, follow: false },
}

const TAGS = [
  { ctx: 'ai', persona: 'ai_product', use: 'AI and product roles, technical hiring managers.' },
  { ctx: 'data', persona: 'data', use: 'Data, BI and analytics roles.' },
  { ctx: 'client', persona: 'client', use: 'Freelance enquiries and small-business buyers.' },
  { ctx: 'eng', persona: 'peer', use: 'Engineers, collaborators, anyone likely to read the source.' },
] as const

export default function ContextPage() {
  return (
    <Page>
      <header className="py-16 md:py-24">
        <Row annotation={<span className="annotation">Reference</span>}>
          <h1 className="display text-2xl md:text-3xl">Tagged links</h1>
          <p className="prose-measure mt-6 text-base text-ink-muted">
            Per-outreach links that seed the page&rsquo;s guess so it is already
            in the right order on arrival. The parameter is stripped from the URL
            as soon as it is read, so a forwarded link never carries someone
            else&rsquo;s context.
          </p>
          <p className="prose-measure mt-4 text-sm text-ink-muted">
            A seeded guess is a starting point, not a verdict — sustained
            behaviour still overrules it, and so does the visitor, in one tap.
          </p>
        </Row>
      </header>

      <main>
        <section className="hairline py-12">
          <Row annotation={<span className="annotation">Links</span>}>
            <ul className="border-t border-graticule">
              {TAGS.map((tag) => (
                <li key={tag.ctx} className="border-b border-graticule py-5">
                  <p className="font-mono text-sm">
                    {SITE.url}/?ctx={tag.ctx}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">{tag.use}</p>
                  <p className="mt-2 font-mono text-xs text-ink-muted">
                    Seeds “{PERSONA_LABELS[tag.persona]}” — {PERSONA_HYPOTHESIS[tag.persona].toLowerCase()}.
                    Order:{' '}
                    {SECTION_ORDERS[tag.persona]
                      .map((id) => SECTIONS[id].proofLabel)
                      .join(' → ')}
                  </p>
                </li>
              ))}
            </ul>
          </Row>
        </section>

        <section className="hairline py-12">
          <Row annotation={<span className="annotation">Also</span>}>
            <dl className="space-y-5">
              <div>
                <dt className="font-mono text-sm">?debug=1</dt>
                <dd className="prose-measure mt-1 text-sm text-ink-muted">
                  Renders the live score matrix, every signal&rsquo;s
                  contribution to each persona, the confidence and the current
                  order. Combine it with a tag:{' '}
                  <span className="font-mono">?ctx=data&amp;debug=1</span>.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm">utm_source / utm_campaign</dt>
                <dd className="prose-measure mt-1 text-sm text-ink-muted">
                  The same four values work as UTM parameters, at 45% of the
                  strength — they survive forwarding and rewriting, so they are
                  treated as weaker evidence.
                </dd>
              </div>
            </dl>
          </Row>
        </section>
      </main>

      <footer className="hairline py-12">
        <Row annotation={<span className="annotation">Back</span>}>
          <Link href="/" className="font-mono text-sm hover:text-signal">
            ← {SITE.url.replace('https://', '')}
          </Link>
        </Row>
      </footer>
    </Page>
  )
}
