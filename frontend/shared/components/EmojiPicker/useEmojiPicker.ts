'use client'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

export interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  triggerRef: RefObject<HTMLButtonElement | null>
  anchorRef: RefObject<HTMLElement | null>
  safeRefs: RefObject<HTMLElement | null>[]
}

export interface UseEmojiPickerReturn {
  containerRef: RefObject<HTMLDivElement | null>
}

const PANEL_HEIGHT = 300 // conservative estimate in px
const PANEL_WIDTH  = 280 // matches min-width in SCSS

export const useEmojiPicker = ({
  isOpen,
  onClose,
  triggerRef,
  anchorRef,
  safeRefs,
}: Pick<EmojiPickerProps, 'isOpen' | 'onClose' | 'triggerRef' | 'anchorRef' | 'safeRefs'>): UseEmojiPickerReturn => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Position the panel below the anchor field, centered horizontally on it.
  // We apply position via element.style.setProperty to avoid the forbidden JSX style={{}} prop.
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return
    const panel = containerRef.current
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const rawLeft = rect.left + rect.width / 2 - PANEL_WIDTH / 2
    const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - PANEL_WIDTH - 8))

    const spaceBelow = window.innerHeight - rect.bottom
    // If the anchor sits in the top half of the viewport there is always room
    // below it — never flip up. Only consider flipping when the anchor is in
    // the bottom half AND there isn't enough space below.
    const anchorInTopHalf = rect.top < window.innerHeight / 2
    const top =
      anchorInTopHalf || spaceBelow >= PANEL_HEIGHT
        ? rect.bottom + 8
        : rect.top - PANEL_HEIGHT - 8

    panel.style.setProperty('left', `${clampedLeft}px`)
    panel.style.setProperty('top', `${top}px`)
  }, [isOpen, anchorRef])

  // Outside-click: close unless the click landed on the trigger button,
  // one of the safe refs (subject input / body textarea), or inside the panel.
  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent): void => {
      const target = e.target as Node
      const inPanel   = containerRef.current?.contains(target)
      const inTrigger = triggerRef.current?.contains(target)
      const inSafe    = safeRefs.some((r) => r.current?.contains(target))
      if (!inPanel && !inTrigger && !inSafe) onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose, triggerRef, safeRefs])

  return { containerRef }
}
