'use client'

import { READOUT } from '@/data/content'
import { PERSONAS, PERSONA_LABELS, type Persona } from '@/lib/inference/personas'

const CHIP_LABELS: Record<Persona, string> = {
  ai_product: 'AI',
  data: 'Data',
  client: 'Client',
  peer: 'Eng',
}

/**
 * The override. One tap, never any typing.
 *
 * This is the part that makes the rest of it acceptable: the page is allowed to
 * guess about you precisely because you can overrule it in one action, and the
 * way out is always visible rather than buried in a settings panel.
 */
export function OverrideChips({
  pinned,
  onPin,
  onClear,
}: {
  pinned: Persona | null
  onPin: (persona: Persona) => void
  onClear: () => void
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] tracking-wider text-instrument-muted uppercase">
          {READOUT.overridePrompt}
        </span>
        {PERSONAS.map((persona) => {
          const active = pinned === persona
          return (
            <button
              key={persona}
              type="button"
              onClick={() => onPin(persona)}
              aria-pressed={active}
              className={`border px-2 py-1 font-mono text-[11px] transition-colors ${
                active
                  ? 'border-phosphor bg-phosphor/10 text-phosphor'
                  : 'border-instrument-rule text-instrument-ink hover:border-instrument-muted'
              }`}
            >
              <span className="sr-only">Set to </span>
              {CHIP_LABELS[persona]}
              <span className="sr-only"> — {PERSONA_LABELS[persona]}</span>
            </button>
          )
        })}
      </div>

      {pinned ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2.5 font-mono text-[11px] text-instrument-muted underline underline-offset-2 hover:text-instrument-ink"
        >
          {READOUT.clearLabel}
        </button>
      ) : null}
    </div>
  )
}
