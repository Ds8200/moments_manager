'use client'

import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactElement, ReactNode } from 'react'
import type { AnchoredPopoverState } from './useAnchoredPopover'
import styles from './AnchoredPopover.module.scss'

const DEFAULT_WIDTH = 320
const VIEWPORT_PADDING = 8

// `height` is the popover's own real rendered height (read from the already-mounted DOM node,
// not a guessed constant) — using a generic estimate here previously made the vertical flip
// trigger for rows that actually had plenty of room below, and the clamp then converged several
// different rows onto the same ceiling position.
function calcPosition(
  anchorEl: Element,
  height: number,
  width: number
): { top: number; left: number } {
  const rect = anchorEl.getBoundingClientRect()

  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow >= height ? rect.bottom + 4 : rect.top - height - 4

  // Prefer aligning the popover's trailing (right) edge with the anchor's — natural for RTL,
  // where content anchored to a control tends to extend backward/leftward from it. But the
  // anchor here can sit anywhere in a wide table (not just at the row's own right edge like
  // DropdownMenu's row-wide anchor does), so right-alignment can push `left` negative for an
  // anchor that isn't near the right edge. Flip to leading (left) alignment instead of just
  // clamping in that case, so the popover stays visually tethered to the anchor either way.
  const rightAligned = rect.right - width
  const left =
    rightAligned >= VIEWPORT_PADDING
      ? Math.min(rightAligned, window.innerWidth - width - VIEWPORT_PADDING)
      : Math.max(VIEWPORT_PADDING, Math.min(rect.left, window.innerWidth - width - VIEWPORT_PADDING))

  return {
    top: Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - height - VIEWPORT_PADDING)),
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
  const popoverRef = useRef<HTMLDivElement>(null)
  const anchorEl = state.isOpen ? state.anchorEl : null

  // Writes position straight to the DOM (like EmojiPicker's panel.style.setProperty) instead of
  // through React state, so repositioning on scroll/resize doesn't trigger a re-render on every
  // tick — and the popover's own `overflow: auto` / the table's scroll container are both caught
  // by listening in the capture phase, not just window-level scroll.
  useLayoutEffect(() => {
    const popoverEl = popoverRef.current
    if (!anchorEl || !popoverEl) return

    const recompute = (): void => {
      const { top, left } = calcPosition(anchorEl, popoverEl.offsetHeight, width)
      popoverEl.style.setProperty('--ap-top', `${top}px`)
      popoverEl.style.setProperty('--ap-left', `${left}px`)
    }
    recompute()
    window.addEventListener('scroll', recompute, true)
    window.addEventListener('resize', recompute)
    return () => {
      window.removeEventListener('scroll', recompute, true)
      window.removeEventListener('resize', recompute)
    }
  }, [anchorEl, width])

  useLayoutEffect(() => {
    if (!state.isOpen) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [state.isOpen, onClose])

  if (!state.isOpen || typeof document === 'undefined') return null

  // Width is static for the popover's lifetime (unlike top/left) so it's safe to set once via
  // inline style at render time — the runtime-computed value still can't be a static CSS class.
  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        ref={popoverRef}
        className={styles.popover}
        role="dialog"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={{ '--ap-width': `${width}px` } as any}
      >
        {children(state.data)}
      </div>
    </>,
    document.body
  )
}
