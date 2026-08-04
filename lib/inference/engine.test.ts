import { describe, expect, it } from 'vitest'

import { decayFactor } from './decay'
import {
  HYSTERESIS_MARGIN,
  RERANK_INTERVAL_MS,
  RESOLVED_THRESHOLD,
  confidenceOf,
  entropy,
  infer,
  initialHypothesis,
  resolve,
  score,
  softmax,
  type EngineInput,
  type Hypothesis,
  type Observation,
} from './engine'
import {
  PERSONAS,
  SECTION_ORDERS,
  uniformDistribution,
  zeroVector,
  type Distribution,
} from './personas'
import {
  ENGAGEMENT_DEPTH,
  RETURN_VISIT_STRENGTH,
  SIGNALS,
  dwellStrength,
} from './signals'

const T0 = 1_700_000_000_000

function input(
  observations: Observation[],
  overrides: Partial<EngineInput> = {},
): EngineInput {
  return {
    observations,
    pinned: null,
    now: T0,
    sessionStartedAt: T0,
    ...overrides,
  }
}

function total(distribution: Distribution): number {
  return PERSONAS.reduce((sum, p) => sum + distribution[p], 0)
}

/* -------------------------------------------------------------------------- */

describe('signal weights', () => {
  it('maps referrers to the right personas, including negative evidence', () => {
    const github = SIGNALS.ref_github.weights
    expect(github.peer).toBeGreaterThan(github.ai_product)
    expect(github.client).toBeLessThan(0)

    const upwork = SIGNALS.ref_upwork.weights
    expect(upwork.client).toBeGreaterThan(1)
    expect(upwork.peer).toBeLessThan(0)

    const linkedin = SIGNALS.ref_linkedin.weights
    expect(linkedin.ai_product).toBeGreaterThan(0)
    expect(linkedin.data).toBeGreaterThan(0)
    expect(linkedin.client).toBeLessThan(0)
  })

  it('treats a search referrer as very nearly no evidence', () => {
    const distribution = infer(
      input([{ signal: 'ref_search', strength: 1, at: T0 }]),
    ).distribution
    for (const persona of PERSONAS) {
      expect(distribution[persona]).toBeCloseTo(0.25, 3)
    }
  })

  it('caps a single signal however many times it fires', () => {
    const definition = SIGNALS.engage_2
    const once = score([{ signal: 'engage_2', strength: 1, at: T0 }], T0)
    const many = score(
      Array.from({ length: 40 }, () => ({
        signal: 'engage_2' as const,
        strength: 1,
        at: T0,
      })),
      T0,
    )
    expect(many.scores.data).toBeGreaterThan(once.scores.data)
    expect(many.scores.data).toBeCloseTo(
      definition.cap * definition.weights.data,
      10,
    )
  })

  it('saturates a signal without changing what it argues', () => {
    // The cap is on strength, not on the resulting log-odds. Clipping each
    // persona separately would let the weak ones keep climbing after the strong
    // one stopped, quietly rotating the signal's meaning as it saturated.
    const many = score(
      Array.from({ length: 40 }, () => ({
        signal: 'engage_4' as const,
        strength: 1,
        at: T0,
      })),
      T0,
    ).scores
    const weights = SIGNALS.engage_4.weights
    expect(many.peer / many.ai_product).toBeCloseTo(
      weights.peer / weights.ai_product,
      10,
    )
    expect(many.client).toBeLessThan(0)
  })
})

describe('dwellStrength', () => {
  it('is sublinear and capped at 1', () => {
    expect(dwellStrength(0)).toBe(0)
    expect(dwellStrength(10)).toBeGreaterThan(dwellStrength(5))
    // The first ten seconds are worth more than the next fifty.
    expect(dwellStrength(10)).toBeGreaterThan(dwellStrength(60) - dwellStrength(10))
    expect(dwellStrength(30)).toBeCloseTo(1, 6)
    expect(dwellStrength(600)).toBe(1)
  })

  it('is suppressed by skimming, so scrolling past never counts as reading', () => {
    expect(dwellStrength(20, 1)).toBe(0)
    expect(dwellStrength(20, 0.5)).toBeCloseTo(dwellStrength(20) * 0.5, 6)
  })
})

