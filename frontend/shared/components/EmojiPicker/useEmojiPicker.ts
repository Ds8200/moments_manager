'use client'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
}

export interface UseEmojiPickerReturn {
  containerRef: RefObject<HTMLDivElement | null>
}

export const useEmojiPicker = ({
  isOpen,
  onClose,
}: Pick<EmojiPickerProps, 'isOpen' | 'onClose'>): UseEmojiPickerReturn => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent): void => {
      if (!containerRef.current || !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose])

  return { containerRef }
}
