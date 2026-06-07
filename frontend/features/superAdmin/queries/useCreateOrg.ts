'use client'
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { superAdminApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { SUPER_ADMIN_LABELS } from '../constants/superAdminLabels'
import type { OrgAdminResponse, OrgCreatePayload } from '../types'

export const useCreateOrg = (): UseMutationResult<OrgAdminResponse, Error, OrgCreatePayload> => {
  const queryClient = useQueryClient()
  const notify = useNotify()

  return useMutation({
    mutationFn: (payload: OrgCreatePayload) => superAdminApi.createOrg(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orgs'] })
      notify.success(SUPER_ADMIN_LABELS.ORG_CREATED_SUCCESS)
    },
    onError: () => notify.error(SUPER_ADMIN_LABELS.ORG_CREATE_ERROR),
  })
}
