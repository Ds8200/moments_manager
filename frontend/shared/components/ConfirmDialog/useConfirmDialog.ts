'use client'
import { useAtom } from 'jotai'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { CONFIRM_DIALOG_LABELS } from '@/shared/constants/uiLabels'

export type ConfirmDialogProps = Record<string, never>

export interface UseConfirmDialogReturn {
  isOpen: boolean
  title: string
  message: string
  isDangerous: boolean
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export const useConfirmDialog = (): UseConfirmDialogReturn => {
  const [state, setState] = useAtom(confirmDialogAtom)

  const close = (): void => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }

  const onConfirm = (): void => {
    state.options.onConfirm()
    close()
  }

  const onCancel = (): void => {
    close()
  }

  return {
    isOpen: state.isOpen,
    title: state.options.title ?? CONFIRM_DIALOG_LABELS.TITLE,
    message: state.options.message,
    isDangerous: state.options.isDangerous ?? false,
    confirmLabel: CONFIRM_DIALOG_LABELS.CONFIRM,
    cancelLabel: CONFIRM_DIALOG_LABELS.CANCEL,
    onConfirm,
    onCancel,
  }
}
