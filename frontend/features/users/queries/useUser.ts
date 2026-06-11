'use client'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { usersApi } from '../api'
import type { User } from '../types'

export const useUser = (id: string | null): UseQueryResult<User> =>
  useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: id !== null,
  })
