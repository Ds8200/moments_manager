'use client'
import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { removeToastAtom } from '@/shared/store/globalAtoms'
import { NOTIFICATION_TYPE } from '@/shared/enums/notificationEnums'
import { TOAST_LABELS } from '@/shared/constants/uiLabels'
import type { Toast } from '@/shared/store/globalAtoms'
import styles from './ToastItem.module.scss'

const DEFAULT_DURATION = 4000

export interface ToastItemProps {
  toast: Toast
}

export interface UseToastItemReturn {
  message: string
  typeClassName: string
  ariaRole: 'alert' | 'status'
  closeLabel: string
  onClose: () => void
}

const TYPE_CLASS: Record<string, string> = {
  [NOTIFICATION_TYPE.SUCCESS]: styles.success,
  [NOTIFICATION_TYPE.ERROR]: styles.error,
  [NOTIFICATION_TYPE.INFO]: styles.info,
  [NOTIFICATION_TYPE.WARNING]: styles.warning,
}

export const useToastItem = ({ toast }: ToastItemProps): UseToastItemReturn => {
  const removeToast = useSetAtom(removeToastAtom)

  const onClose = (): void => {
    removeToast(toast.id)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration ?? DEFAULT_DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return {
    message: toast.message,
    typeClassName: TYPE_CLASS[toast.type] ?? styles.info,
    ariaRole: toast.type === NOTIFICATION_TYPE.ERROR ? 'alert' : 'status',
    closeLabel: TOAST_LABELS.CLOSE,
    onClose,
  }
}
