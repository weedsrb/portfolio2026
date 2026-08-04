import { QueueDiagram } from '@/components/charts/QueueDiagram'
import { Panel, Section } from '@/components/sections/Section'
import { MOEEN, SECTIONS } from '@/data/content'

/**
 * Section 4 — the production system.
 *
 * Phase 2 renders the architecture and walks the failure cases. Phase 6 makes
 * the failures injectable so you can kill a worker mid-lease and trace it.
 */

const FAILURES = [
  {
    trigger: 'Worker dies mid-job',
    behaviour:
      'The lease has an expiry and the worker stopped renewing it. Once it lapses the job is visible to other workers again and gets claimed. Nothing is lost and nothing is stuck.',
  },
  {
    trigger: 'Worker hangs without dying',
    behaviour:
      'This is the harder one. Heartbeats stop even though the process is alive, so the lease lapses and a second worker picks the job up. Handlers are idempotent because this case guarantees a job will occasionally run twice.',
  },
  {
    trigger: 'The model provider is down',
    behaviour:
      'The adapter is provider-neutral, so the call fails and the job retries with backoff rather than the outage reaching the merchant. No vendor is load-bearing.',
  },
  {
    trigger: 'A job keeps failing',
    behaviour:
      'Retries are bounded. On exhaustion the job goes to the dead-letter table with its error and payload, where it can be read and replayed. A job that disappears silently is a job you find out about from a customer.',
  },
  {
    trigger: 'A release makes things worse',
    behaviour:
      'The parse path is behind a switch. Turning it off routes everything to manual entry, which is slower and works.',
  },
] as const

export function QueueWorker() {
  return (
    <Section content={SECTIONS[4]}>
      <Panel label="Architecture">
        <div className="px-4 py-6">
          <QueueDiagram />
        </div>
      </Panel>

      <Panel label="What happens when it breaks" className="mt-8">
        <dl>
          {FAILURES.map((failure) => (
            <div
              key={failure.trigger}
              className="border-b border-graticule/60 px-4 py-4 last:border-b-0 sm:flex sm:gap-6"
            >
              <dt className="font-mono text-xs text-ink sm:w-52 sm:shrink-0">
                {failure.trigger}
              </dt>
              <dd className="mt-1.5 text-sm text-ink-muted sm:mt-0">
                {failure.behaviour}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

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
