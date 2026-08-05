---
name: waleedbarghouthi.com
description: A studio page in warm bone and one vermilion, where the visitor declares why they came.
colors:
  surface: "#eceae5"
  surface-sunk: "#e2dfd8"
  surface-raised: "#fffefb"
  graticule: "#d5d1c8"
  graticule-faint: "#e4e1da"
  ink: "#14120f"
  ink-muted: "#6d675d"
  signal: "#b8330d"
  signal-display: "#e8471f"
typography:
  display:
    fontFamily: "Anton, Arial Black, sans-serif"
    fontSize: "clamp(3.2rem, 12.2vw, 11rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Anton, Arial Black, sans-serif"
    fontSize: "clamp(2.1rem, 5.4vw, 4.4rem)"
    fontWeight: 400
    lineHeight: 0.92
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.12em"
spacing:
  page-pad: "2rem"
  page-pad-narrow: "1.25rem"
  content-max: "68rem"
components:
  pill:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "999px"
    padding: "0.6rem 1.05rem"
    typography: "{typography.label}"
  pill-chosen:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.surface-raised}"
    rounded: "999px"
  cta:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.surface-raised}"
    rounded: "999px"
    padding: "0.625rem 1.25rem"
---

# Design System: waleedbarghouthi.com

## Overview

**Creative North Star: "The Studio Page"**

A large, confident studio page that says who this is in one line, states its
claim at the scale of a wordmark, and then asks the visitor a question. The
whole system exists to make one interaction feel inevitable: you say why you
came, and the page commits to that answer.

The ground is warm bone — not cool paper, not near-black. It is the colour of a
studio wall under daylight, and it carries a real grain layer so the surface has
tooth rather than reading as flat #fff. Against it, near-black ink and exactly
one vermilion. Everything is enormous or quiet; there is no middle register.
Anton at display size is the loudest thing on any screen and the only face
permitted to be loud.

Depth is drawn, not lit. There are no shadows and effectively no radii except on
the pills, which are fully round by rule. Regions separate with a single hairline
rule. The generosity is the point: this system spends space the way the previous
one spent density, and a passage that feels too empty is usually correct.

**Key Characteristics:**
- Warm bone ground with real grain, never a flat white
- One vermilion, split into a text role and a display role by contrast
- Anton enormous for claims; Archivo for reading; Azeret for every measured value
- Every control is a pill; nothing else is round
- Skim first, operate on request — no instrument opens uninvited

## Colors

A warm near-neutral ground, near-black ink, and a single vermilion that marks
only what is live or chosen.

### Primary
- **Vermilion** (`#b8330d`): The text and fill role. Chosen lens pills, the
  primary call to action, focus rings, and any computed value that moves. Clears
  4.5:1 on the bone ground and carries white at 5.9:1, so it is safe at any size.
- **Display Vermilion** (`#e8471f`): The bright one, at 3.28:1. Large text only
  — "decides." in the wordmark. It may never carry body copy, a label, a small
  numeral, or white text.

### Neutral
- **Bone** (`#eceae5`): The page ground.
- **Sunk Bone** (`#e2dfd8`): One step down, for recessed regions.
- **Raised** (`#fffefb`): Pills and the floating nav — the only surfaces that sit
  above the page.
- **Graticule** (`#d5d1c8`): Every hairline and rule.
- **Ink** (`#14120f`): Body text and claims.
- **Muted Ink** (`#6d675d`): Labels, annotations, and supporting text.

### Named Rules

**The Signal Rule.** Vermilion may only be applied to something that is currently
changing, can change, or has just been chosen. A static heading in vermilion is a
lie. Two sanctioned uses: a computed value that moves, and interactive or chosen
state. On an inert element it is a bug, not a style choice.

**The Two Vermilions Rule.** The split between `--signal` and `--signal-display`
is a contrast rule, not a taste one. If the text is under 24px, or if white sits
on top of it, it takes `--signal`. There is no third vermilion.

**The One Accent Rule.** There is one accent. An earlier build gave each lens
pill its own candy hue; that spent colour on four inert pills and drained it from
the one the visitor had actually chosen. Colour marks the choice, never the menu.

## Typography

**Display Font:** Anton (with Arial Black) — one weight, 400
**Body Font:** Archivo (with system-ui) — 400 / 500 / 600 / 700
**Label/Mono Font:** Azeret Mono (with ui-monospace) — 400 / 500
**Arabic:** IBM Plex Sans Arabic — 400 / 500

**Character:** An ultra-condensed grotesque shouts the claim; a wide, level
grotesque carries the reading; a mono carries every measured value and every
label. Anton has no other weight and needs none — scale is its only variable.

