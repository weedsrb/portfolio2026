import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'

import { COHORTS, MAX_WEEKS, type Cohort } from '@/data/fixtures/cohorts'

/**
 * Cohort retention curves. Hand-built SVG, d3-scale and d3-shape only.
 *
 * Later cohorts sit above earlier ones, and that separation is the whole point
 * of cohorting rather than reporting one blended number — so the curves are
 * drawn on one axis where they can be compared directly.
 */

const W = 720
const H = 320
const M = { top: 16, right: 96, bottom: 40, left: 44 }

const innerW = W - M.left - M.right
const innerH = H - M.top - M.bottom

const x = scaleLinear().domain([0, MAX_WEEKS]).range([0, innerW])
const y = scaleLinear().domain([0, 1]).range([innerH, 0])

const path = line<[number, number]>()
  .x((d) => x(d[0]))
  .y((d) => y(d[1]))

/** Earlier cohorts recede; the newest is drawn at full ink. */
function opacityFor(index: number): number {
  return 0.3 + (0.7 * index) / Math.max(1, COHORTS.length - 1)
}

function points(cohort: Cohort): [number, number][] {
  return cohort.retention.map((value, week) => [week, value])
}

export function RetentionChart() {
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
  const xTicks = Array.from({ length: MAX_WEEKS + 1 }, (_, i) => i)

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[34rem]"
          role="img"
          aria-labelledby="retention-title retention-desc"
        >
          <title id="retention-title">Retention by signup-week cohort</title>
          <desc id="retention-desc">
            Seven weekly cohorts, each starting at 100 percent in week zero.
            Every cohort drops sharply in week one and then flattens. Later
            cohorts retain better than earlier ones: the first cohort falls to 50
            percent by week one and 14 percent by week six, while the most recent
            cohort holds 74 percent at week one.
          </desc>

          <g transform={`translate(${M.left},${M.top})`}>
            {/* Graticule and y axis. */}
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--color-graticule)"
                  strokeWidth="1"
                />
                <text
                  x={-10}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  fill="var(--color-ink-muted)"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                >
                  {Math.round(tick * 100)}
                </text>
              </g>
            ))}

            {/* x axis. */}
            <line
              x1={0}
              x2={innerW}
              y1={innerH}
              y2={innerH}
              stroke="var(--color-ink)"
              strokeWidth="1"
            />
            {xTicks.map((tick) => (
              <text
                key={tick}
                x={x(tick)}
                y={innerH + 18}
                textAnchor="middle"
                fill="var(--color-ink-muted)"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                {tick}
              </text>
            ))}
            <text
              x={innerW / 2}
              y={innerH + 36}
              textAnchor="middle"
              fill="var(--color-ink-muted)"
              fontFamily="var(--font-mono)"
              fontSize="10"
            >
              weeks since signup
            </text>

            {/* Curves. */}
            {COHORTS.map((cohort, i) => {
              const d = path(points(cohort))
              if (!d) return null
              const last = cohort.retention.length - 1
              const lastValue = cohort.retention[last] ?? 0
              return (
                <g key={cohort.label}>
                  <path
                    d={d}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeOpacity={opacityFor(i)}
                    strokeWidth={i === COHORTS.length - 1 ? 2 : 1.25}
                  />
                  <text
                    x={x(last) + 8}
                    y={y(lastValue)}
                    dy="0.32em"
                    fill="var(--color-ink-muted)"
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                  >
                    {cohort.label} · n={cohort.size}
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