describe('decay', () => {
  it('holds evidence at full strength through the grace period', () => {
    expect(decayFactor(0, 'behavioural')).toBe(1)
    expect(decayFactor(120_000, 'behavioural')).toBe(1)
    expect(decayFactor(240_000, 'behavioural')).toBe(1)
  })

  it('halves behavioural evidence every two minutes after that', () => {
    expect(decayFactor(360_000, 'behavioural')).toBeCloseTo(0.5, 6)
    expect(decayFactor(480_000, 'behavioural')).toBeCloseTo(0.25, 6)
  })

  it('decays entry signals far more slowly than behavioural ones', () => {
    expect(decayFactor(600_000, 'slow')).toBeGreaterThan(
      decayFactor(600_000, 'behavioural'),
    )
    expect(decayFactor(600_000, 'none')).toBe(1)
  })

  it('makes fresh evidence outweigh identical stale evidence', () => {
    const fresh = score([{ signal: 'dwell_4', strength: 1, at: T0 }], T0)
    const stale = score(
      [{ signal: 'dwell_4', strength: 1, at: T0 - 300_000 }],
      T0,
    )
    expect(fresh.scores.peer).toBeGreaterThan(stale.scores.peer)
  })
})

describe('softmax and confidence', () => {
  it('produces a distribution that sums to 1', () => {
    expect(total(softmax(zeroVector()))).toBeCloseTo(1, 10)
    expect(
      total(softmax({ ai_product: 8, data: -3, client: 0.5, peer: 2 })),
    ).toBeCloseTo(1, 10)
  })

  it('does not overflow on large scores', () => {
    const distribution = softmax({
      ai_product: 1000,
      data: -1000,
      client: 0,
      peer: 0,
    })
    expect(Number.isFinite(total(distribution))).toBe(true)
    expect(distribution.ai_product).toBeCloseTo(1, 6)
  })

  it('reports zero confidence for a uniform distribution', () => {
    expect(entropy(uniformDistribution())).toBeCloseTo(Math.log(4), 10)
    expect(confidenceOf(uniformDistribution())).toBeCloseTo(0, 10)
  })

  it('approaches full confidence for a spiked distribution', () => {
    const spiked: Distribution = {
      ai_product: 0.999,
      data: 0.0004,
      client: 0.0003,
      peer: 0.0003,
    }
    expect(confidenceOf(spiked)).toBeGreaterThan(0.9)
  })

  it('reports LOW confidence for two personas tied near 45%', () => {
    // The case a naive max(P) gets wrong: it would report 0.45 and imply we
    // nearly know, when in fact we are close to a coin flip between two.
    const tied: Distribution = {
      ai_product: 0.45,
      data: 0.45,
      client: 0.05,
      peer: 0.05,
    }
    const confidence = confidenceOf(tied)
    expect(confidence).toBeLessThan(tied.ai_product)
    // Crucially, a near-tie must never be confident enough to re-rank on.
    expect(confidence).toBeLessThan(RESOLVED_THRESHOLD)
  })
})

describe('resolution states', () => {
  it('stays unresolved with no evidence, and keeps the default order', () => {
    const hypothesis = infer(input([]))
    expect(hypothesis.state).toBe('unresolved')
    expect(hypothesis.leader).toBeNull()
    expect(hypothesis.order).toEqual(SECTION_ORDERS.default)
  })

  it('re-ranks fully once a tagged link resolves it', () => {
    const hypothesis = infer(input([{ signal: 'ctx_data', strength: 1, at: T0 }]))
    expect(hypothesis.state).toBe('resolved')
    expect(hypothesis.leader).toBe('data')
    expect(hypothesis.order).toEqual(SECTION_ORDERS.data)
  })

  it('refuses to guess from a single weak signal', () => {
    // Being on a phone leans client, but nowhere near enough to claim anything.
    const hypothesis = infer(
      input([{ signal: 'device_small_touch', strength: 1, at: T0 }]),
    )
    expect(hypothesis.state).toBe('unresolved')
    expect(hypothesis.leader).toBeNull()
    expect(hypothesis.distribution.client).toBeGreaterThan(
      hypothesis.distribution.peer,
    )
  })

  it('shows a forming hypothesis without re-ranking on it', () => {
    // Enough to have a view, not enough to move the page around.
    const hypothesis = infer(
      input(
        [
          { signal: 'ref_github', strength: 1, at: T0 },
          { signal: 'engage_4', strength: 1, at: T0 + 30_000 },
        ],
        { now: T0 + 35_000 },
      ),
    )
    expect(hypothesis.state).toBe('forming')
    expect(hypothesis.leader).toBe('peer')
    expect(hypothesis.order).toEqual(SECTION_ORDERS.default)
  })

  it('relaxes the confidence floor as the session goes on', () => {
    const observations: Observation[] = [
      { signal: 'ctx_data', strength: 0.55, at: T0 },
    ]
    const early = infer(input(observations))
    const late = infer(
      input(observations, { now: T0 + 400_000, sessionStartedAt: T0 }),
    )
    expect(early.state).toBe('unresolved')
    expect(late.state).toBe('forming')
    // Note the confidence actually FELL — the evidence decayed. The state moved
    // because the floor dropped further than the confidence did.
    expect(late.confidence).toBeLessThan(early.confidence)
  })
})

