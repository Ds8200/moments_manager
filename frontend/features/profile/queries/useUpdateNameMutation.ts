'use client'
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { profileApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { PROFILE_QUERY_KEY } from './useProfileQuery'
import type { UpdateNamePayload, UserProfile } from '../types'

export const useUpdateNameMutation = (): UseMutationResult<UserProfile, Error, UpdateNamePayload> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: UpdateNamePayload) => profileApi.updateName(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      notify.success(UI_LABELS.PROFILE_UPDATED_SUCCESS)
    },
  })
}
