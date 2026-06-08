'use client'
import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { systemEmailApi } from '../api'
import type { AdminComposePayload, AdminComposeResponse, OrgOwnerEmail } from '../types'

export const useOrgOwners = (): UseQueryResult<OrgOwnerEmail[]> =>
  useQuery({
    queryKey: ['org-owners'],
    queryFn: () => systemEmailApi.getOrgOwners(),
  })

export const useComposeAdminEmail = (): UseMutationResult<AdminComposeResponse, Error, AdminComposePayload> =>
  useMutation({
    mutationFn: (payload: AdminComposePayload) => systemEmailApi.composeAdminEmail(payload),
  })
