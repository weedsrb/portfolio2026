import { Panel, Section } from '@/components/sections/Section'
import { SECTIONS } from '@/data/content'
import {
  MESSAGE_FIXTURES,
  type MessageFixture,
  type StageStatus,
} from '@/data/fixtures/messages'

/**
 * Section 1 — the order validation trace.
 *
 * Phase 2 renders two fixtures as static traces. Phase 6 makes the fixture
 * selectable and lets you edit the message. The traces themselves are already
 * real; only the picking is missing.
 */

const STATUS_STYLE: Record<StageStatus, string> = {
  pass: 'text-signal border-signal',
  flag: 'text-ink border-ink',
  reject: 'text-ink border-ink',
}

const STATUS_LABEL: Record<StageStatus, string> = {
  pass: 'pass',
  flag: 'needs a human',
  reject: 'rejected',
}

/**
 * Status is a computed outcome that differs per fixture and per check, so it is
 * one of the few places signal teal is legitimately earned.
 */
function StatusChip({ status }: { status: StageStatus }) {
  return (
    <span
      className={`annotation shrink-0 border px-1.5 py-0.5 ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function Stage({
  index,
  name,
  status,
  children,
}: {
  index: string
  name: string
  status: StageStatus
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-graticule first:border-t-0">
      <div className="flex items-center gap-3 bg-surface px-4 py-2.5">
        <span className="annotation" aria-hidden="true">
          {index}
        </span>
        <h4 className="font-mono text-xs font-medium tracking-wide">{name}</h4>
        <span className="ml-auto">
          <StatusChip status={status} />
        </span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

function Trace({ fixture }: { fixture: MessageFixture }) {
  const { prefilter, parse, validate } = fixture
  const parserRan = parse.confidence > 0

  return (
    <Panel className="mt-8 first:mt-0">
      {/* The message, verbatim. Mixed RTL/LTR set properly. */}
      <div className="border-b border-graticule px-4 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="annotation">Inbound</span>
          <span className="annotation">{fixture.script}</span>
        </div>
        <p
          dir="auto"
          lang="ar"
          className="mt-3 font-arabic text-lg leading-snug text-ink"
        >
          {fixture.message}
        </p>
      </div>

      <Stage index="→ 1" name="prefilter" status={prefilter.status}>
        <p className="text-sm text-ink-muted">{prefilter.detail}</p>
        <ul className="mt-3 space-y-1">
          {prefilter.checks.map((check) => (
            <li key={check} className="font-mono text-xs text-ink-muted">
              {check}
            </li>
          ))}
        </ul>
      </Stage>

      <Stage
        index="→ 2"
        name="parse"
        status={parserRan ? 'pass' : 'reject'}
      >
        {parserRan ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="annotation">Model confidence</span>
              <span className="font-mono text-sm text-ink">
                {parse.confidence.toFixed(2)}
              </span>
            </div>
            <table className="mt-4 w-full border-collapse text-left">
              <caption className="sr-only">Lines proposed by the parser</caption>
              <thead>
                <tr className="border-b border-graticule">
                  {['SKU', 'Item', 'Qty', 'Unit'].map((h) => (
                    <th key={h} scope="col" className="annotation py-1.5 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {parse.lines.map((line, i) => (
                  <tr key={`${line.sku}-${i}`} className="border-b border-graticule/60">
                    <td className="py-2 pr-4">{line.sku ?? '—'}</td>
                    <td className="py-2 pr-4 font-sans">{line.item}</td>
                    <td className="py-2 pr-4">{line.quantity}</td>
                    <td className="py-2 pr-4">{line.unitPrice ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1 font-mono text-xs">
              <div className="flex gap-3">
                <dt className="text-ink-muted">customerName</dt>
                <dd>{parse.customerName ?? 'null'}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-ink-muted">address</dt>
                <dd>{parse.address ?? 'null'}</dd>
              </div>
            </dl>
          </>
        ) : null}
        <p className="prose-measure mt-4 text-sm text-ink-muted">{parse.note}</p>
      </Stage>

      <Stage index="→ 3" name="validate" status={validate.status}>
        {validate.checks.length > 0 ? (
          <ul className="space-y-3">
            {validate.checks.map((check) => (
              <li key={check.field + check.rule} className="flex gap-3">
                <StatusChip status={check.status} />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink">{check.field}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    <span className="text-ink">{check.rule}.</span> {check.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="prose-measure mt-5 border-t border-graticule pt-4 text-sm">
          {validate.outcome}
        </p>
      </Stage>
    </Panel>
  )
}

export function ValidationTrace() {
  // The clean case, then the one that matters: a fluent, confident, wrong parse
  // caught by code that never reads the confidence.
  const shown = ['clean-mixed', 'confidently-wrong']
  const fixtures = shown
    .map((id) => MESSAGE_FIXTURES.find((f) => f.id === id))
    .filter((f): f is MessageFixture => Boolean(f))

  return (
    <Section content={SECTIONS[1]}>
      {fixtures.map((fixture) => (
        <Trace key={fixture.id} fixture={fixture} />
      ))}
    </Section>
  )
}
