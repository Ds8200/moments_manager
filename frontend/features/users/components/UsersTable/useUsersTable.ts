'use client'
import { useAtom, useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { useUsers, useDeleteUser } from '../../queries/useUsers'
import { usersPageAtom } from '../../store/usersAtoms'
import { USERS_LABELS } from '../../constants/usersLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useTableRowInteraction } from '@/shared/hooks/useTableRowInteraction'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS, USER_DETAIL_ROUTE } from '@/shared/constants/routes'
import { currentUserIdAtom } from '@/features/auth/store/authAtoms'
import type { RowInteractionHandlers } from '@/shared/hooks/useTableRowInteraction'
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
  getRowProps: (user: User) => RowInteractionHandlers
  closeMenu: () => void
  onPageChange: (page: number) => void
  emptyIcon: string
}

export const useUsersTable = (): UseUsersTableReturn => {
  const [page, setPage] = useAtom(usersPageAtom)
  const currentUserId = useAtomValue(currentUserIdAtom)
  const router = useRouter()
  const deleteUser = useDeleteUser()
  const confirm = useConfirm()
  const { menuState, closeMenu, getRowProps } = useTableRowInteraction()

  const { data, isLoading, isError } = useUsers(page)

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${USERS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteUser.mutate(id),
    })
  }

  return {
    users: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    closeMenu,

    getRowProps: (user) => getRowProps({
      onActivate: () => router.push(USER_DETAIL_ROUTE(user.id)),
      menuTitle: user.full_name,
      // no delete action on your own row
      items: user.id === currentUserId ? [] : [
        { label: USERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(user.id, user.full_name), variant: 'danger' as const },
      ],
    }),

    onPageChange: (next) => setPage(next),
    emptyIcon: ROUTE_ICONS.USERS,
  }
}
