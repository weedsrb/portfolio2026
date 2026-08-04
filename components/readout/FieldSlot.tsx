/**
 * Placeholder for the breathing field.
 *
 * Phase 4 replaces the inside of this with a canvas whose motion IS the
 * confidence. It occupies the final dimensions now so the readout's layout is
 * settled before anything starts moving, and so the panel never reflows when
 * the real field lands.
 *
 * Rendered as a static ring at the current confidence, which is legible as a
 * state indicator on its own — which is also exactly what the reduced-motion
 * fallback will be.
 */

const SIZE = 56
const R = 22

export function FieldSlot({ confidence }: { confidence: number }) {
  const circumference = 2 * Math.PI * R
  const filled = Math.max(0, Math.min(1, confidence)) * circumference

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke="var(--color-instrument-rule)"
        strokeWidth="2"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke="var(--color-phosphor)"
        strokeWidth="2"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="butt"
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={3}
        fill="var(--color-indigo)"
        opacity={0.35 + confidence * 0.65}
      />
    </svg>
  )
}
