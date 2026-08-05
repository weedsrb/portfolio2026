---
name: waleedbarghouthi.com
description: An instrument, not a document — a light plotting surface with one dark, lit readout.
colors:
  surface: "#f5f7f7"
  surface-sunk: "#ecf0f0"
  graticule: "#dce4e4"
  graticule-faint: "#eef2f2"
  ink: "#10161a"
  ink-muted: "#5c6a70"
  signal: "#0e8f76"
  instrument-bg: "#0a0f12"
  instrument-ink: "#e8f0f0"
  instrument-muted: "#93a5ac"
  instrument-rule: "#233036"
  phosphor: "#4fe3c1"
  indigo: "#6c7bff"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "4.209rem"
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'SOFT' 20, 'WONK' 1"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.369rem"
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.333rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.12em"
spacing:
  page-pad: "2rem"
  page-pad-narrow: "1.25rem"
  gutter-width: "11rem"
  content-max: "68rem"
components:
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "0"
  panel-sunk:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    rounded: "0"
  readout:
    backgroundColor: "{colors.instrument-bg}"
    textColor: "{colors.instrument-ink}"
    rounded: "0"
    padding: "16px"
  annotation:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
  live-value:
    textColor: "{colors.signal}"
    typography: "{typography.label}"
---

# Design System: waleedbarghouthi.com

## Overview

**Creative North Star: "The Instrument"**

This is precision measurement equipment, not a page about a person. The
vocabulary is plotting surfaces, fine graticule, tabular numerals, and hairlines
that behave like axes. Nothing is styled to look considered; things are ruled,
aligned, and measured because the content is data and the reader is expected to
operate it. The system earns trust the way an instrument does — by being legible,
calibrated, and honest about what it does not know.

The page is a light, cool paper field carrying one dark, lit object: the readout
panel fixed in the corner. That contrast is the entire composition. Everything on
the light surface is ink, muted ink, or graticule; the only saturated colour that
appears there is Signal Teal, and only on a value that is currently moving. Inside
the readout, a separate and deliberately contained palette — phosphor and indigo —
does work that never leaks onto the page. That containment is what makes the panel
read as a component doing a job rather than as decoration.

Depth is achieved without a single shadow. There are no shadows and effectively no
corner radii in this system; separation comes from hairline rules and a one-step
tonal drop to a sunk surface. A grid of faint graticule lines underlies the page
like plotting paper. The result is flat, quiet, and dense with information, and it
should stay that way.

**Key Characteristics:**
- Flat by construction — zero shadows, zero radii, hairlines as axes
- One accent, rationed by rule, never decorative
- Editorial serif for claims; sans for reading; mono for every measured value
- A single dark instrument on a light field, with a contained sub-palette
- Tabular, aligned, and dense — information over atmosphere

## Colors

A cool, near-neutral paper field with exactly one accent, plus a contained dark
palette that lives only inside the readout.

### Primary
- **Signal Teal** (`#0e8f76`): The only saturated colour permitted on the light
  surface. Applied to computed values that move — a similarity score above the
  cutoff, a validation outcome, the confidence numeral — and to interactive state
  (`:focus-visible`, and `:hover` on a control). Never on a heading, never on an
  inert element.

### Secondary
- **Phosphor** (`#4fe3c1`): The live value inside the readout panel — the leading
  persona, the confidence figure, the breathing field. Never appears outside the
  panel.
- **Indigo** (`#6c7bff`): The readout's secondary plot colour. Never appears
  outside the panel.

### Neutral
- **Paper** (`#f5f7f7`): The page surface. Cool, barely off-white.
- **Sunk Paper** (`#ecf0f0`): One step down, for recessed regions and inset panels.
  The only tonal layering the system uses.
- **Graticule** (`#dce4e4`): Every hairline, rule, border, and axis.
- **Faint Graticule** (`#eef2f2`): The same line pre-blended toward the surface,
  used only for the background plotting grid.