### Hierarchy
- **Display** (Anton, `clamp(3.2rem, 12.2vw, 11rem)`, 0.92, -0.02em, uppercase):
  The claim in the first viewport. One per page.
- **Headline** (Anton, `clamp(2.1rem, 5.4vw, 4.4rem)`, 0.92, uppercase): The claim
  atop each work block.
- **Body** (Archivo 400, 1.125rem, 1.625, max 44ch): Standfirsts and running prose.
- **Label** (Azeret 500, 0.6875rem, 0.12em, uppercase, muted ink): The status
  line, control labels, and units.

### Named Rules

**The Measured Value Rule.** Every number a reader is meant to compare is set in
Azeret Mono, tabular, and aligned. `font-variant-numeric: tabular-nums` is set
globally so nothing jitters as a value changes.

**The Display-Is-For-Claims Rule.** Anton appears only on claims, at display or
headline size. It never enters a control, a label, a pill, or a panel.

## Layout

Full-bleed, with `1.25rem` page padding below `sm` and `1.75rem` above. Content is
not centred in a fixed measure: the claim runs to the left edge of the padding and
the reading copy sits opposite it.

Work blocks are a 12-column grid from `lg` up — the claim takes columns 1–7, the
standfirst and its control take 8–12 and drop `3.5rem` lower, so the eye lands on
the claim and falls into the prose. Below `lg` it stacks in that same order. An
opened instrument breaks out to the full measure, because it was built for the
width.

The first viewport is `min-h-[100svh]` — `svh`, not `vh`, so mobile browser
chrome cannot push the lens pills below the fold.

**The Skim-First Rule.** Every claim must be readable, and its proof
comprehensible, without operating anything. Instruments open on request and
unmount when closed. Seven consecutive puzzles is what the previous design got
wrong, and no amount of visual polish fixes it.

## Elevation & Depth

**There are no shadows.** Depth comes from three devices: a hairline rule in
Graticule between regions, a one-step tonal move between Bone and Sunk Bone, and
the Raised surface with a backdrop blur for the two floating elements (the pill
nav and the pills themselves). The fixed header carries a gradient scrim from
Bone to transparent so content passing beneath it fades rather than collides.

**The Flat-Field Rule.** Separation is drawn, not lit. Adding a `box-shadow` to
this system is a defect.

## Shapes

Two shapes only: the rectangle and the pill. Every interactive control is a pill
at `999px`. Nothing else is rounded — blocks, panels, and instruments are square,
separated by hairlines. There is no intermediate radius, and introducing one
(an `8px` card, say) breaks the system's only shape rule.

Pills carry a resting tilt of ±1.8° that straightens on hover, focus, and
selection, so a row of them reads as laid down by hand rather than set on a grid.

## Components

Components are **operable, not decorative** — but unlike the previous system,
they are opt-in. The claim always reads first.

### Pills (the universal control)
- **Shape:** `999px`, `1px` ink border, Raised background, Azeret at `0.75rem`.
- **Resting:** alternating ±1.8° tilt.
- **Hover / focus:** straightens to 0° and lifts `2px`.
- **Chosen:** fills Vermilion with white text, straightened.
- **Mark:** a 16×16 SVG path at `1.6` stroke, `currentColor`. Never a Unicode glyph.

### The floating nav
Raised at 85% with a backdrop blur, `999px`, hairline border, centred. The
primary action sits outside it, top-right, filled Vermilion — present from the
first pixel, never at the foot of a long scroll.

### Work block
Hairline top rule, 12-column split, claim left and reading copy right. Its control
is a pill reading "Open the …", and the opened panel takes the full measure.

### Status line
Azeret, muted ink, uppercase: city, live local time, availability. It is the only
identity signal in the mobile first viewport and must not be hidden there.

## Do's and Don'ts

### Do:
- **Do** keep exactly one accent, and spend it on what is live or chosen.
- **Do** take `--signal` (`#b8330d`) for anything under 24px or under white text.
- **Do** set every comparable number in Azeret Mono, tabular.
- **Do** make every interactive control a pill at `999px`.
- **Do** let each claim read fully before anything needs operating.
- **Do** keep the status line and the primary action in the first viewport at
  every width.
- **Do** draw marks as SVG at one stroke weight.

### Don't:
- **Don't** add a `box-shadow`, or any radius between `0` and `999px`.
- **Don't** put vermilion on an inert element, or the display vermilion on small text.
- **Don't** give the unchosen options colour.
- **Don't** use Anton for anything but a claim.
- **Don't** open an instrument the visitor did not ask for.
- **Don't** number the work blocks — a declared lens re-orders them, so any fixed
  index immediately becomes a lie.
- **Don't** substitute a Unicode character for an icon.
