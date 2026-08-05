/**
 * A queue worker, simulated honestly.
 *
 * This is a model of Mo'een's worker, not the worker itself — it runs in your
 * browser with no database behind it. What it reproduces faithfully is the
 * *logic*: leases with expiries, heartbeats that extend them, bounded retries
 * with backoff, and a dead-letter table that keeps what it could not process.
 *
 * Pure and step-driven: state in, next state out. No timers in here, so the
 * same injection always produces the same trace and the whole thing is
 * unit-testable.
 *
 * Note that `worked` and `lease` are separate counters and have to be. The
 * lease is "how long until someone else may take this"; worked is "how much of
 * the job is done". A heartbeat resets the first and must not touch the second
 * — deriving one from the other means a heartbeat silently undoes progress, and
 * the job runs forever.
 */

export type JobState = 'queued' | 'leased' | 'done' | 'retrying' | 'dead'

export type Failure = 'none' | 'worker_dies' | 'worker_hangs' | 'provider_down'

export type LogEntry = {
  tick: number
  /** Which box in the diagram this concerns. */
  where: string
  text: string
  tone: 'normal' | 'warn' | 'bad' | 'good'
}

export type SimState = {
  tick: number
  job: JobState
  /** Ticks remaining before the lease lapses, or null when not leased. */
  lease: number | null
  /** Ticks of actual work completed on the current attempt. */
  worked: number
  /** False once the worker has died or wedged: no progress, no heartbeats. */
  workerAlive: boolean
  attempts: number
  backoff: number
  failure: Failure
  log: LogEntry[]
}

export const LEASE_TICKS = 5
export const HEARTBEAT_EVERY = 2
export const MAX_ATTEMPTS = 3
/** Ticks of work a job needs when nothing goes wrong. */
export const WORK_TICKS = 6
/** Ticks into an attempt at which an injected failure fires. */
export const FAILS_AT = 2

export function initialState(failure: Failure = 'none'): SimState {
  return {
    tick: 0,
    job: 'queued',
    lease: null,
    worked: 0,
    workerAlive: true,
    attempts: 0,
    backoff: 0,
    failure,
    log: [
      {
        tick: 0,
        where: 'jobs',
        text: 'Message arrives. Row written to the jobs table.',
        tone: 'normal',
      },
    ],
  }
}

function say(state: SimState, entry: Omit<LogEntry, 'tick'>): void {
  state.log = [...state.log, { ...entry, tick: state.tick }]
}

function retryOrDie(state: SimState, reason: string, tone: LogEntry['tone']): void {
  state.lease = null
  state.worked = 0
  state.workerAlive = true

  if (state.attempts >= MAX_ATTEMPTS) {
    state.job = 'dead'
    say(state, {
      where: 'dead letter',
      text: `${reason} Retries are exhausted, so it goes to the dead-letter table with its error and payload — kept, not dropped.`,
      tone: 'bad',
    })
    return
  }

  state.job = 'retrying'
  state.backoff = 2 ** state.attempts
  say(state, {
    where: 'jobs',
    text: `${reason} Retrying, backing off for ${state.backoff} ticks.`,
    tone,
  })
}

export function step(previous: SimState): SimState {
  const state: SimState = { ...previous, tick: previous.tick + 1 }

  if (state.job === 'done' || state.job === 'dead') return state

  if (state.job === 'retrying') {
    state.backoff -= 1
    if (state.backoff <= 0) {
      state.job = 'queued'
      say(state, {
        where: 'jobs',
        text: 'Backoff elapsed. The job is visible to workers again.',
        tone: 'normal',
      })
    }
    return state
  }

  if (state.job === 'queued') {
    state.job = 'leased'
    state.lease = LEASE_TICKS
    state.worked = 0
    state.workerAlive = true
    state.attempts += 1
    say(state, {
      where: 'worker',
      text: `A worker claims the job and takes a lease for ${LEASE_TICKS} ticks. Attempt ${state.attempts} of ${MAX_ATTEMPTS}.`,
      tone: 'normal',
    })
    return state
  }

  /* Leased. The lease always ticks down; only a live worker makes progress. */
  state.lease = (state.lease ?? 0) - 1

  if (state.workerAlive && state.failure !== 'none' && state.worked === FAILS_AT) {
    if (state.failure === 'provider_down') {
      state.failure = 'none'
      say(state, {
        where: 'worker',
        text: 'The model provider returns an error. The adapter is provider-neutral, so this is an ordinary failed call rather than an outage reaching the merchant.',
        tone: 'warn',
      })
      retryOrDie(state, 'The attempt failed.', 'warn')
      return state
    }

    // The worker stops working and stops heartbeating. Nothing releases the
    // lease, because there is nobody left to release it — which is precisely
    // why a lease expires rather than being handed back.
    state.workerAlive = false
    say(state, {
      where: 'worker',
      text:
        state.failure === 'worker_dies'
          ? 'The worker process dies mid-job. It never gets to report anything, and it never releases the lease.'
          : 'The worker wedges. The process is still alive so nothing crashes — but the heartbeats stop.',
      tone: 'bad',
    })
    state.failure = 'none'
    return state
  }

  if (state.lease <= 0) {
    retryOrDie(
      state,
      'The lease expired with no heartbeat, so the job was reclaimed. Nothing was lost and nothing is stuck.',
      'good',
    )
    return state
  }

  if (!state.workerAlive) return state

  state.worked += 1

  if (state.worked >= WORK_TICKS) {
    state.job = 'done'
    state.lease = null
    say(state, {
      where: 'order draft',
      text: 'Parsed, validated, and written as a draft. The merchant sees it.',
      tone: 'good',
    })
    return state
  }

  if (state.worked % HEARTBEAT_EVERY === 0) {
    state.lease = LEASE_TICKS
    say(state, {
      where: 'worker',
      text: 'Heartbeat. The lease is extended — the worker is proving it is still alive.',
      tone: 'good',
    })
  }

  return state
}

/** Runs to completion. Bounded so a logic bug cannot hang the page. */
export function runToEnd(failure: Failure, maxTicks = 60): SimState {
  let state = initialState(failure)
  while (state.job !== 'done' && state.job !== 'dead' && state.tick < maxTicks) {
    state = step(state)
  }
  return state
}
