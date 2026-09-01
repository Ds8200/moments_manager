'use client'
import { useRef } from 'react'
import type { MouseEvent, TouchEvent, KeyboardEvent } from 'react'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { LONG_PRESS_DURATION_MS } from '@/shared/constants/interaction'
import type { DropdownMenuItem, DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

// How long after a long-press fires to keep swallowing the browser's trailing synthetic click —
// long enough for that ghost click to arrive, short enough not to eat the next real tap.
const CLICK_SUPPRESSION_WINDOW_MS = 350

export interface RowInteractionConfig {
  onActivate?: () => void
  menuTitle: string
  items: DropdownMenuItem[]
}

export interface RowInteractionHandlers {
  onClick: () => void
  onContextMenu: (e: MouseEvent<Element>) => void
  onTouchStart: (e: TouchEvent<Element>) => void
  onTouchMove: () => void
  onTouchEnd: () => void
  onKeyDown: (e: KeyboardEvent<Element>) => void
  tabIndex: number
}

export interface UseTableRowInteractionReturn {
  menuState: DropdownMenuState
  closeMenu: () => void
  getRowProps: (config: RowInteractionConfig) => RowInteractionHandlers
}

export const useTableRowInteraction = (): UseTableRowInteractionReturn => {
  const { menuState, openMenu, closeMenu } = useDropdownMenu()
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressNextClick = useRef(false)

  const clearLongPressTimer = (): void => {
    if (longPressTimer.current === null) return
    clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }

  const getRowProps = (config: RowInteractionConfig): RowInteractionHandlers => {
    const { onActivate, menuTitle, items } = config

    return {
      onClick: () => {
        if (suppressNextClick.current) {
          suppressNextClick.current = false
          return
        }
        onActivate?.()
      },

      onContextMenu: (e) => {
        if (items.length === 0) return
        e.preventDefault()
        openMenu(menuTitle, items, e)
      },

      onTouchStart: (e) => {
        clearLongPressTimer()
        if (items.length === 0) return
        const target = e.currentTarget
        longPressTimer.current = setTimeout(() => {
          longPressTimer.current = null
          suppressNextClick.current = true
          openMenu(menuTitle, items, { currentTarget: target })
        }, LONG_PRESS_DURATION_MS)
      },

      onTouchMove: clearLongPressTimer,

      onTouchEnd: () => {
        clearLongPressTimer()
        if (!suppressNextClick.current) return
        setTimeout(() => {
          suppressNextClick.current = false
        }, CLICK_SUPPRESSION_WINDOW_MS)
      },

      onKeyDown: (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onActivate?.()
      },

      tabIndex: 0,
    }
  }

  return { menuState, closeMenu, getRowProps }
}
