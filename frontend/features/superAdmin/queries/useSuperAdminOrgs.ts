'use client'
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { superAdminApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { SUPER_ADMIN_LABELS } from '../constants/superAdminLabels'
import { orgFiltersAtom } from '../store/superAdminAtoms'
import type { OrgActionResponse, OrgAdminResponse, OrgCreatePayload, OrgStatusUpdatePayload, OrgUpdatePayload } from '../types'
import type { PaginatedResponse } from '@/shared/types/pagination'

export const useAdminOrgs = (): UseQueryResult<PaginatedResponse<OrgAdminResponse>> => {
  const filters = useAtomValue(orgFiltersAtom)
  return useQuery({
    queryKey: ['admin', 'orgs', filters],
    queryFn: () => superAdminApi.listOrgs(filters),
  })
}

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

export const useAdminOrg = (
  id: string,
  initialData: OrgAdminResponse,
): UseQueryResult<OrgAdminResponse> =>
  useQuery({
    queryKey: ['admin', 'org', id],
    queryFn: () => superAdminApi.getOrg(id),
    initialData,
  })

export const useUpdateOrg = (): UseMutationResult<
  OrgAdminResponse,
  Error,
  { id: string; payload: OrgUpdatePayload }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, payload }) => superAdminApi.updateOrg(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'org', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['admin', 'orgs'] })
      notify.success(SUPER_ADMIN_LABELS.ORG_UPDATED_SUCCESS)
    },
    onError: () => notify.error(SUPER_ADMIN_LABELS.ORG_UPDATE_ERROR),
  })
}

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

export const useDeleteOrg = (): UseMutationResult<OrgActionResponse, Error, string> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => superAdminApi.deleteOrg(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orgs'] })
      notify.success(SUPER_ADMIN_LABELS.ORG_DELETED_SUCCESS)
    },
    onError: () => notify.error(SUPER_ADMIN_LABELS.ORG_DELETE_ERROR),
  })
}

export const useResetOrgOwnerPassword = (): UseMutationResult<OrgActionResponse, Error, string> => {
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => superAdminApi.resetOrgOwnerPassword(id),
    onSuccess: () => notify.success(SUPER_ADMIN_LABELS.ORG_PASSWORD_RESET_SUCCESS),
    onError: () => notify.error(SUPER_ADMIN_LABELS.ORG_PASSWORD_RESET_ERROR),
  })
}
