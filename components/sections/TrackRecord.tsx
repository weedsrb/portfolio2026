import { TimelineChart } from '@/components/charts/TimelineChart'
import { Panel, Section } from '@/components/sections/Section'
import { SECTIONS, TIMELINE, TOOLS } from '@/data/content'

/**
 * Section 7 — track record.
 *
 * The chart carries the shape; the list carries the detail. No skill bars, no
 * percentage rings — a number claiming I am 82% good at SQL would be the least
 * defensible thing on the page.
 */
export function TrackRecord() {
  return (
    <Section content={SECTIONS[7]}>
      <Panel label="Timeline">
        <div className="px-4 py-6">
          <TimelineChart />
        </div>
      </Panel>

      <ul className="mt-8 border-t border-graticule">
        {TIMELINE.map((entry) => (
          <li
            key={`${entry.org}-${entry.label}`}
            className="border-b border-graticule py-4 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6"
          >
            <span className="annotation sm:pt-1">
              {entry.start} — {entry.end ?? 'now'}
            </span>
            <div className="mt-1.5 sm:mt-0">
              <p className="text-sm">
                <span className="font-medium">{entry.label}</span>
                <span className="text-ink-muted">
                  {' '}
                  · {entry.org}, {entry.city}
                </span>
              </p>
              {entry.note ? (
                <p className="prose-measure mt-1 text-sm text-ink-muted">
                  {entry.note}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <p className="annotation">Tools</p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {TOOLS.map((tool) => (
            <li key={tool} className="font-mono text-xs text-ink-muted">
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
