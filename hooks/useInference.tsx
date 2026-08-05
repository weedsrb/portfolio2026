'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { readEntrySignalsOnce, stripTagFromUrl } from '@/lib/inference/entry'
import {
  infer,
  initialHypothesis,
  type Hypothesis,
  type Observation,
} from '@/lib/inference/engine'
import type { Persona, SectionId } from '@/lib/inference/personas'
import {
  ENGAGEMENT_DEPTH,
  dwellStrength,
  type EngagementDepth,
  type SignalId,
} from '@/lib/inference/signals'
import { writeVisit } from '@/lib/inference/storage'

/**
 * Collects signals, runs the engine, and hands out the current hypothesis.
 *
 * Everything here stays in this browser. There is no fetch in this file and
 * there is not going to be one — the moment this needs a network request, the
 * claim the whole page rests on stops being true.
 */

type InferenceValue = {
  hypothesis: Hypothesis
  pinned: Persona | null
  /** Confidence over time, for the readout's sparkline. */
  history: number[]
  pin: (persona: Persona) => void
  clearPin: () => void
  /** Called by an evidence module when someone actually operates it. */
  recordEngagement: (section: SectionId, depth: EngagementDepth) => void
  /** Called by outbound links and the copy handler. */
  recordEvent: (signal: SignalId) => void
}

const InferenceContext = createContext<InferenceValue | null>(null)

/** How often the engine re-runs. Time decay means it changes without input. */
const TICK_MS = 1_000

/** Above this scroll speed, dwell stops counting as reading. */
const SKIM_PX_PER_S = 900

