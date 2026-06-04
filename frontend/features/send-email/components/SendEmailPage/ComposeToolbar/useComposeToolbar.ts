'use client'
import type { ChangeEvent, RefObject } from 'react'

export interface ComposeToolbarProps {
  buttonRef: RefObject<HTMLButtonElement | null>
  togglePicker: () => void
  isPickerOpen: boolean
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  isPending: boolean
}

export interface UseComposeToolbarReturn {
  buttonRef: RefObject<HTMLButtonElement | null>
  togglePicker: () => void
  isPickerOpen: boolean
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  isPending: boolean
}

export const useComposeToolbar = (props: ComposeToolbarProps): UseComposeToolbarReturn => props
