'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactElement } from 'react'
import type { DropdownMenuItem, DropdownMenuState } from './useDropdownMenu'
import styles from './DropdownMenu.module.scss'

const MENU_WIDTH = 220
const ITEM_HEIGHT = 44
const TITLE_HEIGHT = 48
const VIEWPORT_PADDING = 8

function calcPosition(state: DropdownMenuState, itemCount: number): { top: number; left: number } {
  const menuHeight = TITLE_HEIGHT + itemCount * ITEM_HEIGHT + VIEWPORT_PADDING
  const spaceBelow = window.innerHeight - (state.anchorY + state.anchorHeight)
  const top =
    spaceBelow >= menuHeight
      ? state.anchorY + state.anchorHeight + 4
      : state.anchorY - menuHeight - 4

  // In RTL layout the menu aligns to the start (right) edge of the anchor
  let left = state.anchorX + state.anchorWidth - MENU_WIDTH
  left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING))

  return {
    top: Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PADDING)),
    left,
  }
}

export interface DropdownMenuProps {
  state: DropdownMenuState
  onClose: () => void
}

export const DropdownMenu = ({ state, onClose }: DropdownMenuProps): ReactElement | null => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state.isOpen) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [state.isOpen, onClose])

  if (!state.isOpen || typeof document === 'undefined') return null

  const { top, left } = calcPosition(state, state.items.length)

  const handleItemClick = (item: DropdownMenuItem): void => {
    onClose()
    item.onClick()
  }

  // Dynamic position is set via CSS custom properties — inline style is unavoidable
  // for runtime-computed coordinates that cannot be expressed as static CSS classes.
  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        ref={menuRef}
        className={styles.menu}
        role="menu"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={{ '--dm-top': `${top}px`, '--dm-left': `${left}px` } as any}
      >
        <div className={styles.menuTitle}>{state.title}</div>
        <ul className={styles.menuList} role="none">
          {state.items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                className={`${styles.menuItem} ${item.variant === 'danger' ? styles.menuItemDanger : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>,
    document.body
  )
}
