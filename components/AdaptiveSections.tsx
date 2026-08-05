'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { useInference } from '@/hooks/useInference'
import {
  DEFAULT_ORDER,
  PERSONA_LABELS,
  SECTIONS_LABEL,
  type SectionId,
} from '@/lib/inference/personas'
import {
  constrainToBelowFold,
  measure,
  playFlip,
  prefersReducedMotion,
} from '@/lib/motion/flip'

/**
 * Renders the evidence sections in the order the engine currently wants.
 *
 * The sections themselves are server-rendered and passed in as children; this
 * component only decides sequence. First paint is always the default order, so
 * there is no flash and no layout shift, and the page is complete without
 * JavaScript.
 */

export type SectionChild = { id: SectionId; node: ReactNode }

export function AdaptiveSections({ sections }: { sections: SectionChild[] }) {
  const { hypothesis } = useInference()
  const [order, setOrder] = useState<readonly SectionId[]>(DEFAULT_ORDER)
  const [announcement, setAnnouncement] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<SectionId, HTMLElement>())
  const pendingMeasure = useRef<ReturnType<typeof measure> | null>(null)

  const desired = hypothesis.order

  useEffect(() => {
    // Same order the engine already gave us — nothing to do.
    if (desired.length === order.length && desired.every((id, i) => id === order[i])) {
      return
    }

    const { order: constrained, frozenCount } = constrainToBelowFold(
      order,
      desired,
      measure(nodes.current),
      window.scrollY,
    )
    if (constrained.every((id, i) => id === order[i])) return

    // FIRST: record where everything is, before React moves it.
    pendingMeasure.current = measure(nodes.current)
    setOrder(constrained)

    // Announce what actually moved. Sections above the fold were held in place,
    // so naming one of those as "now first" would report a change that did not
    // happen — and leave the real one unmentioned.
    const leader = hypothesis.leader
    const movedFirst = constrained[frozenCount]
    const movedSecond = constrained[frozenCount + 1]
    const who = leader
      ? ` for ${PERSONA_LABELS[leader].toLowerCase()}`
      : ''

    setAnnouncement(
      movedFirst
        ? `Section order updated${who}. Coming up next: ` +
            `${SECTIONS_LABEL[movedFirst]}` +
            (movedSecond ? `, then ${SECTIONS_LABEL[movedSecond]}.` : '.')
        : `Section order updated${who}.`,
    )
  }, [desired, order, hypothesis.leader])

  // LAST / INVERT / PLAY, after the DOM has the new order.
  useEffect(() => {
    const before = pendingMeasure.current
    if (!before) return
    pendingMeasure.current = null
    playFlip(before, nodes.current, { reducedMotion: prefersReducedMotion() })
  }, [order])

  const byId = new Map(sections.map((section) => [section.id, section.node]))

  return (
    <div ref={containerRef}>
      {/*
        The reorder changes DOM order, which is correct and is exactly why this
        announcement exists: a screen reader user needs to be told the document
        rearranged itself underneath them.
      */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {order.map((id) => (
        <div
          key={id}
          data-section-id={id}
          ref={(node) => {
            if (node) nodes.current.set(id, node)
            else nodes.current.delete(id)
          }}
        >
          {byId.get(id)}
        </div>
      ))}
    </div>
  )
}
