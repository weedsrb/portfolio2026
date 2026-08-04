import { scaleTime } from 'd3-scale'

import { TIMELINE, TIMELINE_AXIS } from '@/data/content'

/**
 * Work, study and cities on one axis.
 *
 * The overlap is the information, so everything shares a single time axis and
 * nothing is grouped away into separate charts. Work is drawn filled, study
 * outlined, which lets the two-year concurrency read at a glance.
 */

const W = 760
/** Tall enough for the bar plus two lines of label, so nothing needs measuring. */
const ROW_H = 62
const M = { top: 24, right: 16, bottom: 34, left: 16 }

/** 'YYYY-MM' → Date. Parsed explicitly so it is not timezone-dependent. */
function parseMonth(value: string): Date {
  const [year, month] = value.split('-').map(Number)
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1))
}

const AXIS_START = parseMonth(TIMELINE_AXIS.start)
const AXIS_END = parseMonth(TIMELINE_AXIS.end)

/** Longest-running first, so the concurrency reads top to bottom. */
const ENTRIES = [...TIMELINE].sort(
  (a, b) => parseMonth(a.start).getTime() - parseMonth(b.start).getTime(),
)

const innerW = W - M.left - M.right
const H = M.top + ENTRIES.length * ROW_H + M.bottom

const x = scaleTime().domain([AXIS_START, AXIS_END]).range([0, innerW])

/** Only years that actually fall inside the axis domain get a tick. */
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].filter(
  (year) => {
    const at = parseMonth(`${year}-01`)
    return at >= AXIS_START && at <= AXIS_END
  },
)

export function TimelineChart() {
  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[38rem]"
          role="img"
          aria-labelledby="timeline-title timeline-desc"
        >
          <title id="timeline-title">Work, study and cities over time</title>
          <desc id="timeline-desc">
            {ENTRIES.map(
              (e) =>
                `${e.label} at ${e.org}, ${e.city}, ${e.start} to ${e.end ?? 'present'}.`,
            ).join(' ')}
          </desc>

          <g transform={`translate(${M.left},${M.top})`}>
            {/* Year graticule. */}
            {YEARS.map((year) => {
              const at = x(parseMonth(`${year}-01`))
              return (
                <g key={year}>
                  <line
                    x1={at}
                    x2={at}
                    y1={-12}
                    y2={ENTRIES.length * ROW_H}
                    stroke="var(--color-graticule)"
                    strokeWidth="1"
                  />
                  <text
                    x={at}
                    y={ENTRIES.length * ROW_H + 20}
                    textAnchor="middle"
                    fill="var(--color-ink-muted)"
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                  >
                    {year}
                  </text>
                </g>
              )
            })}

            {ENTRIES.map((entry, i) => {
              const start = x(parseMonth(entry.start))
              const end = entry.end ? x(parseMonth(entry.end)) : x(AXIS_END)
              const y = i * ROW_H + 8
              const isStudy = entry.kind === 'study'
              const ongoing = entry.end === null

              return (
                <g key={`${entry.org}-${entry.label}`}>
                  <rect
                    x={start}
                    y={y}
                    width={Math.max(2, end - start)}
                    height={12}
                    fill={isStudy ? 'var(--color-surface)' : 'var(--color-ink)'}
                    stroke="var(--color-ink)"
                    strokeWidth="1"
                  />
                  {/* Open right edge where the work is still running. */}
                  {ongoing ? (
                    <rect
                      x={end - 10}
                      y={y}
                      width={10}
                      height={12}
                      fill="var(--color-surface)"
                    />
                  ) : null}

                  {/*
                    Two lines rather than one. Measuring the first line's width
                    to offset the second is what clipped "Jawwal · Ramallah" off
                    the right edge — SVG text has no wrapping to fall back on.
                  */}
                  <text
                    x={start}
                    y={y + 30}
                    fill="var(--color-ink)"
                    fontFamily="var(--font-sans)"
                    fontSize="12"
                  >
                    {entry.label}
                  </text>
                  <text
                    x={start}
                    y={y + 44}
                    fill="var(--color-ink-muted)"
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                  >
                    {entry.org} · {entry.city}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </figure>
  )
}
