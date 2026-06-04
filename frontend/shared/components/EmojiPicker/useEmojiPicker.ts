'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  buttonRef: RefObject<HTMLButtonElement | null>
}

export interface UseEmojiPickerReturn {
  containerRef: RefObject<HTMLDivElement | null>
  flipUp: boolean
}

const PANEL_HEIGHT = 300 // conservative estimate in px

export const useEmojiPicker = ({
  isOpen,
  onClose,
  buttonRef,
}: Pick<EmojiPickerProps, 'isOpen' | 'onClose' | 'buttonRef'>): UseEmojiPickerReturn => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [flipUp, setFlipUp] = useState(false)

  // Determine flip direction before rendering so there's no visual jump.
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setFlipUp(window.innerHeight - rect.bottom < PANEL_HEIGHT)
  }, [isOpen, buttonRef])

  // Outside-click: close unless the click was on the toggle button itself.
  // Without the button exclusion, mousedown fires onClose() and then the
  // button's click fires togglePicker(), resulting in the picker re-opening.
  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent): void => {
      const target = e.target as Node
      const inPanel = containerRef.current?.contains(target)
      const inButton = buttonRef.current?.contains(target)
      if (!inPanel && !inButton) onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose, buttonRef])

  return { containerRef, flipUp }
}
