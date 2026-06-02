'use client'
import { atom } from 'jotai'

export interface ConfirmDialogOptions {
  title?: string
  message: string
  isDangerous?: boolean
  onConfirm: () => void
}

interface ConfirmDialogState {
  isOpen: boolean
  options: ConfirmDialogOptions
}

const CLOSED_STATE: ConfirmDialogState = {
  isOpen: false,
  options: { message: '', onConfirm: () => {} },
}

export const confirmDialogAtom = atom<ConfirmDialogState>(CLOSED_STATE)
