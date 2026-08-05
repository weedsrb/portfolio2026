import { Annotation, Row } from '@/components/layout/Grid'
import { TrackedLink } from '@/components/TrackedLink'
import {
  CLOSING,
  PERSON,
  SITE,
  TODO_CV_FILE,
  TODO_LINKEDIN_URL,
} from '@/data/content'
import type { SignalId } from '@/lib/inference/signals'

/**
 * Closing: contact, source, and the disclosure.
 *
 * Links whose targets are still unknown are omitted entirely rather than
 * rendered dead. A CV link that 404s costs more than no CV link.
 */

type Link = {
  label: string
  href: string
  external?: boolean
  /** Set where following the link is itself strong evidence of intent. */
  signal?: SignalId
}

function buildLinks(): Link[] {
  const links: Link[] = [
    {
      label: PERSON.email,
      href: `mailto:${PERSON.email}`,
      signal: 'outbound_email',
    },
    {
      label: PERSON.githubLabel,
      href: PERSON.github,
      external: true,
      signal: 'outbound_github',
    },
  ]
  if (TODO_LINKEDIN_URL) {
    links.push({ label: 'LinkedIn', href: TODO_LINKEDIN_URL, external: true })
  }
  if (TODO_CV_FILE) {
    links.push({ label: 'CV', href: TODO_CV_FILE, signal: 'outbound_cv' })
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
          {links.map((link) => {
            const className =
              'border-b border-graticule pb-0.5 font-mono text-sm hover:border-signal hover:text-signal'
            return (
              <li key={link.href}>
                {link.signal ? (
                  <TrackedLink
                    href={link.href}
                    signal={link.signal}
                    external={link.external}
                    className={className}
                  >
                    {link.label}
                  </TrackedLink>
                ) : (
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: '_blank', rel: 'noreferrer noopener' }
                      : {})}
                    className={className}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            )
          })}
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
