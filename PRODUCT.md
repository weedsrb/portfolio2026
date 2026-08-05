# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four confirmed visitor groups. The visitor **declares** which one they are, via
the lens pills in the first viewport (`lib/lens.ts`); the page then commits to
that declaration and orders its evidence accordingly. Nothing is inferred about
a visitor who did not ask for it.

Each lens maps onto a full section ordering in `lib/inference/personas.ts`, so
the declared path and the inference engine cannot drift apart:

- **AI product** — "You're evaluating how I build with models."
- **Data & analytics** — "You're looking for someone who can work the data."
- **Prospective client** — "You're weighing up whether to hire me for a job."
- **Engineer** — "You're here for the engineering."

They arrive cold from a link, a referrer, or a tagged URL (`?ctx=ai|data|client|eng`),
usually with low intent and little time, and are deciding whether Waleed
Barghouthi is worth a conversation. Nothing is ever hidden from any persona;
re-ranking changes sequence only.

## Product Purpose

A personal portfolio for Waleed Barghouthi that asks a visitor why they came and
commits to the answer, re-ordering its evidence to put that claim's proof first.

The scoring engine that once ran ambiently — inferring a persona from passive
signals and narrating its confidence in a fixed readout — is retired from that
role as of the 2026 redesign. It survives as an exhibit the visitor opens
deliberately. Three things were wrong with it as chrome: it felt presumptuous,
it buried the person behind an abstraction, and it made every claim conditional
on operating an instrument first.

Success is weighted **equally** across two outcomes: a full-time role and
freelance/contract engagements. Neither audience is privileged in future work —
the persona re-ranking genuinely serves both, and the "What I'd build for you"
scoped-work module and the engineering-depth modules are of equal standing.

## Positioning

The site runs the same rule as the product it describes: **the model proposes,
the application decides, the human confirms.** The demonstration is the argument
— and after the redesign the human confirms *first*, by declaring a lens, rather
than being profiled and offered an override afterwards.

The differentiator a neighboring portfolio could not truthfully copy: the
inference is a **deterministic log-odds scoring model**, not an LLM. No language
model, no API call, no network request.

```
score[persona] = Σ weight(signal, persona) × strength(signal) × decay(age)
P              = softmax(score)
confidence     = 1 − entropy(P) / log(4)
```

Confidence is the *sharpness* of the distribution, not the leader's raw
probability — two personas tied near 45% correctly reports low confidence, where
`max(P)` would imply near-certainty. Every output is explainable: the readout
lists which signals moved the number and by how much, read from the same
computation that produced it.

## Operating Context

Single-page site plus a `/context` route. Visitors skim, and the ones who matter
most often read the source — the repository is public, and publishing the source
of a site that profiles you is stated as the whole point.

Seven evidence modules, each pairing a claim with something operable rather than
a paragraph asserting it:

| | Claim | What the visitor can operate |
|---|---|---|
| 1 | The model proposes, my code decides | Edit the parsed order, watch `validateOrder()` refuse it |
| 2 | I write SQL against real data | Run SQL against 1,002 rows on a hand-written engine |
| 3 | Retrieval, not the buzzword | Move k and the cutoff, watch boilerplate cross the line |
| 4 | Production systems, not demos | Kill a worker mid-lease, trace the recovery |
| 5 | Data into decisions | Change the definition of "retained", watch the number move |
| 6 | What I'd build for you | Scoped work, with timelines that are what it took |
| 7 | Track record | Work, study and cities on one axis — the overlap is the information |

## Capabilities and Constraints

**Two rules the code is held to, both enforced in review:**

1. **The signal rule.** The accent colour may only be applied to a value that is
   currently changing or can change. Accent on an inert element is a bug, not a
   style choice.
2. **Nothing above the fold moves.** A re-rank only permutes sections entirely
   below the viewport top. Also unit-tested (`lib/motion/flip.ts`).

**Privacy, as a hard product constraint:**

- Zero network requests, zero cookies, zero third-party analytics.
- `localStorage` holds exactly one key: a coarse persona label and a timestamp.
- No IP handling, no fingerprinting, no user-agent parsing beyond a media query
  for pointer type.
- A disclosure panel lists every signal and its real weights, generated from the
  source rather than retyped, plus a button that wipes the stored value.

**Content constraint:** every string and number on the site lives in
`data/content.ts`. Nothing is hardcoded in JSX, so the honesty check is
mechanical — if a number appears on the page it appears there, traceable to
something real. Unknown values stay `null` and components render nothing rather
than showing a guess or a broken link.

`lib/inference/engine.ts` is pure: signals in, distribution out, no DOM and no
side effects. `?debug=1` renders the live score matrix, every signal's
contribution, and the current order. The `?ctx=` parameter is stripped from the
URL once read, so a forwarded link never carries someone else's context.

## Brand Commitments

- **Name:** Waleed Barghouthi. **Role:** Product & AI engineering.
- **Line:** "I build systems that let a model propose and a machine decide."
- **Site:** waleedbarghouthi.com — public source at github.com/weedsrb/portfolio2026.
- **Voice:** plain, exact, and unpadded. Claims are stated at the size the
  evidence supports and no larger. The site says what it is not ("It is not an
  AI") as readily as what it is.

## Evidence on Hand

- Seven operable modules, all built and shipping (see Operating Context).
- A CV at `/waleed-barghouthi-cv.pdf`.
- LinkedIn: https://www.linkedin.com/in/waleedsrb
- **Sentinel** — the contract/schedule risk retrieval project — is built.
- Datasets behind the SQL console and cohort chart are **synthetic** — shaped
  like the real schemas, generated from a fixed seed, and labelled as synthetic
  on the page. Future work must preserve that labelling and must not present
  them as production data.

**Must not be fabricated.** "Sentinel is built" is the whole of what is
confirmed about it. Built is **not** a claim that it is publicly demoable, and
no demo, customer, outcome, or metric may be asserted on the strength of that
line. Sentinel is currently described nowhere on the page; putting it there
needs real detail from Waleed first.

There are no testimonials, named customers, benchmarks, or pricing claims, and
none may be invented.

## Product Principles

1. **Ship the mechanism, not the assertion.** Every claim arrives with something
   the visitor can operate.
2. **The model proposes, the application decides, the human confirms.** Inference
   is never authority; the override is always one tap away.
3. **Explainability is not a feature panel.** Any number shown must be readable
   back to the computation that produced it.
4. **Absence over invention.** A null renders nothing. A missing fact is stated,
   never guessed.
5. **Never move what someone is reading.** Adaptation happens below the fold or
   not at all.

## Accessibility & Inclusion

**WCAG 2.2 AA is a binding requirement.** Contrast, focus order, and motion
preferences are non-negotiable in future design work. Particular care applies to
the FLIP re-rank animation, which is central to the page and must respect
`prefers-reduced-motion`.