export function InferenceProvider({ children }: { children: ReactNode }) {
  const [hypothesis, setHypothesis] = useState<Hypothesis>(() =>
    initialHypothesis(0),
  )
  const [pinned, setPinned] = useState<Persona | null>(null)
  const [history, setHistory] = useState<number[]>([])

  const sessionStart = useRef(0)
  const entry = useRef<Observation[]>([])
  const engagements = useRef<Observation[]>([])
  const events = useRef<Observation[]>([])

  /** Focused seconds accumulated per section. */
  const dwell = useRef(new Map<SectionId, number>())
  /** Which sections are currently being read, by the rule in the observer. */
  const visible = useRef(new Set<SectionId>())

  const skimFactor = useRef(0)
  /**
   * Mirrors `pinned` so the interval tick can read it without being torn down
   * and rebuilt on every pin. Kept in sync by `pin` and `clearPin`, which set
   * it before they run the engine — never assigned during render.
   */
  const pinnedRef = useRef<Persona | null>(null)

  /** Rebuild the full observation list. Dwell is derived, never appended. */
  const collect = useCallback((now: number): Observation[] => {
    const derived: Observation[] = []
    for (const [section, seconds] of dwell.current) {
      const strength = dwellStrength(seconds, skimFactor.current)
      if (strength > 0) {
        derived.push({
          signal: `dwell_${section}` as SignalId,
          strength,
          at: now,
        })
      }
    }
    return [
      ...entry.current,
      ...derived,
      ...engagements.current,
      ...events.current,
    ]
  }, [])

  const run = useCallback(
    (now: number) => {
      setHypothesis((previous) =>
        infer(
          {
            observations: collect(now),
            pinned: pinnedRef.current,
            now,
            sessionStartedAt: sessionStart.current,
          },
          previous,
        ),
      )
    },
    [collect],
  )

  /* ---- entry signals, once ---- */
  useEffect(() => {
    const now = Date.now()
    sessionStart.current = now
    // Memoised for the page load: reading is destructive, because we strip the
    // tag from the URL straight afterwards.
    const read = readEntrySignalsOnce(now)
    entry.current = read.observations
    // Strip ?ctx= so a forwarded link does not carry someone else's context.
    if (read.hadTag) stripTagFromUrl()
    run(now)
  }, [run])

  /* ---- dwell accumulation and scroll velocity, on one clock ---- */
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let lastY = window.scrollY
    /** ~0.5s of velocity samples at 60fps. */
    const speeds: number[] = []

    const step = (t: number) => {
      const elapsed = (t - last) / 1000
      last = t

      // Sample scroll speed on the frame clock, not on scroll events. Sampling
      // per event means that once scrolling stops no new samples arrive, so a
      // single flick pins the median high and suppresses dwell for the rest of
      // the session — a reader who scrolls fast and then settles would never
      // register as reading anything. Sampling in time lets idle frames push
      // zeros in, so the suppression lifts as soon as they stop moving.
      const y = window.scrollY
      if (elapsed > 0) {
        speeds.push(Math.abs(y - lastY) / elapsed)
        if (speeds.length > 30) speeds.shift()
      }
      lastY = y

      const sorted = [...speeds].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0
      skimFactor.current = Math.min(1, median / SKIM_PX_PER_S)

      // Only count time while the tab is actually being looked at. The `elapsed
      // < 1` guard drops the single huge frame after a background tab wakes up.
      if (document.visibilityState === 'visible' && elapsed < 1) {
        for (const section of visible.current) {
          dwell.current.set(section, (dwell.current.get(section) ?? 0) + elapsed)
        }
      }

      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    const onVisibility = () => {
      last = performance.now()
      lastY = window.scrollY
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  /* ---- copy and outbound clicks ---- */
  useEffect(() => {
    const onCopy = () => {
      events.current.push({ signal: 'copy_text', strength: 1, at: Date.now() })
      run(Date.now())
    }
    document.addEventListener('copy', onCopy)
    return () => document.removeEventListener('copy', onCopy)
  }, [run])

  /* ---- the tick ---- */
  useEffect(() => {
    const timer = window.setInterval(() => run(Date.now()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [run])

  /* ---- remember the conclusion, coarsely ---- */
  useEffect(() => {
    if (hypothesis.state !== 'resolved' || !hypothesis.leader) return
    writeVisit({ persona: hypothesis.leader, at: Date.now() })
  }, [hypothesis.state, hypothesis.leader])

  /* ---- sparkline history ---- */
  const [lastConfidence, setLastConfidence] = useState<number | null>(null)
  if (lastConfidence !== hypothesis.confidence) {
    setLastConfidence(hypothesis.confidence)
    setHistory((previous) => [...previous, hypothesis.confidence].slice(-12))
  }

  /* ---- which sections are on screen ---- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const record of entries) {
          const id = Number(
            (record.target as HTMLElement).dataset.sectionId,
          ) as SectionId

          /*
           * "Half of it is showing" is the wrong test here. Most of these
           * sections are taller than the viewport, and a plain `threshold: 0.5`
           * can never fire for those — the longest, most substantial sections
           * would silently never accumulate any dwell at all.
           *
           * So: count it as being read when it fills half the screen, or when
           * half of it is visible, whichever is the smaller ask.
           */
          const target = Math.min(
            record.boundingClientRect.height,
            window.innerHeight,
          )
          const shown = record.intersectionRect.height
          if (record.isIntersecting && shown >= target * 0.5) {
            visible.current.add(id)
          } else {
            visible.current.delete(id)
          }
        }
      },
      // A spread of thresholds so the callback fires as tall sections scroll
      // through, not just when they enter and leave.
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    )

    // Query the DOM rather than a registration map: reordering moves these
    // nodes but never replaces them, so one setup covers the whole session and
    // the provider does not need to know when sections mount.
    document
      .querySelectorAll<HTMLElement>('[data-section-id]')
      .forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [])

  const recordEngagement = useCallback(
    (section: SectionId, depth: EngagementDepth) => {
      engagements.current.push({
        signal: `engage_${section}` as SignalId,
        strength: ENGAGEMENT_DEPTH[depth],
        at: Date.now(),
      })
      run(Date.now())
    },
    [run],
  )

  const recordEvent = useCallback(
    (signal: SignalId) => {
      events.current.push({ signal, strength: 1, at: Date.now() })
      run(Date.now())
    },
    [run],
  )

  const pin = useCallback(
    (persona: Persona) => {
      setPinned(persona)
      pinnedRef.current = persona
      run(Date.now())
    },
    [run],
  )

  const clearPin = useCallback(() => {
    setPinned(null)
    pinnedRef.current = null
    run(Date.now())
  }, [run])

  const value = useMemo<InferenceValue>(
    () => ({
      hypothesis,
      pinned,
      history,
      pin,
      clearPin,
      recordEngagement,
      recordEvent,
    }),
    [
      hypothesis,
      pinned,
      history,
      pin,
      clearPin,
      recordEngagement,
      recordEvent,
    ],
  )

  return (
    <InferenceContext.Provider value={value}>
      {children}
    </InferenceContext.Provider>
  )
}

export function useInference(): InferenceValue {
  const value = useContext(InferenceContext)
  if (!value) throw new Error('useInference used outside InferenceProvider')
  return value
}
