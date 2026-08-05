#!/usr/bin/env node
/**
 * The claims this site makes about itself, enforced.
 *
 * The page tells visitors that nothing leaves their browser, that it stores one
 * value, and that its lit colours belong to one component. Those are promises
 * printed on screen. A promise that only a reviewer checks is a promise that
 * eventually breaks — so they are checked here, on every push.
 *
 * Run: node scripts/check-invariants.mjs
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const SOURCE = execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.css'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((f) => !f.startsWith('scripts/'))

const failures = []

function report(rule, file, line, text) {
  failures.push(`  ${file}:${line}\n    ${rule}\n    → ${text.trim()}`)
}

/** Lines of a file, minus whole-line comments, so prose never trips a rule. */
function codeLines(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((text, i) => ({ text, line: i + 1 }))
    .filter(({ text }) => {
      const t = text.trim()
      return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
}

/* -------------------------------------------------------------------------- */
/* 1. Nothing leaves the browser                                               */
/*                                                                             */
/* The central claim, stated in the readout's disclosure panel and in the       */
/* closing section. If this ever fails, the copy has become a lie and the copy  */
/* is the thing that has to change — not this rule.                            */
/* -------------------------------------------------------------------------- */

const NETWORK = [
  [/\bfetch\s*\(/, 'fetch()'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnew\s+WebSocket\b/, 'WebSocket'],
  [/\bnavigator\s*\.\s*sendBeacon\b/, 'sendBeacon'],
  [/\bnavigator\s*\.\s*geolocation\b/, 'geolocation'],
  [/\bimport\s*\(\s*['"]https?:/, 'remote import'],
]

for (const file of SOURCE.filter((f) => /\.tsx?$/.test(f))) {
  for (const { text, line } of codeLines(file)) {
    for (const [pattern, name] of NETWORK) {
      if (pattern.test(text)) {
        report(
          `No network calls: the page promises nothing leaves the browser (${name})`,
          file,
          line,
          text,
        )
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 2. One stored value, in one place                                           */
/*                                                                             */
/* "One entry in this browser's local storage." Keeping every read and write    */
/* inside storage.ts is what makes that auditable, and what guarantees the      */
/* "forget me" button actually clears everything there is.                     */
/* -------------------------------------------------------------------------- */

const STORAGE_OWNER = 'lib/inference/storage.ts'

for (const file of SOURCE.filter((f) => /\.tsx?$/.test(f))) {
  if (file === STORAGE_OWNER) continue
  for (const { text, line } of codeLines(file)) {
    if (/\b(localStorage|sessionStorage|document\s*\.\s*cookie|indexedDB)\b/.test(text)) {
      report(
        `Storage access belongs in ${STORAGE_OWNER}, so one file describes everything kept`,
        file,
        line,
        text,
      )
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 3. The lit colours stay inside the readout                                  */
/*                                                                             */
/* Containment is what makes the field read as a component doing a job rather   */
/* than as decoration sprayed across the page.                                  */
/* -------------------------------------------------------------------------- */

const LIT_ALLOWED = /^(components\/readout\/|app\/globals\.css$)/

for (const file of SOURCE) {
  if (LIT_ALLOWED.test(file)) continue
  for (const { text, line } of codeLines(file)) {
    if (/\b(phosphor|indigo)\b/.test(text)) {
      report(
        'phosphor and indigo may only appear inside the readout panel',
        file,
        line,
        text,
      )
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 4. The disclosure table is generated, not retyped                           */
/*                                                                             */
/* The weights shown to visitors have to come from the same file the engine     */
/* scores with, or the panel drifts into being a nicely-formatted claim.        */
/* -------------------------------------------------------------------------- */

const disclosure = readFileSync('components/readout/HowThisWorks.tsx', 'utf8')
if (!/from '@\/lib\/inference\/signals'/.test(disclosure)) {
  failures.push(
    `  components/readout/HowThisWorks.tsx\n` +
      `    The weights table must be generated from lib/inference/signals.ts\n` +
      `    → the import is gone, so the published weights can now drift`,
  )
}

/* -------------------------------------------------------------------------- */

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} broken promise(s):\n`)
  console.error(failures.join('\n\n'))
  console.error(
    '\nThese rules encode claims the site makes to its visitors in writing.\n' +
      'If a rule is genuinely wrong, change the copy on the page first.\n',
  )
  process.exit(1)
}

console.log(`✓ invariants hold across ${SOURCE.length} files`)