describe('hysteresis', () => {
  function resolved(leader: 'ai_product' | 'peer'): Hypothesis {
    return {
      state: 'resolved',
      leader,
      confidence: 0.7,
      distribution: uniformDistribution(),
      contributions: [],
      order: SECTION_ORDERS[leader],
      orderChangedAt: T0 - RERANK_INTERVAL_MS * 2,
      at: T0,
    }
  }

  const near: Distribution = {
    ai_product: 0.4,
    data: 0.05,
    client: 0.05,
    peer: 0.45,
  }
  const clear: Distribution = {
    ai_product: 0.3,
    data: 0.02,
    client: 0.03,
    peer: 0.65,
  }

  it('holds the leader when the challenger is inside the margin', () => {
    expect(near.peer - near.ai_product).toBeLessThan(HYSTERESIS_MARGIN)
    const next = resolve(resolved('ai_product'), near, [], {
      now: T0,
      sessionStartedAt: T0,
      pinned: null,
    })
    expect(next.leader).toBe('ai_product')
  })

  it('flips once the challenger clears the margin', () => {
    expect(clear.peer - clear.ai_product).toBeGreaterThan(HYSTERESIS_MARGIN)
    const next = resolve(resolved('ai_product'), clear, [], {
      now: T0,
      sessionStartedAt: T0,
      pinned: null,
    })
    expect(next.leader).toBe('peer')
  })
})

describe('rate limiting', () => {
  it('allows at most one re-rank per interval', () => {
    const first = infer(input([{ signal: 'ctx_data', strength: 1, at: T0 }]))
    expect(first.order).toEqual(SECTION_ORDERS.data)

    // A strong contrary signal arrives two seconds later.
    const tooSoon = infer(
      input([{ signal: 'ctx_eng', strength: 1, at: T0 + 2_000 }], {
        now: T0 + 2_000,
      }),
      first,
    )
    expect(tooSoon.leader).toBe('peer')
    expect(tooSoon.order).toEqual(SECTION_ORDERS.data)
    expect(tooSoon.orderChangedAt).toBe(first.orderChangedAt)

    // Once the window passes, the order catches up.
    const later = infer(
      input([{ signal: 'ctx_eng', strength: 1, at: T0 + 2_000 }], {
        now: T0 + RERANK_INTERVAL_MS + 1,
      }),
      tooSoon,
    )
    expect(later.order).toEqual(SECTION_ORDERS.peer)
  })
})

describe('override', () => {
  const contrary: Observation[] = [
    { signal: 'ctx_eng', strength: 1, at: T0 },
    { signal: 'engage_4', strength: 1, at: T0 },
  ]

  it('beats contrary evidence and re-ranks immediately', () => {
    const inferred = infer(input(contrary))
    expect(inferred.leader).toBe('peer')

    const pinnedResult = infer(
      input(contrary, { pinned: 'client', now: T0 + 1_000 }),
      inferred,
    )
    expect(pinnedResult.state).toBe('pinned')
    expect(pinnedResult.leader).toBe('client')
    // Not rate limited — the visitor just asked for this.
    expect(pinnedResult.order).toEqual(SECTION_ORDERS.client)
    expect(pinnedResult.orderChangedAt).toBe(T0 + 1_000)
  })

  it('keeps collecting signals while pinned, and yields to them once cleared', () => {
    const pinnedResult = infer(input(contrary, { pinned: 'client' }))
    expect(pinnedResult.contributions.length).toBeGreaterThan(0)

    const cleared = infer(
      input(contrary, { now: T0 + RERANK_INTERVAL_MS + 1 }),
      pinnedResult,
    )
    expect(cleared.state).toBe('resolved')
    expect(cleared.leader).toBe('peer')
    expect(cleared.order).toEqual(SECTION_ORDERS.peer)
  })
})

