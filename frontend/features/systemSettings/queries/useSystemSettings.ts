'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { systemSettingsApi } from '../api'
import type {
  MessageResponse,
  SystemOpenAIPayload,
  SystemSettings,
  SystemSmtpPayload,
  SysAdminPasswordPayload,
} from '../types'

const QUERY_KEY = ['system-settings']

export const useSystemSettings = (): UseQueryResult<SystemSettings> =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => systemSettingsApi.getSettings(),
    staleTime: 10 * 60 * 1000,
  })

export const useUpdateSystemSmtp = (): UseMutationResult<SystemSettings, Error, SystemSmtpPayload> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SystemSmtpPayload) => systemSettingsApi.updateSmtp(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export const useUpdateSystemOpenai = (): UseMutationResult<SystemSettings, Error, SystemOpenAIPayload> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SystemOpenAIPayload) => systemSettingsApi.updateOpenai(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export const useChangeSysAdminPassword = (): UseMutationResult<MessageResponse, Error, SysAdminPasswordPayload> =>
  useMutation({
    mutationFn: (payload: SysAdminPasswordPayload) => systemSettingsApi.changePassword(payload),
  })
