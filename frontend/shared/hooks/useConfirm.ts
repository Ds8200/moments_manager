'use client'
import { useSetAtom } from 'jotai'
import { confirmDialogAtom } from '../store/globalAtoms'
import type { ConfirmDialogOptions } from '../store/globalAtoms'

export const useConfirm = (): ((options: ConfirmDialogOptions) => void) => {
  const setDialog = useSetAtom(confirmDialogAtom)
  return (options: ConfirmDialogOptions): void => {
    setDialog({ isOpen: true, options })
  }
}
