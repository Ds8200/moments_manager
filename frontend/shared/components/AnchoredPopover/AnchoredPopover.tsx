'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactElement, ReactNode } from 'react'
import type { AnchoredPopoverState } from './useAnchoredPopover'
import styles from './AnchoredPopover.module.scss'

const DEFAULT_WIDTH = 320
// Content height is variable (a product list can be short or long) — .popoverBody caps its own
// height with overflow scroll, so this is only an estimate used to decide whether the popover
// should flip above the anchor, mirroring DropdownMenu's calcPosition approach.
const ESTIMATED_HEIGHT = 320
const VIEWPORT_PADDING = 8

function calcPosition(
  anchorX: number,
  anchorY: number,
  anchorWidth: number,
  anchorHeight: number,
  width: number
): { top: number; left: number } {
  const spaceBelow = window.innerHeight - (anchorY + anchorHeight)
  const top =
    spaceBelow >= ESTIMATED_HEIGHT
      ? anchorY + anchorHeight + 4
      : anchorY - ESTIMATED_HEIGHT - 4

  // In RTL layout the popover aligns to the start (right) edge of the anchor.
  let left = anchorX + anchorWidth - width
  left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - width - VIEWPORT_PADDING))

  return {
    top: Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - ESTIMATED_HEIGHT - VIEWPORT_PADDING)),
    left,
  }
}

export interface AnchoredPopoverProps<T> {
  state: AnchoredPopoverState<T>
  onClose: () => void
  width?: number
  children: (data: T) => ReactNode
}

export const AnchoredPopover = <T,>({
  state,
  onClose,
  width = DEFAULT_WIDTH,
  children,
}: AnchoredPopoverProps<T>): ReactElement | null => {
  useEffect(() => {
    if (!state.isOpen) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [state.isOpen, onClose])

  if (!state.isOpen || typeof document === 'undefined') return null

  const { top, left } = calcPosition(state.anchorX, state.anchorY, state.anchorWidth, state.anchorHeight, width)

  // Dynamic position is set via CSS custom properties — inline style is unavoidable
  // for runtime-computed coordinates that cannot be expressed as static CSS classes.
  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.popover}
        role="dialog"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={{ '--ap-top': `${top}px`, '--ap-left': `${left}px`, '--ap-width': `${width}px` } as any}
      >
        {children(state.data)}
      </div>
    </>,
    document.body
  )
}
