import { describe, expect, it } from 'vitest'

import {
  MAX_ATTEMPTS,
  initialState,
  runToEnd,
  step,
  type Failure,
  type SimState,
} from './simulate'

/**
 * The simulation is a claim about how the real worker behaves, so it is tested
 * like the real worker. If a failure mode here resolves in a way the production
 * system would not, the section is teaching something false.
 */

function trace(failure: Failure): SimState {
  return runToEnd(failure)
}

describe('queue worker simulation', () => {
  it('completes the happy path', () => {
    const end = trace('none')
    expect(end.job).toBe('done')
    expect(end.attempts).toBe(1)
    expect(end.log.some((l) => l.where === 'order draft')).toBe(true)
  })

  it('extends the lease on every heartbeat', () => {
    const heartbeats = trace('none').log.filter((l) =>
      l.text.startsWith('Heartbeat'),
    )
    expect(heartbeats.length).toBeGreaterThan(0)
  })

  it('recovers a job whose worker died, without losing it', () => {
    const end = trace('worker_dies')
    // The whole point: a dead worker must not cost the job.
    expect(end.job).toBe('done')
    expect(end.attempts).toBeGreaterThan(1)
    expect(end.log.some((l) => l.text.includes('reclaimed'))).toBe(true)
  })

  it('recovers a wedged worker the same way as a dead one', () => {
    // Harder in production, identical in outcome — which is exactly why the
    // lease is an expiry rather than a release.
    const end = trace('worker_hangs')
    expect(end.job).toBe('done')
    expect(end.log.some((l) => l.text.includes('lease expired'))).toBe(true)
  })

  it('never leaves a job stuck in leased forever', () => {
    for (const failure of ['none', 'worker_dies', 'worker_hangs', 'provider_down'] as const) {
      const end = trace(failure)
      expect(['done', 'dead']).toContain(end.job)
    }
  })

  it('retries a provider outage with backoff rather than surfacing it', () => {
    const end = trace('provider_down')
    expect(end.job).toBe('done')
    expect(end.log.some((l) => l.text.includes('backing off'))).toBe(true)
  })

  it('backs off for longer on each successive attempt', () => {
    let state = initialState('provider_down')
    const backoffs: number[] = []
    for (let i = 0; i < 60 && state.job !== 'done' && state.job !== 'dead'; i++) {
      const before = state.backoff
      state = step(state)
      if (state.backoff > before) backoffs.push(state.backoff)
    }
    for (let i = 1; i < backoffs.length; i++) {
      expect(backoffs[i]!).toBeGreaterThan(backoffs[i - 1]!)
    }
  })

  it('dead-letters rather than dropping once retries are spent', () => {
    // Force every attempt to fail by re-injecting the failure each time.
    let state = initialState('provider_down')
    for (let i = 0; i < 80 && state.job !== 'dead' && state.job !== 'done'; i++) {
      state = step(state)
      if (state.job === 'retrying' && state.failure === 'none') {
        state = { ...state, failure: 'provider_down' }
      }
    }
    expect(state.job).toBe('dead')
    expect(state.attempts).toBe(MAX_ATTEMPTS)
    expect(state.log.at(-1)?.where).toBe('dead letter')
  })

  it('is deterministic', () => {
    expect(JSON.stringify(trace('worker_dies'))).toBe(
      JSON.stringify(trace('worker_dies')),
    )
  })

  it('terminates for every failure mode', () => {
    for (const failure of ['none', 'worker_dies', 'worker_hangs', 'provider_down'] as const) {
      expect(trace(failure).tick).toBeLessThan(60)
    }
  })
})
