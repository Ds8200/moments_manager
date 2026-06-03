'use client'

import { useState, type MouseEvent } from 'react'

export interface DropdownMenuItem {
  label: string
  icon?: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

export interface DropdownMenuState {
  isOpen: boolean
  title: string
  items: DropdownMenuItem[]
  anchorX: number
  anchorY: number
  anchorWidth: number
  anchorHeight: number
}

const CLOSED: DropdownMenuState = {
  isOpen: false,
  title: '',
  items: [],
  anchorX: 0,
  anchorY: 0,
  anchorWidth: 0,
  anchorHeight: 0,
}

export interface UseDropdownMenuReturn {
  menuState: DropdownMenuState
  openMenu: (title: string, items: DropdownMenuItem[], e: MouseEvent<Element>) => void
  closeMenu: () => void
}

export const useDropdownMenu = (): UseDropdownMenuReturn => {
  const [menuState, setMenuState] = useState<DropdownMenuState>(CLOSED)

  const openMenu = (
    title: string,
    items: DropdownMenuItem[],
    e: MouseEvent<Element>
  ): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuState({
      isOpen: true,
      title,
      items,
      anchorX: rect.left,
      anchorY: rect.top,
      anchorWidth: rect.width,
      anchorHeight: rect.height,
    })
  }

  const closeMenu = (): void => setMenuState(CLOSED)

  return { menuState, openMenu, closeMenu }
}
