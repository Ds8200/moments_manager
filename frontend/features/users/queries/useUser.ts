'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { usersApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { USERS_LABELS } from '../constants/usersLabels'
import type { User, UserFormValues } from '../types'

export const useUser = (id: string | null): UseQueryResult<User> =>
  useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: id !== null,
  })

export const useUpdateUserRole = (): UseMutationResult<
  User,
  Error,
  { id: string; role: UserFormValues['role'] }
> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserFormValues['role'] }) =>
      usersApi.updateRole(id, role),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      notify.success(USERS_LABELS.UPDATED_SUCCESS)
    },
  })
}
