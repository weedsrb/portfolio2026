import { Section } from '@/components/sections/Section'
import { SqlConsole } from '@/components/sections/SqlConsole'
import { SECTIONS } from '@/data/content'

/**
 * Section 2 — the query console.
 *
 * The shell stays a server component. The console is a client component, but
 * the engine is pure, so its first render produces real results in the
 * server-rendered HTML too.
 */
export function QueryConsole() {
  return (
    <Section content={SECTIONS[2]} bare>
      <SqlConsole />
    </Section>
  )
}
