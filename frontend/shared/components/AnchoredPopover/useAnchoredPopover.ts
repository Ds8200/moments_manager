'use client'

import { useState } from 'react'

// Structural type so both React MouseEvent and TouchEvent can anchor the popover —
// both carry a `currentTarget` that is a real DOM Element. Mirrors useDropdownMenu's AnchorEvent.
export interface AnchorEvent {
  currentTarget: Element
}

// Tagged union instead of `data: T | null` — lets consumers read `state.data` after
// narrowing on `state.isOpen` without a non-null assertion.
export type AnchoredPopoverState<T> =
  | { isOpen: false }
  | {
      isOpen: true
      data: T
      anchorX: number
      anchorY: number
      anchorWidth: number
      anchorHeight: number
    }

const CLOSED: AnchoredPopoverState<never> = { isOpen: false }

export interface UseAnchoredPopoverReturn<T> {
  state: AnchoredPopoverState<T>
  open: (data: T, e: AnchorEvent) => void
  close: () => void
}

export const useAnchoredPopover = <T,>(): UseAnchoredPopoverReturn<T> => {
  const [state, setState] = useState<AnchoredPopoverState<T>>(CLOSED)

  const open = (data: T, e: AnchorEvent): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    setState({
      isOpen: true,
      data,
      anchorX: rect.left,
      anchorY: rect.top,
      anchorWidth: rect.width,
      anchorHeight: rect.height,
    })
  }

  const close = (): void => setState(CLOSED)

  return { state, open, close }
}
