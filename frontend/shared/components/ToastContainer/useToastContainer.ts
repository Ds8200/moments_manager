'use client'
import { useAtomValue } from 'jotai'
import { toastsAtom } from '@/shared/store/globalAtoms'
import { TOAST_LABELS } from '@/shared/constants/uiLabels'
import type { Toast } from '@/shared/store/globalAtoms'

export type ToastContainerProps = Record<string, never>

export interface UseToastContainerReturn {
  toasts: Toast[]
  regionLabel: string
}

export const useToastContainer = (): UseToastContainerReturn => {
  const toasts = useAtomValue(toastsAtom)

  return {
    toasts,
    regionLabel: TOAST_LABELS.REGION,
  }
}
