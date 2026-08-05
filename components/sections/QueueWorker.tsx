import { QueueDiagram } from '@/components/charts/QueueDiagram'
import { QueueSandbox } from '@/components/sections/QueueSandbox'
import { Panel, Section } from '@/components/sections/Section'
import { MOEEN, SECTIONS } from '@/data/content'

/**
 * Section 4 — the production system.
 *
 * The architecture is drawn, and then it is run: the sandbox below lets you
 * kill a worker mid-lease and watch the lease expiry recover the job.
 */

export function QueueWorker() {
  return (
    <Section content={SECTIONS[4]}>
      <Panel label="Architecture">
        <div className="px-4 py-6">
          <QueueDiagram />
        </div>
      </Panel>

      <div className="mt-8">
        <QueueSandbox />
      </div>

      <Panel label="Stack" className="mt-8">
        <div className="px-4 py-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {MOEEN.stack.map((item) => (
              <li key={item} className="font-mono text-xs text-ink-muted">
                {item}
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1.5 border-t border-graticule pt-4">
            {MOEEN.architecture.map((item) => (
              <li key={item} className="prose-measure text-sm text-ink-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </Section>
  )
}
