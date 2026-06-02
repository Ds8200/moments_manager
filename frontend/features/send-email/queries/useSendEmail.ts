'use client'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { sendEmailApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { SEND_EMAIL_LABELS } from '../constants/sendEmailLabels'
import type { ComposeEmailPayload, ComposeEmailResponse } from '../types'

export const useComposeEmail = (): UseMutationResult<
  ComposeEmailResponse,
  Error,
  ComposeEmailPayload
> => {
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: ComposeEmailPayload) => sendEmailApi.compose(payload),
    onSuccess: (data) =>
      notify.success(`${SEND_EMAIL_LABELS.SENT_SUCCESS} (${data.sent_to})`),
    onError: () => notify.error(SEND_EMAIL_LABELS.SEND_ERROR),
  })
}
