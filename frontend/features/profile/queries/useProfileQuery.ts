'use client'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { profileApi } from '../api'
import type { UserProfile } from '../types'

export const PROFILE_QUERY_KEY = ['profile'] as const

export const useProfileQuery = (): UseQueryResult<UserProfile> =>
  useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getMe,
    staleTime: 5 * 60 * 1000,
  })
