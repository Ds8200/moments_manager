'use client'

import { useState } from 'react'

// Structural type so both React MouseEvent and TouchEvent can anchor the popover —
// both carry a `currentTarget` that is a real DOM Element. Mirrors useDropdownMenu's AnchorEvent.
export interface AnchorEvent {
  currentTarget: Element
}

// Tagged union instead of `data: T | null` — lets consumers read `state.data` after
// narrowing on `state.isOpen` without a non-null assertion. Stores the anchor *element*
// (not a one-shot rect) so AnchoredPopover can re-measure it live on scroll/resize.
export type AnchoredPopoverState<T> =
  | { isOpen: false }
  | { isOpen: true; data: T; anchorEl: Element }

const CLOSED: AnchoredPopoverState<never> = { isOpen: false }

export interface UseAnchoredPopoverReturn<T> {
  state: AnchoredPopoverState<T>
  open: (data: T, e: AnchorEvent) => void
  close: () => void
}

export const useAnchoredPopover = <T,>(): UseAnchoredPopoverReturn<T> => {
  const [state, setState] = useState<AnchoredPopoverState<T>>(CLOSED)

  const open = (data: T, e: AnchorEvent): void => {
    setState({ isOpen: true, data, anchorEl: e.currentTarget })
  }

  const close = (): void => setState(CLOSED)

  return { state, open, close }
}