describe('behavioural evidence', () => {
  it('weighs operating a module far above merely dwelling on it', () => {
    const dwelt = infer(
      input([{ signal: 'dwell_2', strength: dwellStrength(25), at: T0 }]),
    )
    const used = infer(input([{ signal: 'engage_2', strength: 1, at: T0 }]))
    expect(used.distribution.data).toBeGreaterThan(dwelt.distribution.data)
    expect(used.confidence).toBeGreaterThan(dwelt.confidence)
  })

  it('lets sustained behaviour overturn a seeded prior', () => {
    // Arrived on a recruiter link, then spent the session in the SQL console.
    const observations: Observation[] = [
      { signal: 'ctx_ai', strength: 1, at: T0 },
      ...Array.from({ length: 6 }, (_, i) => ({
        signal: 'engage_2' as const,
        strength: 1,
        at: T0 + i * 20_000,
      })),
      { signal: 'dwell_2', strength: 1, at: T0 + 120_000 },
      { signal: 'dwell_5', strength: 1, at: T0 + 150_000 },
    ]
    const hypothesis = infer(
      input(observations, { now: T0 + 180_000, sessionStartedAt: T0 }),
    )
    expect(hypothesis.leader).toBe('data')
  })

  it('seeds a returning visitor without over-committing', () => {
    const hypothesis = infer(
      input([
        { signal: 'return_client', strength: RETURN_VISIT_STRENGTH, at: T0 },
      ]),
    )
    // A memory of last time tilts the reading but claims nothing on its own.
    // Remembering someone is not the same as recognising them.
    expect(hypothesis.state).toBe('unresolved')
    expect(hypothesis.leader).toBeNull()
    const { distribution } = hypothesis
    expect(distribution.client).toBeGreaterThan(distribution.ai_product)
    expect(distribution.client).toBeGreaterThan(distribution.peer)
  })
})

/**
 * Calibration tests.
 *
 * The unit tests above prove the maths is right. These prove the *weights* are
 * right, which is a different and more fragile thing: a plausible-looking
 * retune could leave every formula correct while making the page so cautious it
 * never re-ranks at all, or so eager it re-ranks on nothing. Both are failures
 * and neither shows up anywhere else.
 */
describe('archetypal sessions', () => {
  const session = (observations: Observation[], elapsed: number) =>
    infer(input(observations, { now: T0 + elapsed, sessionStartedAt: T0 }))

  it('resolves an engineer who arrives from GitHub and reads the internals', () => {
    const hypothesis = session(
      [
        { signal: 'ref_github', strength: 1, at: T0 },
        { signal: 'device_wide_pointer', strength: 1, at: T0 },
        { signal: 'dwell_4', strength: dwellStrength(35), at: T0 + 40_000 },
        { signal: 'engage_4', strength: ENGAGEMENT_DEPTH.interacted, at: T0 + 50_000 },
        { signal: 'dwell_3', strength: dwellStrength(25), at: T0 + 80_000 },
        { signal: 'outbound_github', strength: 1, at: T0 + 95_000 },
      ],
      100_000,
    )
    expect(hypothesis.state).toBe('resolved')
    expect(hypothesis.leader).toBe('peer')
    expect(hypothesis.order).toEqual(SECTION_ORDERS.peer)
  })

  it('resolves a recruiter who arrives from LinkedIn and opens the CV', () => {
    const hypothesis = session(
      [
        { signal: 'ref_linkedin', strength: 1, at: T0 },
        { signal: 'device_wide_pointer', strength: 1, at: T0 },
        { signal: 'dwell_1', strength: dwellStrength(40), at: T0 + 45_000 },
        { signal: 'engage_1', strength: ENGAGEMENT_DEPTH.completed, at: T0 + 60_000 },
        { signal: 'dwell_7', strength: dwellStrength(30), at: T0 + 95_000 },
        { signal: 'outbound_cv', strength: 1, at: T0 + 110_000 },
      ],
      115_000,
    )
    expect(hypothesis.state).toBe('resolved')
    expect(hypothesis.leader).toBe('ai_product')
  })

  it('resolves an analyst from behaviour alone, with no entry signal', () => {
    const hypothesis = session(
      [
        { signal: 'dwell_2', strength: dwellStrength(45), at: T0 + 50_000 },
        { signal: 'engage_2', strength: ENGAGEMENT_DEPTH.completed, at: T0 + 70_000 },
        { signal: 'dwell_5', strength: dwellStrength(35), at: T0 + 110_000 },
        { signal: 'engage_5', strength: ENGAGEMENT_DEPTH.interacted, at: T0 + 125_000 },
      ],
      130_000,
    )
    expect(hypothesis.state).toBe('resolved')
    expect(hypothesis.leader).toBe('data')
    expect(hypothesis.order).toEqual(SECTION_ORDERS.data)
  })

  it('resolves a client who reads the offer cards and starts an email', () => {
    const hypothesis = session(
      [
        { signal: 'device_small_touch', strength: 1, at: T0 },
        { signal: 'dwell_6', strength: dwellStrength(30), at: T0 + 35_000 },
        { signal: 'engage_6', strength: ENGAGEMENT_DEPTH.interacted, at: T0 + 45_000 },
        { signal: 'outbound_email', strength: 1, at: T0 + 60_000 },
      ],
      65_000,
    )
    expect(hypothesis.state).toBe('resolved')
    expect(hypothesis.leader).toBe('client')
    expect(hypothesis.order).toEqual(SECTION_ORDERS.client)
  })

  it('stays unresolved for someone who reads a little of everything', () => {
    // Genuinely ambiguous. The honest answer is "I don't know", and the page
    // must be willing to say so rather than pick the largest of four noises.
    const hypothesis = session(
      ([1, 2, 3, 4, 5, 6, 7] as const).map((s, i) => ({
        signal: `dwell_${s}` as Observation['signal'],
        strength: dwellStrength(12),
        at: T0 + i * 15_000,
      })),
      120_000,
    )
    expect(hypothesis.state).toBe('unresolved')
    expect(hypothesis.order).toEqual(SECTION_ORDERS.default)
  })

  it('ignores a skimmer who scrolls straight through', () => {
    const hypothesis = session(
      ([1, 2, 3, 4, 5, 6, 7] as const).map((s, i) => ({
        signal: `dwell_${s}` as Observation['signal'],
        strength: dwellStrength(4, 0.85),
        at: T0 + i * 3_000,
      })),
      30_000,
    )
    expect(hypothesis.state).toBe('unresolved')
    expect(hypothesis.confidence).toBeLessThan(0.05)
  })
})