- **Ink** (`#10161a`): Body text and every primary value.
- **Muted Ink** (`#5c6a70`): Annotations, units, secondary and supporting text.
- **Instrument Black** (`#0a0f12`): The readout panel ground — the one dark object.
- **Instrument Ink** (`#e8f0f0`) / **Instrument Muted** (`#93a5ac`): Text inside the
  panel; both clear 4.5:1 on Instrument Black.
- **Instrument Rule** (`#233036`): Hairlines within the panel.

### Named Rules

**The Signal Rule.** Signal Teal may only be applied to a value that is currently
changing or can change. A static heading in signal teal is a lie. There are exactly
two sanctioned uses: a computed value that moves, and interactive state. If you find
Signal Teal on an inert element, that is a bug, not a style choice.

**The Containment Rule.** Phosphor and Indigo never appear outside the readout
panel. Their confinement is what makes the panel read as an instrument rather than
as a decorative flourish.

## Typography

**Display Font:** Fraunces (with Georgia, serif) — variable, `SOFT` 20 / `WONK` 1
**Body Font:** IBM Plex Sans (with system-ui) — 400 / 500 / 600
**Label/Mono Font:** IBM Plex Mono (with ui-monospace) — 400 / 500
**Arabic:** IBM Plex Sans Arabic — 400 / 500

**Character:** A wonky, optically-sized editorial serif states the claims; a neutral
technical sans carries the reading; a mono carries every number and every label. The
pairing is a lab notebook written in a good hand — the serif supplies conviction,
the mono supplies evidence, and the two never do each other's job.

### Hierarchy
- **Display** (Fraunces, 4.209rem, 1.1, -0.02em, `text-wrap: balance`): Section
  claims at the top of each evidence module. Large sizes only. Never for UI.
- **Headline** (Fraunces, 2.369rem, 1.1): Subordinate claims and the opening.
- **Title** (Plex Sans 600, 1.333rem, 1.3): Sub-section and panel headings.
- **Body** (Plex Sans 400, 1rem, 1.6, max 68ch): Standfirsts, notes, and running
  prose.
- **Label / Annotation** (Plex Mono 500, 0.6875rem, 0.12em, uppercase, muted ink):
  Instrument annotation — the small letterspaced labels naming a control, an axis,
  or a unit.

A modular scale runs from 0.6875rem to 4.209rem at roughly 1.333, with three line
heights only: 1.1 tight, 1.3 snug, 1.6 normal.

### Named Rules

**The Measured Value Rule.** Every number the reader is meant to compare is set in
Plex Mono. Numerals that sit in a column must be tabular and must align. A figure in
the sans is a figure nobody is expected to read against another figure.

**The Display-Is-For-Claims Rule.** Fraunces appears only at display and headline
sizes, only on the claims. It never enters a control, a label, or a panel.

## Layout

A centre column with a wide left gutter for annotation: `--content-max` 68rem,
`--gutter-width` 11rem, `--page-pad` 2rem. Below the narrow breakpoint, the gutter
collapses to `0rem` and padding drops to `1.25rem` — annotations move inline rather
than being dropped.

The page carries a background plotting grid built from two `linear-gradient` hairlines
in Faint Graticule, offset by `calc(var(--page-pad) - 1px)` so the grid registers
against the content edge rather than the viewport. Prose is capped at 68ch
(`prose-measure`). Density is high and deliberate: this is a surface for comparing
values, not for resting the eye.

**The Above-The-Fold Rule.** A re-rank may only permute sections that are entirely
below the viewport top. A page that pulls text out from under someone's eyes is
infuriating, and no amount of spring tuning fixes that. This is unit-tested, not
merely reviewed.

## Elevation & Depth

**There are no shadows in this system.** Not one `box-shadow` exists in the source,
and none should be added. Depth is conveyed by exactly two devices: hairline rules
in Graticule that behave like plot axes, and a single tonal step from Paper down to
Sunk Paper for recessed regions. The readout panel separates from the page by tonal
inversion — dark on light — and by a hairline border, never by a shadow.

