import { Section } from '@/components/sections/Section'
import { TrackedLink } from '@/components/TrackedLink'
import { PERSON, SECTIONS, SERVICES } from '@/data/content'

/**
 * Section 6 — scoped offers.
 *
 * Deliberately not a grid of identical rounded cards. These are three
 * differently-sized pieces of work and they read as a list of them, with the
 * timeline set as a measurement because that is what a buyer is actually
 * shopping for.
 */
export function ScopedWork() {
  return (
    <Section content={SECTIONS[6]} bare>
      <ul className="border-t border-graticule">
        {SERVICES.map((service) => (
          <li
            key={service.title}
            className="border-b border-graticule py-6 md:grid md:grid-cols-[minmax(0,1fr)_8rem] md:gap-8"
          >
            <div>
              <h3 className="display text-lg">{service.title}</h3>
              <p className="prose-measure mt-3 text-sm">{service.deliverable}</p>
              <p className="prose-measure mt-2 text-sm text-ink-muted">
                {service.detail}
              </p>
            </div>
            <div className="mt-4 md:mt-1.5 md:text-right">
              <span className="annotation md:block">Typically</span>
              <span className="ml-2 font-mono text-sm md:ml-0 md:mt-1 md:block">
                {service.timeline}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm">
        <TrackedLink
          href={`mailto:${PERSON.email}`}
          signal="outbound_email"
          className="border-b border-ink pb-0.5 hover:border-signal hover:text-signal"
        >
          Describe the problem
        </TrackedLink>
        <span className="text-ink-muted">
          {' '}
          — I&rsquo;ll tell you if I&rsquo;m the wrong person for it.
        </span>
      </p>
    </Section>
  )
}
