'use client'

import { Readout } from '@/components/readout/Readout'
import { useInference } from '@/hooks/useInference'

/**
 * The readout, now driven by the engine rather than by canned fixtures.
 *
 * The `?debug=1` gate is gone: as of phase 5 the page is genuinely observing
 * and the readout is genuinely reporting, so showing it is the honest thing.
 */
export function ReadoutMount() {
  const { hypothesis, pinned, pin, clearPin, history } = useInference()

  return (
    <Readout
      hypothesis={hypothesis}
      pinned={pinned}
      onPin={pin}
      onClear={clearPin}
      history={history}
    />
  )
}