**The Flat-Field Rule.** Separation is drawn, not lit. If a boundary needs to read,
give it a hairline or a tonal step. Adding a shadow to this system breaks the
instrument metaphor at its root.

## Shapes

Effectively zero radius throughout. The only rounding in the entire system is a
`1px` radius on the `:focus-visible` outline, which exists to keep the ring from
looking chipped at its corners. Panels, controls, inputs, and the readout are all
square.

Form language is rectilinear and axis-aligned: rules run edge to edge, panels are
plain rectangles delimited by hairlines rather than by fills, and borders do the work
that fills and corners would do in a softer system.

**The Square Rule.** Nothing gets a corner radius. A rounded card in this system
reads as an import from a different, friendlier product.

## Components

Components here are **operable, not decorative**. Every one of them is something the
visitor works — a console, a sandbox, a control that moves a number — rather than
something they look at. Chrome is subtracted until only the mechanism is left.

### Panels
- **Corner Style:** Square (0 radius).
- **Background:** Paper (`#f5f7f7`), or Sunk Paper (`#ecf0f0`) when recessed.
- **Border:** A `1px` Graticule hairline. Section dividers use `border-top` only.
- **Shadow Strategy:** None. See Elevation & Depth.
- **Internal Padding:** `1rem` on both axes (`px-4 py-4`); footer rows `px-4 py-3`.
- **Label:** Panels are titled with an `annotation` — uppercase mono, letterspaced,
  muted ink.

### Controls (ranges, inputs, selects)
- **Style:** Native controls, restyled minimally. Range inputs take
  `accent-color: var(--color-signal)` and run full width.
- **Label pattern:** An `annotation` on the left, the live value on the right in mono
  at `0.875rem` in Signal Teal — the value moves, so it earns the accent.
- **Help text:** `0.75rem` in Muted Ink, tied to the control via `aria-describedby`.
- **Focus:** `2px` Signal Teal outline, `3px` offset, `1px` radius. Global, never
  removed.

### The Readout (signature component)
The one dark, lit object on a light page. Fixed to the bottom edge on narrow
viewports (`inset-x-0 bottom-0`, top hairline only); on `md` and up it becomes a
`22rem` panel floated at `right-6 bottom-6` with a full hairline border.

- **Ground:** Instrument Black (`#0a0f12`), text in Instrument Ink.
- **Hierarchy inside:** a `10px` letterspaced uppercase mono kicker in Instrument
  Muted; the hypothesis at `0.875rem` / 1.3 with the persona in Phosphor; a signal
  list in mono where every live figure is Phosphor and every dormant one is
  Instrument Muted.
- **Breathing field:** a canvas bar chart in Phosphor against Instrument Rule for
  null bars. Decorative only in appearance — it plots real signal strength.
- **Override:** always present, always one tap. The instrument proposes; the reader
  disposes.

## Do's and Don'ts

### Do:
- **Do** apply Signal Teal (`#0e8f76`) only to a value that is moving or a control
  responding to input. Two sanctioned uses, no others.
- **Do** set every comparable number in IBM Plex Mono, tabular and aligned.
- **Do** separate regions with a `1px` Graticule hairline or a single tonal step to
  Sunk Paper.
- **Do** keep Fraunces at display and headline sizes, on claims only.
- **Do** label controls with uppercase letterspaced mono `annotation` in Muted Ink.
- **Do** keep the `:focus-visible` ring at `2px` Signal Teal with `3px` offset on
  every interactive element.
- **Do** cap running prose at 68ch.

### Don't:
- **Don't** add a `box-shadow` anywhere. The system has none by construction.
- **Don't** give anything a corner radius. The sole exception is the `1px` on the
  focus ring.
- **Don't** put Signal Teal on a heading, an icon, a border, or any inert element.
  That is a bug, not a style choice.
- **Don't** use Phosphor or Indigo anywhere outside the readout panel.
- **Don't** animate or re-order anything that is above the viewport top.
- **Don't** introduce a fourth typeface, or use Fraunces inside UI.
- **Don't** replace hairline-delimited panels with filled, rounded cards.
