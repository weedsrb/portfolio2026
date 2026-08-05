'use client'

import { useEffect, useRef } from 'react'

import { atRest, lerp, spring, step } from '@/lib/motion/spring'
import type { ResolveState } from '@/lib/inference/engine'

/**
 * The breathing field.
 *
 * The motion *is* the confidence. That is the whole requirement, and it is what
 * separates this from a gradient that happens to move: every driving
 * parameter — orbit radius, frequency, turbulence, coherence — is a function of
 * a number the engine actually computed.
 *
 *   confidence 0.0   masses far apart, wide orbits, high turbulence, ~0.9Hz
 *   confidence 0.5   orbits tightening, turbulence halved, beginning to overlap
 *   confidence 1.0   concentric and overlapping, still, a slow ~0.15Hz breath
 *
 * Two masses on *independent* Lissajous paths, composited additively so their
 * intersection brightens. Deliberately not a single blob: the interference
 * pattern is the fingerprint that stops this reading as the voice-assistant orb
 * it is quietly referencing.
 *
 * 2D canvas rather than WebGL. At this size the fill cost is trivial and a GL
 * context is more moving parts than the effect is worth. No CSS blur filters —
 * radial gradients give the falloff natively, and blur is both expensive and
 * soft rather than luminous.
 */

const SIZE = 56
const FPS = 30
const FRAME_MS = 1000 / FPS

/** Normal settling. Deliberately visible — the field should be seen arriving. */
const STIFFNESS_SETTLE = 26
/** An override is an answer, not a guess: converge in ~400ms, then stop. */
const STIFFNESS_PINNED = 90

type Rgb = [number, number, number]

function readRgb(el: HTMLElement, property: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(el).getPropertyValue(property).trim()
  const hex = raw.match(/^#([0-9a-f]{6})$/i)
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = raw.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return fallback
}

/**
 * Smooth deterministic wobble. Summed sines rather than Math.random so the
 * field is reproducible frame to frame and never jitters discontinuously.
 */
function wobble(t: number, seed: number): number {
  return (
    Math.sin(t * 1.7 + seed) * 0.6 +
    Math.sin(t * 2.9 + seed * 2.3) * 0.3 +
    Math.sin(t * 4.7 + seed * 3.1) * 0.1
  )
}

export function BreathingField({
  confidence,
  state,
}: {
  confidence: number
  state: ResolveState
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /*
   * The animation reads its target through refs so that a changing confidence
   * never tears down and restarts the render loop — the field has to settle
   * continuously across updates, not begin again on each one.
   */
  const target = useRef(state === 'unresolved' ? 0 : confidence)
  const pinned = useRef(state === 'pinned')

  useEffect(() => {
    /*
     * Pinned drives to full coherence rather than to the engine's number. When
     * you have told the page who you are there is no inference left to
     * represent — and the readout correspondingly refuses to print a confidence
     * in that state, so the field is not contradicting a number on screen.
     *
     * Unresolved drives to zero for the same reason in reverse: there is no
     * confidence worth showing, so the field churns rather than implying the
     * small number the maths happened to produce means something.
     */
    target.current =
      state === 'pinned' ? 1 : state === 'unresolved' ? 0 : confidence
    pinned.current = state === 'pinned'
  }, [confidence, state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    const phosphor = readRgb(canvas, '--color-phosphor', [79, 227, 193])
    const indigo = readRgb(canvas, '--color-indigo', [108, 123, 255])
    const background = readRgb(canvas, '--color-instrument-bg', [10, 15, 18])
    const bg = `rgb(${background[0]},${background[1]},${background[2]})`

    const c = spring(target.current)
    let t = 0

    function mass(x: number, y: number, radius: number, [r, g, b]: Rgb, alpha: number) {
      const gradient = ctx!.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
      gradient.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.34})`)
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx!.fillStyle = gradient
      ctx!.fillRect(0, 0, SIZE, SIZE)
    }

    function draw() {
      const v = Math.max(0, Math.min(1, c.value))
      const mid = SIZE / 2

      // Every one of these is a function of the confidence. Nothing here is a
      // free-running decorative constant.
      const orbit = lerp(0.30, 0.015, v) * SIZE
      const freq = lerp(0.9, 0.15, v)
      const turbulence = lerp(1, 0, v) * 0.14 * SIZE
      const radius = lerp(0.30, 0.46, v) * SIZE
      const alpha = lerp(0.5, 0.78, v)

      const phase = t * freq * Math.PI * 2

      // Independent paths with different frequency ratios, so the two masses
      // drift into and out of alignment rather than orbiting in lockstep.
      const ax = mid + Math.sin(phase * 1.0) * orbit + wobble(t, 1.3) * turbulence
      const ay = mid + Math.cos(phase * 1.3) * orbit + wobble(t, 2.7) * turbulence
      const bx = mid + Math.sin(phase * 1.3 + 2.1) * orbit + wobble(t, 4.1) * turbulence
      const by = mid + Math.cos(phase * 0.9 + 2.1) * orbit + wobble(t, 5.9) * turbulence

      ctx!.globalCompositeOperation = 'source-over'
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, SIZE, SIZE)

      // Additive: where the two masses overlap, their light sums. That sum is
      // the interference, and it is the point of using two of them.
      ctx!.globalCompositeOperation = 'lighter'
      mass(ax, ay, radius, phosphor, alpha)
      mass(bx, by, radius, indigo, alpha)

      // An explicit brightening at the intersection, scaled by how close the
      // masses are, so coherence reads clearly at a glance rather than only
      // under inspection.
      const dx = ax - bx
      const dy = ay - by
      const distance = Math.hypot(dx, dy)
      const overlap = Math.max(0, 1 - distance / radius)
      if (overlap > 0) {
        const blend: Rgb = [
          (phosphor[0] + indigo[0]) / 2,
          (phosphor[1] + indigo[1]) / 2,
          (phosphor[2] + indigo[2]) / 2,
        ]
        mass(
          (ax + bx) / 2,
          (ay + by) / 2,
          radius * 0.62,
          blend,
          overlap * overlap * 0.5 * alpha,
        )
      }

      ctx!.globalCompositeOperation = 'source-over'
    }

    // Reduced motion: one frame, at the current confidence. It still has to
    // read as a state indicator — more overlap means more certain.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      c.value = target.current
      draw()
      return
    }

    let frame = 0
    let last = performance.now()
    let accumulated = 0
    let visible = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)

      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      // Off screen or backgrounded: keep the clock honest, draw nothing.
      if (!visible || document.visibilityState !== 'visible') {
        accumulated = 0
        return
      }

      accumulated += dt * 1000
      if (accumulated < FRAME_MS) return
      accumulated = 0

      const stiffness = pinned.current ? STIFFNESS_PINNED : STIFFNESS_SETTLE
      step(c, target.current, dt, stiffness)

      // Pinned and arrived: the answer is settled, so stop burning frames.
      // Any change to the target restarts this naturally on the next tick.
      if (pinned.current && atRest(c, target.current)) {
        c.value = target.current
        t = 0
        draw()
        return
      }

      t += dt
      draw()
    }

    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{ width: SIZE, height: SIZE }}
      className="shrink-0"
      aria-hidden="true"
    />
  )
}
