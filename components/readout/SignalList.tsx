import { PERSONA_LABELS, type Persona } from '@/lib/inference/personas'
import type { Contribution } from '@/lib/inference/engine'
import { SIGNALS } from '@/lib/inference/signals'

/**
 * What the page is actually going on.
 *
 * The numbers here come from the same computation that produced the confidence
 * shown above them, so the list can never disagree with the claim it explains.
 * That guarantee is the reason the panel is worth opening at all.
 */
export function SignalList({
  contributions,
  leader,
  limit = 4,
}: {
  contributions: Contribution[]
  leader: Persona | null
  limit?: number
}) {
  if (contributions.length === 0) {
    return (
      <p className="text-xs text-instrument-muted">
        Nothing yet. I haven’t seen you do anything worth reading into.
      </p>
    )
  }

  const shown = contributions.slice(0, limit)
  const rest = contributions.length - shown.length
  // Explain the leader where there is one; otherwise the strongest candidate.
  const against: Persona = leader ?? 'ai_product'

  return (
    <div>
      <ul className="space-y-2">
        {shown.map((contribution) => {
          const effect = contribution.perPersona[against]
          return (
            <li
              key={contribution.signal}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="text-xs text-instrument-ink">
                {SIGNALS[contribution.signal].label}
              </span>
              <span
                className={`shrink-0 font-mono text-xs ${
                  effect >= 0 ? 'text-phosphor' : 'text-instrument-muted'
                }`}
              >
                {effect >= 0 ? '+' : '−'}
                {Math.abs(effect).toFixed(2)}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-2.5 font-mono text-[10px] text-instrument-muted">
        {rest > 0 ? `+${rest} more. ` : ''}
        Effect on “{PERSONA_LABELS[against].toLowerCase()}”.
      </p>
    </div>
  )
}
