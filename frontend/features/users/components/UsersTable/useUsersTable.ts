'use client'
import { useAtom, useAtomValue } from 'jotai'
import { useUsers, useDeleteUser } from '../../queries/useUsers'
import { usersPageAtom } from '../../store/usersAtoms'
import { USERS_LABELS } from '../../constants/usersLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { currentUserIdAtom } from '@/features/auth/store/authAtoms'
import type { User } from '../../types'

export interface UseUsersTableReturn {
  users: User[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  currentUserId: string | null
  onDelete: (id: string, name: string) => void
  onPageChange: (page: number) => void
}

export const useUsersTable = (): UseUsersTableReturn => {
  const [page, setPage] = useAtom(usersPageAtom)
  const currentUserId = useAtomValue(currentUserIdAtom)
  const deleteUser = useDeleteUser()
  const confirm = useConfirm()

  const { data, isLoading, isError } = useUsers(page)

  return {
    users: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    currentUserId,

    onDelete: (id, name) => {
      confirm({
        message: `${USERS_LABELS.CONFIRM_DELETE} ${name}?`,
        isDangerous: true,
        onConfirm: () => deleteUser.mutate(id),
      })
    },

    onPageChange: (next) => setPage(next),
  }
}
