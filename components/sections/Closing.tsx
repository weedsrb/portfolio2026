import { Annotation, Row } from '@/components/layout/Grid'
import {
  CLOSING,
  PERSON,
  SITE,
  TODO_CV_FILE,
  TODO_LINKEDIN_URL,
} from '@/data/content'

/**
 * Closing: contact, source, and the disclosure.
 *
 * Links whose targets are still unknown are omitted entirely rather than
 * rendered dead. A CV link that 404s costs more than no CV link.
 */

type Link = { label: string; href: string; external?: boolean }

function buildLinks(): Link[] {
  const links: Link[] = [
    { label: PERSON.email, href: `mailto:${PERSON.email}` },
    { label: PERSON.githubLabel, href: PERSON.github, external: true },
  ]
  if (TODO_LINKEDIN_URL) {
    links.push({ label: 'LinkedIn', href: TODO_LINKEDIN_URL, external: true })
  }
  if (TODO_CV_FILE) {
    links.push({ label: 'CV', href: TODO_CV_FILE })
  }
  return links
}

export function Closing() {
  const links = buildLinks()

  return (
    <footer className="hairline py-16 md:py-24">
      <Row annotation={<Annotation index="08" label="Contact" />}>
        <h2 className="display text-2xl md:text-3xl">{CLOSING.claim}</h2>
        <p className="prose-measure mt-6 text-base text-ink-muted">
          {CLOSING.standfirst}
        </p>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
                className="border-b border-graticule pb-0.5 font-mono text-sm hover:border-signal hover:text-signal"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/*
          Publishing the source of a page that profiles you is the move that
          makes the rest of it credible.
        */}
        <p className="mt-12 border-t border-graticule pt-5 text-sm text-ink-muted">
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink hover:text-signal"
          >
            {SITE.repoLabel}
          </a>
          . Nothing on this page is sent anywhere — there is no analytics, no
          cookie, and no network request behind any of it.
        </p>
      </Row>
    </footer>
  )
}
