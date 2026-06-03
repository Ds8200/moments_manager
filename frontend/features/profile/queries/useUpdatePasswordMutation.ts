'use client'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { profileApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import type { UpdatePasswordPayload, UserProfile } from '../types'

export const useUpdatePasswordMutation = (): UseMutationResult<
  UserProfile,
  Error,
  UpdatePasswordPayload
> => {
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => profileApi.updatePassword(payload),
    onSuccess: () => notify.success(UI_LABELS.PROFILE_UPDATED_SUCCESS),
    onError: () => notify.error(UI_LABELS.PROFILE_WRONG_PASSWORD),
  })
}
