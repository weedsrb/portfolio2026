# waleedbarghouthi.com

A portfolio that works out who its visitor probably is, shows its reasoning, and
lets them overrule it.

The page reads passive signals — where you arrived from, what you linger on,
what you actually operate — scores them, and re-orders its evidence sections to
match. A fixed readout in the corner shows the current hypothesis, the
confidence, the signals behind it, and a one-tap override.

That is the same rule the product it describes runs on: the model proposes, the
application decides, the human confirms.

## It is not an AI

There is no language model here, no API call, and no network request. The
inference is a **deterministic log-odds scoring model**:

```
score[persona] = Σ weight(signal, persona) × strength(signal) × decay(age)
P              = softmax(score)
confidence     = 1 − entropy(P) / log(4)
```

Confidence is the *sharpness* of the distribution, not the leader's raw
probability. Two personas tied near 45% therefore reports low confidence — which
is true, whereas `max(P)` would report 0.45 and imply near-certainty about the
leader.

Every output is explainable. The readout lists which signals moved the number
and by how much, read from the same computation that produced the number.

## Privacy

- Zero network requests, zero cookies, zero third-party analytics.
- `localStorage` holds one key: a coarse persona label and a timestamp.
- No IP handling, no fingerprinting, no user-agent parsing beyond a media query
  for pointer type.
- The site's own "How this works" panel lists every signal and its real weights,
  generated from the source rather than retyped, plus a button that wipes the
  stored value.

## Layout

```
app/                     route, layout, design tokens
lib/inference/           the engine — pure, no DOM, no side effects
  personas.ts            four personas, one full section ordering each
  signals.ts             the signal registry: weights, caps, strengths
  engine.ts              scoring, softmax, entropy, hysteresis, rate limiting
  decay.ts               grace period, then half-life
  entry.ts               referrer / ?ctx= / device, read once per page load
lib/motion/flip.ts       FLIP re-rank and the below-fold constraint
hooks/useInference.tsx   signal collection and the engine loop
components/sections/     one per evidence module
components/readout/      the readout, its signal list, the disclosure panel
data/                    all copy and numbers, typed
```

`lib/inference/engine.ts` is pure: signals in, distribution out. It is the part
worth reading.

## Two rules the code is held to

**The signal rule.** The accent colour may only be applied to a value that is
currently changing or can change. Accent on an inert element is a bug, not a
style choice.

**Nothing above the fold moves.** A re-rank only permutes sections entirely
below the viewport top. A page that pulls text out from under someone's eyes is
infuriating, and no amount of spring tuning fixes that.

Both are enforced in review; the second is also unit-tested.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # engine + below-fold constraint
pnpm typecheck
pnpm build
```

`?debug=1` renders the live score matrix, every signal's contribution, and the
current order.

Tagged links seed a prior so the page is already correct on arrival:
`?ctx=ai`, `?ctx=data`, `?ctx=client`, `?ctx=eng`. The parameter is stripped
from the URL once read, so a forwarded link never carries someone else's
context.

## The evidence modules

Each claim ships with something you can operate, not a paragraph asserting it.

| | Claim | What you can do |
|---|---|---|
| 1 | The model proposes, my code decides | Edit the parsed order and watch `validateOrder()` refuse it |
| 2 | I write SQL against real data | Write and run SQL against 1,002 rows, on a hand-written engine |
| 3 | Retrieval, not the buzzword | Move k and the cutoff, watch boilerplate cross the line |
| 4 | Production systems, not demos | Kill a worker mid-lease and trace the recovery |
| 5 | Data into decisions | Change the definition of "retained" and watch the number move |
| 6 | What I'd build for you | Scoped work, with timelines that are what it took |
| 7 | Track record | Work, study and cities on one axis — the overlap is the information |

The datasets behind the SQL console and the cohort chart are synthetic, shaped
like the real schemas, generated from a fixed seed, and labelled as synthetic
on the page.

## Status

Everything above is built, and the links that were `null` pending real values
are supplied. The only `null`s left in `data/content.ts` are the open-ended
`end` dates on current roles, which mean exactly that.
