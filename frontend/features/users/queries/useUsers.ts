'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { usersApi } from '../api'
import type { User, UserFormValues, UsersResponse } from '../types'

export const useUsers = (page = 1, page_size = 20): UseQueryResult<UsersResponse> =>
  useQuery({
    queryKey: ['users', page, page_size],
    queryFn: () => usersApi.list(page, page_size),
  })

export const useCreateUser = (): UseMutationResult<User, Error, UserFormValues> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserFormValues) => usersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteUser = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
