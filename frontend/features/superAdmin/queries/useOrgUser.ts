'use client'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { superAdminApi } from '../api'
import type { OrgOwnerAdminResponse } from '../types'

export const useOrgUser = (id: string | null): UseQueryResult<OrgOwnerAdminResponse> =>
  useQuery({
    queryKey: ['admin', 'org-user', id],
    queryFn: () => superAdminApi.getOrgUser(id!),
    enabled: id !== null,
  })
