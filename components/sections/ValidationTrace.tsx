import { Section } from '@/components/sections/Section'
import { ValidationSandbox } from '@/components/sections/ValidationSandbox'
import { SECTIONS } from '@/data/content'

/**
 * Section 1 — the order validation sandbox.
 *
 * The section shell stays a server component; only the sandbox itself is
 * client-side, so the claim and the note render in the initial HTML.
 */
export function ValidationTrace() {
  return (
    <Section content={SECTIONS[1]}>
      <ValidationSandbox />
    </Section>
  )
}
