'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { superAdminApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { SUPER_ADMIN_LABELS } from '../constants/superAdminLabels'
import { userFiltersAtom } from '../store/superAdminAtoms'
import type { OrgActionResponse, OrgOwnerAdminResponse, UserSearchResult } from '../types'
import type { PaginatedResponse } from '@/shared/types/pagination'

export const useAdminOrgUsers = (): UseQueryResult<PaginatedResponse<OrgOwnerAdminResponse>> => {
  const filters = useAtomValue(userFiltersAtom)
  return useQuery({
    queryKey: ['admin', 'org-users', filters],
    queryFn: () => superAdminApi.listOrgUsers(filters),
  })
}

export const useDeleteOrgUser = (): UseMutationResult<OrgActionResponse, Error, string> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (id: string) => superAdminApi.deleteOrgUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'org-users'] })
      notify.success(SUPER_ADMIN_LABELS.USER_DELETED_SUCCESS)
    },
    onError: () => notify.error(SUPER_ADMIN_LABELS.USER_DELETE_ERROR),
  })
}

export const useUserSearch = (query: string): UseQueryResult<UserSearchResult[]> =>
  useQuery({
    queryKey: ['admin', 'user-search', query],
    queryFn: () => superAdminApi.searchUsers(query),
    enabled: query.length >= 1,
    staleTime: 30_000,
  })
