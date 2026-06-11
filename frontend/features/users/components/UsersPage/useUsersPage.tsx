'use client'
import { useState, type MouseEvent } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useAdminGuard } from '@/shared/hooks/useAdminGuard'
import { useUsers, useDeleteUser } from '../../queries/useUsers'
import { usersPageAtom, isUserFormOpenAtom } from '../../store/usersAtoms'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { currentUserIdAtom } from '@/features/auth/store/authAtoms'
import { USERS_LABELS, USER_ROLE_VALUES } from '../../constants/usersLabels'
import { ROUTE_ICONS, USER_DETAIL_ROUTE } from '@/shared/constants/routes'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { TableColumn, PaginationLabels } from '@/shared/components/DataTable/useDataTable'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { User } from '../../types'
import styles from './UsersPage.module.scss'

export interface UseUsersPageReturn {
  title: string
  actionLabel: string
  onAction: () => void
  filtersBarProps: FiltersBarProps
  columns: TableColumn<User>[]
  rows: User[]
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  errorTitle: string
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  paginationLabels: PaginationLabels
  onRowLeftClick: (user: User) => void
  onRowRightClick: (user: User, e: MouseEvent<HTMLTableRowElement>) => void
  menuState: DropdownMenuState
  closeMenu: () => void
}

export const useUsersPage = (): UseUsersPageReturn => {
  useAdminGuard()
  const [search, setSearch] = useState('')
  const [page, setPage] = useAtom(usersPageAtom)
  const setFormOpen = useSetAtom(isUserFormOpenAtom)
  const currentUserId = useAtomValue(currentUserIdAtom)
  const router = useRouter()
  const deleteUser = useDeleteUser()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useUsers(page)

  const allRows = data?.items ?? []
  const filteredRows = search
    ? allRows.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allRows

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${USERS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteUser.mutate(id),
    })
  }

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: USERS_LABELS.COL_NAME,
      cell: (u) => <span className={styles.name}>{u.full_name}</span>,
    },
    {
      key: 'email',
      header: USERS_LABELS.COL_EMAIL,
      cell: (u) => <span className={styles.secondary}>{u.email}</span>,
    },
    {
      key: 'role',
      header: USERS_LABELS.COL_ROLE,
      cell: (u) => (
        <span className={u.role === USER_ROLE_VALUES.ADMIN ? styles.roleAdmin : styles.roleUser}>
          {u.role === USER_ROLE_VALUES.ADMIN ? USERS_LABELS.ROLE_ADMIN : USERS_LABELS.ROLE_USER}
        </span>
      ),
    },
    {
      key: 'status',
      header: USERS_LABELS.COL_STATUS,
      cell: (u) => (
        <span className={u.is_active ? styles.statusActive : styles.statusInactive}>
          {u.is_active ? USERS_LABELS.STATUS_ACTIVE : USERS_LABELS.STATUS_INACTIVE}
        </span>
      ),
    },
  ]

  return {
    title: USERS_LABELS.PAGE_TITLE,
    actionLabel: USERS_LABELS.NEW_USER,
    onAction: () => setFormOpen(true),
    filtersBarProps: {
      searchValue: search,
      searchPlaceholder: USERS_LABELS.SEARCH_PLACEHOLDER,
      onSearchChange: setSearch,
    },
    columns,
    rows: filteredRows,
    isLoading,
    isError,
    emptyTitle: USERS_LABELS.EMPTY_TITLE,
    emptyDescription: USERS_LABELS.EMPTY_DESC,
    emptyIcon: ROUTE_ICONS.USERS,
    errorTitle: USERS_LABELS.ERROR_LOAD,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    onPageChange: setPage,
    paginationLabels: {
      totalPrefix: USERS_LABELS.TABLE_TOTAL,
      totalSuffix: USERS_LABELS.TABLE_USERS_SUFFIX,
      prev: USERS_LABELS.PAGE_PREV,
      next: USERS_LABELS.PAGE_NEXT,
    },
    onRowLeftClick: (user) => router.push(USER_DETAIL_ROUTE(user.id)),
    onRowRightClick: (user, e) => {
      if (user.id === currentUserId) return
      openMenu(user.full_name, [
        {
          label: USERS_LABELS.TABLE_DELETE_TITLE,
          icon: UI_SYMBOLS.DELETE,
          onClick: () => onDelete(user.id, user.full_name),
          variant: 'danger',
        },
      ], e)
    },
    menuState,
    closeMenu,
  }
}