describe('correctness guarantees', () => {
  it('itemises contributions that account for the distribution shown', () => {
    const observations: Observation[] = [
      { signal: 'ref_github', strength: 1, at: T0 },
      { signal: 'dwell_4', strength: 0.8, at: T0 },
    ]
    const { scores, contributions } = score(observations, T0)
    expect(contributions.map((c) => c.signal)).toEqual([
      'ref_github',
      'dwell_4',
    ])

    // Summing the itemised list reproduces the scores exactly, so the readout
    // can never list signals that don't add up to the confidence it displays.
    const summed = zeroVector()
    for (const contribution of contributions) {
      for (const persona of PERSONAS) {
        summed[persona] += contribution.perPersona[persona]
      }
    }
    for (const persona of PERSONAS) {
      expect(summed[persona]).toBeCloseTo(scores[persona], 10)
    }
  })

  it('is deterministic for a given observation sequence', () => {
    const observations: Observation[] = [
      { signal: 'ref_linkedin', strength: 1, at: T0 },
      { signal: 'dwell_1', strength: 0.6, at: T0 + 5_000 },
      { signal: 'engage_1', strength: 0.7, at: T0 + 9_000 },
      { signal: 'copy_text', strength: 1, at: T0 + 12_000 },
    ]
    const run = () => infer(input(observations, { now: T0 + 20_000 }))
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })

  it('is order-independent for the same set of observations', () => {
    const observations: Observation[] = [
      { signal: 'ref_linkedin', strength: 1, at: T0 },
      { signal: 'dwell_5', strength: 0.6, at: T0 + 5_000 },
      { signal: 'engage_5', strength: 0.7, at: T0 + 9_000 },
    ]
    const forwards = infer(input(observations, { now: T0 + 20_000 }))
    const backwards = infer(
      input([...observations].reverse(), { now: T0 + 20_000 }),
    )
    // Float addition is not associative, so this is equal to within rounding
    // rather than bit-identical.
    for (const persona of PERSONAS) {
      expect(backwards.distribution[persona]).toBeCloseTo(
        forwards.distribution[persona],
        12,
      )
    }
    expect(backwards.leader).toBe(forwards.leader)
    expect(backwards.state).toBe(forwards.state)
  })

  it('starts from a clean default hypothesis', () => {
    const hypothesis = initialHypothesis(T0)
    expect(hypothesis.state).toBe('unresolved')
    expect(hypothesis.confidence).toBe(0)
    expect(hypothesis.order).toEqual(SECTION_ORDERS.default)
    expect(total(hypothesis.distribution)).toBeCloseTo(1, 10)
  })

  it('gives every persona a complete ordering of all seven sections', () => {
    for (const key of [...PERSONAS, 'default'] as const) {
      const order = SECTION_ORDERS[key]
      expect([...order].sort()).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })
})
