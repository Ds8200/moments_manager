'use client'
import { type MouseEvent } from 'react'
import { useAtom } from 'jotai'
import { useAdminOrgUsers, useDeleteOrgUser } from '../../queries/useSuperAdminUsers'
import { useNotify } from '@/shared/hooks/useNotify'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { userFiltersAtom } from '../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS } from '@/shared/constants/routes'
import type { OrgOwnerAdminResponse } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { PaginationLabels } from '@/shared/components/DataTable/useDataTable'

export interface UserRow {
  id: string
  fullName: string
  email: string
  phone: string | null
  orgCount: number
  createdAt: string
}

export interface UseUsersTabReturn {
  rows: UserRow[]
  headers: string[]
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyIcon: string
  errorTitle: string
  currentPage: number
  totalPages: number
  total: number
  paginationLabels: PaginationLabels
  onPageChange: (page: number) => void
  filtersBarProps: FiltersBarProps
  menuState: DropdownMenuState
  closeMenu: () => void
  onRowMenuClick: (user: UserRow, e: MouseEvent<Element>) => void
}

const DATE_FMT = new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const toRow = (u: OrgOwnerAdminResponse): UserRow => ({
  id: u.id,
  fullName: u.full_name,
  email: u.email,
  phone: u.phone,
  orgCount: u.org_count,
  createdAt: DATE_FMT.format(new Date(u.created_at)),
})

export const useUsersTab = (): UseUsersTabReturn => {
  const [filters, setFilters] = useAtom(userFiltersAtom)
  const { data, isLoading, isError } = useAdminOrgUsers()
  const deleteUser = useDeleteOrgUser()
  const notify = useNotify()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const handleDelete = (user: UserRow): void => {
    if (user.orgCount > 0) {
      notify.error(SUPER_ADMIN_LABELS.CANNOT_DELETE_USER_WITH_ORGS)
      return
    }
    confirm({
      message: SUPER_ADMIN_LABELS.CONFIRM_DELETE_USER,
      isDangerous: true,
      onConfirm: () => deleteUser.mutate(user.id),
    })
  }

  const onRowMenuClick = (user: UserRow, e: MouseEvent<Element>): void => {
    openMenu(user.fullName, [
      {
        label: SUPER_ADMIN_LABELS.MENU_DELETE,
        icon: UI_SYMBOLS.DELETE,
        onClick: () => handleDelete(user),
        variant: 'danger',
      },
    ], e)
  }

  const filtersBarProps: FiltersBarProps = {
    searchValue: filters.search,
    searchPlaceholder: SUPER_ADMIN_LABELS.FILTER_SEARCH_PLACEHOLDER,
    onSearchChange: (search) => setFilters((f) => ({ ...f, search, page: 1 })),
  }

  return {
    rows: (data?.items ?? []).map(toRow),
    headers: [
      SUPER_ADMIN_LABELS.TABLE_COL_FULL_NAME,
      SUPER_ADMIN_LABELS.TABLE_COL_OWNER_EMAIL,
      SUPER_ADMIN_LABELS.TABLE_COL_PHONE,
      SUPER_ADMIN_LABELS.TABLE_COL_NUM_BUSINESSES,
      SUPER_ADMIN_LABELS.TABLE_COL_CREATED,
      SUPER_ADMIN_LABELS.TABLE_COL_ACTIONS,
    ],
    isLoading,
    isError,
    emptyTitle: SUPER_ADMIN_LABELS.EMPTY_USERS,
    emptyIcon: ROUTE_ICONS.USERS,
    errorTitle: SUPER_ADMIN_LABELS.ERROR_LOAD,
    currentPage: filters.page,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    paginationLabels: {
      totalPrefix: SUPER_ADMIN_LABELS.PAGINATION_TOTAL_PREFIX,
      totalSuffix: SUPER_ADMIN_LABELS.PAGINATION_USERS_SUFFIX,
      prev: SUPER_ADMIN_LABELS.PAGINATION_PREV,
      next: SUPER_ADMIN_LABELS.PAGINATION_NEXT,
    },
    onPageChange: (page) => setFilters((f) => ({ ...f, page })),
    filtersBarProps,
    menuState,
    closeMenu,
    onRowMenuClick,
  }
}
