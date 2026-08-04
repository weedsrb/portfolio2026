/**
 * The Mo'een queue worker, drawn rather than described.
 *
 * Hand-built SVG. The happy path runs straight across the top; every failure
 * path drops below it and loops back to the queue on the left. That is the
 * actual shape of the system — the interesting engineering is all in the lower
 * half of this picture.
 *
 * Coordinates are laid out explicitly rather than computed, because the whole
 * value of the drawing is that nothing overlaps anything else.
 */

const W = 800
const H = 380

type BoxProps = {
  x: number
  y: number
  w: number
  h: number
  title: string
  sub: string
  emphasis?: boolean
}

function Box({ x, y, w, h, title, sub, emphasis }: BoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={emphasis ? 'var(--color-surface)' : 'var(--color-surface-sunk)'}
        stroke="var(--color-ink)"
        strokeWidth={emphasis ? 1.5 : 1}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 3}
        textAnchor="middle"
        fill="var(--color-ink)"
        fontFamily="var(--font-mono)"
        fontSize="12"
      >
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 13}
        textAnchor="middle"
        fill="var(--color-ink-muted)"
        fontFamily="var(--font-mono)"
        fontSize="10"
      >
        {sub}
      </text>
    </g>
  )
}

function Flow({ d, dashed }: { d: string; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={dashed ? 'var(--color-ink-muted)' : 'var(--color-ink)'}
      strokeWidth="1"
      strokeDasharray={dashed ? '4 3' : undefined}
      markerEnd={dashed ? 'url(#arrow-muted)' : 'url(#arrow)'}
    />
  )
}

function Label({
  x,
  y,
  children,
  anchor = 'middle',
}: {
  x: number
  y: number
  children: string
  anchor?: 'middle' | 'start'
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill="var(--color-ink-muted)"
      fontFamily="var(--font-mono)"
      fontSize="10"
    >
      {children}
    </text>
  )
}

export function QueueDiagram() {
  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[42rem]"
          role="img"
          aria-labelledby="queue-title queue-desc"
        >
          <title id="queue-title">
            Mo&rsquo;een queue worker, showing lease, retry and dead-letter paths
          </title>
          <desc id="queue-desc">
            An inbound message becomes a row in a jobs queue. A worker claims it
            by taking a lease with an expiry, and holds that lease open with
            periodic heartbeats. On success an order draft is written and the
            merchant sees it. If the worker dies, it stops sending heartbeats,
            the lease expires, and the job returns to the queue for another
            worker to claim. Failures are retried with backoff, bounded; a job
            that exhausts its retries is written to a dead-letter table together
            with its error rather than being dropped.
          </desc>

          <defs>
            <marker
              id="arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--color-ink)" />
            </marker>
            <marker
              id="arrow-muted"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--color-ink-muted)" />
            </marker>
          </defs>

          {/* Heartbeat: the worker proving it is still alive. Sits above the
              happy path so it never crosses a failure route. */}
          <path
            d="M 420,70 C 420,28 500,28 500,70"
            fill="none"
            stroke="var(--color-ink-muted)"
            strokeWidth="1"
            strokeDasharray="3 3"
            markerEnd="url(#arrow-muted)"
          />
          <Label x={460} y={22}>
            heartbeat — extends the lease
          </Label>

          {/* Happy path. */}
          <Box x={20} y={70} w={125} h={56} title="inbound" sub="message" />
          <Box x={195} y={70} w={125} h={56} title="jobs" sub="queue table" />
          <Box x={380} y={70} w={160} h={56} title="worker" sub="holds a lease" emphasis />
          <Box x={625} y={70} w={150} h={56} title="order draft" sub="merchant sees it" />

          <Flow d="M 145,98 L 188,98" />
          <Flow d="M 320,98 L 373,98" />
          <Label x={347} y={90}>claim</Label>
          <Flow d="M 540,98 L 618,98" />
          <Label x={579} y={90}>ok</Label>

          {/* Failure: the worker stops proving it is alive. */}
          <Box x={380} y={190} w={160} h={50} title="worker dies" sub="lease not renewed" />
          <Flow d="M 460,126 L 460,183" dashed />
          <Label x={472} y={162} anchor="start">
            no heartbeat
          </Label>

          {/* The lease lapses and the job goes back to the queue. */}
          <Flow d="M 380,215 L 257,215 L 257,133" dashed />
          <Label x={318} y={207}>lease expired</Label>

          {/* Bounded retries, then the dead-letter table. */}
          <Box x={380} y={290} w={160} h={50} title="retry" sub="bounded, backed off" />
          <Flow d="M 460,240 L 460,283" dashed />

          <Flow d="M 380,315 L 225,315 L 225,133" dashed />
          <Label x={302} y={307}>requeued</Label>

          <Box x={625} y={290} w={150} h={50} title="dead letter" sub="kept, with error" />
          <Flow d="M 540,315 L 618,315" dashed />
          <Label x={579} y={307}>exhausted</Label>
        </svg>
      </div>
    </figure>
  )
}
