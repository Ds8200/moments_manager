'use client'
import { type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import {
  useAdminOrgs,
  useDeleteOrg,
  useResetOrgOwnerPassword,
  useToggleOrgStatus,
} from '../../queries/useSuperAdminOrgs'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { editingOrgIdAtom, isOrgFormOpenAtom, orgFiltersAtom } from '../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { ORG_PLAN } from '../../enums/orgPlanEnums'
import { ROUTE_ICONS, SUPER_ADMIN_ORG_DETAIL_ROUTE } from '@/shared/constants/routes'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { OrgAdminResponse } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { PaginationLabels } from '@/shared/components/DataTable/useDataTable'

export interface OrgRow {
  id: string
  orgNumber: string
  name: string
  slug: string
  ownerEmail: string
  planLabel: string
  statusLabel: string
  memberCount: number
  createdAt: string
  isActive: boolean
}

export interface UseOrgsTabReturn {
  rows: OrgRow[]
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
  onRowMenuClick: (org: OrgRow, e: MouseEvent<Element>) => void
}

const PLAN_LABEL: Record<string, string> = {
  [ORG_PLAN.TRIAL]: SUPER_ADMIN_LABELS.PLAN_TRIAL,
  [ORG_PLAN.BASIC]: SUPER_ADMIN_LABELS.PLAN_BASIC,
  [ORG_PLAN.PROFESSIONAL]: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL,
  [ORG_PLAN.ENTERPRISE]: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE,
}

const DATE_FMT = new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const toRow = (org: OrgAdminResponse): OrgRow => ({
  id: org.id,
  orgNumber: org.org_number,
  name: org.name,
  slug: org.slug,
  ownerEmail: org.owner_email,
  planLabel: PLAN_LABEL[org.plan] ?? org.plan,
  statusLabel: org.is_active ? SUPER_ADMIN_LABELS.STATUS_ACTIVE : SUPER_ADMIN_LABELS.STATUS_INACTIVE,
  memberCount: org.member_count,
  createdAt: DATE_FMT.format(new Date(org.created_at)),
  isActive: org.is_active,
})

export const useOrgsTab = (): UseOrgsTabReturn => {
  const router = useRouter()
  const [filters, setFilters] = useAtom(orgFiltersAtom)
  const setIsOrgFormOpen = useSetAtom(isOrgFormOpenAtom)
  const setEditingOrgId = useSetAtom(editingOrgIdAtom)

  const { data, isLoading, isError } = useAdminOrgs()
  const toggleStatus = useToggleOrgStatus()
  const deleteOrg = useDeleteOrg()
  const resetPassword = useResetOrgOwnerPassword()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const handleToggle = (org: OrgRow): void => {
    if (org.isActive) {
      confirm({
        message: SUPER_ADMIN_LABELS.CONFIRM_DEACTIVATE,
        isDangerous: true,
        onConfirm: () => toggleStatus.mutate({ id: org.id, payload: { is_active: false } }),
      })
    } else {
      toggleStatus.mutate({ id: org.id, payload: { is_active: true } })
    }
  }

  const handleDelete = (org: OrgRow): void => {
    confirm({
      message: SUPER_ADMIN_LABELS.CONFIRM_DELETE,
      isDangerous: true,
      onConfirm: () => deleteOrg.mutate(org.id),
    })
  }

  const handleResetPassword = (org: OrgRow): void => {
    confirm({
      message: SUPER_ADMIN_LABELS.CONFIRM_RESET_PASSWORD,
      isDangerous: false,
      onConfirm: () => resetPassword.mutate(org.id),
    })
  }

  const onRowMenuClick = (org: OrgRow, e: MouseEvent<Element>): void => {
    openMenu(org.name, [
      {
        label: SUPER_ADMIN_LABELS.MENU_DETAILS,
        icon: UI_SYMBOLS.DETAILS,
        onClick: () => router.push(SUPER_ADMIN_ORG_DETAIL_ROUTE(org.id)),
      },
      {
        label: SUPER_ADMIN_LABELS.MENU_EDIT,
        icon: UI_SYMBOLS.EDIT,
        onClick: () => {
          setEditingOrgId(org.id)
          setIsOrgFormOpen(true)
        },
      },
      {
        label: org.isActive ? SUPER_ADMIN_LABELS.MENU_DISABLE : SUPER_ADMIN_LABELS.MENU_ENABLE,
        icon: ROUTE_ICONS.ORGS,
        onClick: () => handleToggle(org),
      },
      {
        label: SUPER_ADMIN_LABELS.MENU_RESET_PASSWORD,
        icon: UI_SYMBOLS.KEY,
        onClick: () => handleResetPassword(org),
      },
      {
        label: SUPER_ADMIN_LABELS.MENU_DELETE,
        icon: UI_SYMBOLS.DELETE,
        onClick: () => handleDelete(org),
        variant: 'danger',
      },
    ], e)
  }

  const filtersBarProps: FiltersBarProps = {
    searchValue: filters.search,
    searchPlaceholder: SUPER_ADMIN_LABELS.FILTER_SEARCH_PLACEHOLDER,
    onSearchChange: (search) => setFilters((f) => ({ ...f, search, page: 1 })),
    selects: [
      {
        value: filters.plan,
        options: [
          { value: '', label: SUPER_ADMIN_LABELS.FILTER_ALL_PLANS },
          { value: ORG_PLAN.TRIAL, label: SUPER_ADMIN_LABELS.PLAN_TRIAL },
          { value: ORG_PLAN.BASIC, label: SUPER_ADMIN_LABELS.PLAN_BASIC },
          { value: ORG_PLAN.PROFESSIONAL, label: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL },
          { value: ORG_PLAN.ENTERPRISE, label: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE },
        ],
        onChange: (plan) => setFilters((f) => ({ ...f, plan, page: 1 })),
      },
      {
        value: filters.is_active,
        options: [
          { value: '', label: SUPER_ADMIN_LABELS.FILTER_ALL_STATUSES },
          { value: 'true', label: SUPER_ADMIN_LABELS.FILTER_ACTIVE },
          { value: 'false', label: SUPER_ADMIN_LABELS.FILTER_INACTIVE },
        ],
        onChange: (is_active) => setFilters((f) => ({ ...f, is_active, page: 1 })),
      },
    ],
    newButtonLabel: SUPER_ADMIN_LABELS.ADD_ORG_BUTTON,
    onNew: () => {
      setEditingOrgId(null)
      setIsOrgFormOpen(true)
    },
  }

  return {
    rows: (data?.items ?? []).map(toRow),
    headers: [
      SUPER_ADMIN_LABELS.TABLE_COL_ORG_NUMBER,
      SUPER_ADMIN_LABELS.TABLE_COL_NAME,
      SUPER_ADMIN_LABELS.TABLE_COL_SLUG,
      SUPER_ADMIN_LABELS.TABLE_COL_OWNER_EMAIL,
      SUPER_ADMIN_LABELS.TABLE_COL_PLAN,
      SUPER_ADMIN_LABELS.TABLE_COL_STATUS,
      SUPER_ADMIN_LABELS.TABLE_COL_MEMBERS,
      SUPER_ADMIN_LABELS.TABLE_COL_CREATED,
      SUPER_ADMIN_LABELS.TABLE_COL_ACTIONS,
    ],
    isLoading,
    isError,
    emptyTitle: SUPER_ADMIN_LABELS.EMPTY_ORGS,
    emptyIcon: ROUTE_ICONS.ORGS,
    errorTitle: SUPER_ADMIN_LABELS.ERROR_LOAD,
    currentPage: filters.page,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    paginationLabels: {
      totalPrefix: SUPER_ADMIN_LABELS.PAGINATION_TOTAL_PREFIX,
      totalSuffix: SUPER_ADMIN_LABELS.PAGINATION_ORGS_SUFFIX,
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
