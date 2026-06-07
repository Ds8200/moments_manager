'use client'
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import { superAdminApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { SUPER_ADMIN_LABELS } from '../constants/superAdminLabels'
import type { OrgAdminResponse, OrgStatusUpdatePayload } from '../types'
import type { PaginatedResponse } from '@/shared/types/pagination'

export const useAdminOrgs = (page = 1): UseQueryResult<PaginatedResponse<OrgAdminResponse>> =>
  useQuery({
    queryKey: ['admin', 'orgs', page],
    queryFn: () => superAdminApi.listOrgs(page),
  })

export const useToggleOrgStatus = (): UseMutationResult<
  OrgAdminResponse,
  Error,
  { id: string; payload: OrgStatusUpdatePayload }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }) => superAdminApi.updateOrgStatus(id, payload),
    onSuccess: (_, { payload }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orgs'] })
      notify.success(
        payload.is_active
          ? SUPER_ADMIN_LABELS.ORG_ACTIVATED_SUCCESS
          : SUPER_ADMIN_LABELS.ORG_DEACTIVATED_SUCCESS,
      )
    },
    onError: () => notify.error(SUPER_ADMIN_LABELS.ORG_STATUS_ERROR),
  })
}
