'use client'
import { type MouseEvent } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { useUsers, useDeleteUser } from '../../queries/useUsers'
import { usersPageAtom } from '../../store/usersAtoms'
import { USERS_LABELS } from '../../constants/usersLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS } from '@/shared/constants/routes'
import { currentUserIdAtom } from '@/features/auth/store/authAtoms'
import type { User } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface UseUsersTableReturn {
  users: User[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  menuState: DropdownMenuState
  onRowClick: (user: User, e: MouseEvent<Element>) => void
  closeMenu: () => void
  onPageChange: (page: number) => void
  emptyIcon: string
}

export const useUsersTable = (): UseUsersTableReturn => {
  const [page, setPage] = useAtom(usersPageAtom)
  const currentUserId = useAtomValue(currentUserIdAtom)
  const deleteUser = useDeleteUser()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useUsers(page)

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${USERS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteUser.mutate(id),
    })
  }

  const onRowClick = (user: User, e: MouseEvent<Element>): void => {
    if (user.id === currentUserId) return
    openMenu(user.full_name, [
      { label: USERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(user.id, user.full_name), variant: 'danger' },
    ], e)
  }

  return {
    users: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    onRowClick,
    closeMenu,
    onPageChange: (next) => setPage(next),
    emptyIcon: ROUTE_ICONS.USERS,
  }
}
