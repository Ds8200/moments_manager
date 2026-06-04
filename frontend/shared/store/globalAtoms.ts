'use client'
import { atom } from 'jotai'
import type { NotificationType } from '../enums/notificationEnums'

export interface Toast {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

const MAX_TOASTS = 4

export const toastsAtom = atom<Toast[]>([])

// Write-only atom: appends a toast with a generated id, capping the stack at MAX_TOASTS.
export const addToastAtom = atom(
  null,
  (get, set, toast: Omit<Toast, 'id'>): void => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    const next = [...get(toastsAtom), { ...toast, id }]
    set(toastsAtom, next.slice(-MAX_TOASTS))
  }
)

// Write-only atom: removes a toast by id.
export const removeToastAtom = atom(null, (get, set, id: string): void => {
  set(
    toastsAtom,
    get(toastsAtom).filter((t) => t.id !== id)
  )
})

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

// Controls sidebar visibility on desktop (collapse/expand) and drawer on mobile.
// Defaults to false; AppContentWrapper sets true on desktop after mount.
export const isSidebarOpenAtom = atom<boolean>(false)
