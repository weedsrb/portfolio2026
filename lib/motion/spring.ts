/**
 * A critically damped spring, integrated by hand.
 *
 * Critically damped specifically: the value must arrive at its target as fast
 * as possible *without overshooting*. An overshoot here would mean the readout
 * briefly displaying more confidence than the engine actually has, which is the
 * one thing this component is not allowed to do.
 */

export type Spring = {
  value: number
  velocity: number
}

export function spring(value: number): Spring {
  return { value, velocity: 0 }
}

/**
 * Advance a spring toward `target`.
 *
 * @param dt        seconds since the last step
 * @param stiffness higher settles faster; damping is derived to stay critical
 */
export function step(
  s: Spring,
  target: number,
  dt: number,
  stiffness: number,
): void {
  // Clamp dt so a backgrounded tab returning does not fling the spring.
  const h = Math.min(dt, 1 / 30)
  const damping = 2 * Math.sqrt(stiffness)

  const accel = -stiffness * (s.value - target) - damping * s.velocity
  s.velocity += accel * h
  s.value += s.velocity * h
}

/** True once the spring has effectively arrived and stopped. */
export function atRest(s: Spring, target: number, epsilon = 0.001): boolean {
  return Math.abs(s.value - target) < epsilon && Math.abs(s.velocity) < epsilon
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
