'use client'
import { useSetAtom } from 'jotai'
import { useMemo } from 'react'
import { addToastAtom } from '../store/globalAtoms'
import { NOTIFICATION_TYPE } from '../enums/notificationEnums'

export interface UseNotifyReturn {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

export const useNotify = (): UseNotifyReturn => {
  const addToast = useSetAtom(addToastAtom)

  return useMemo(
    () => ({
      success: (message: string): void =>
        addToast({ type: NOTIFICATION_TYPE.SUCCESS, message }),
      error: (message: string): void => addToast({ type: NOTIFICATION_TYPE.ERROR, message }),
      info: (message: string): void => addToast({ type: NOTIFICATION_TYPE.INFO, message }),
      warning: (message: string): void =>
        addToast({ type: NOTIFICATION_TYPE.WARNING, message }),
    }),
    [addToast]
  )
}
