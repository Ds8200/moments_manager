'use client'
import { type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminOrgs, useDeleteOrg, useResetOrgOwnerPassword, useToggleOrgStatus } from '../../queries/useSuperAdminOrgs'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { ORG_PLAN } from '../../enums/orgPlanEnums'
import { ROUTES, ROUTE_ICONS, SUPER_ADMIN_ORG_DETAIL_ROUTE } from '@/shared/constants/routes'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { OrgAdminResponse } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface OrgRow {
  id: string
  name: string
  slug: string
  planLabel: string
  statusLabel: string
  memberCount: number
  createdAt: string
  isActive: boolean
}

export interface UseOrgsListReturn {
  pageTitle: string
  orgs: OrgRow[]
  isLoading: boolean
  isError: boolean
  emptyLabel: string
  colName: string
  colSlug: string
  colPlan: string
  colStatus: string
  colMembers: string
  colCreated: string
  colActions: string
  menuState: DropdownMenuState
  createOrgHref: string
  addOrgLabel: string
  onRowMenuClick: (org: OrgRow, e: MouseEvent<Element>) => void
  closeMenu: () => void
}

const PLAN_LABEL: Record<string, string> = {
  [ORG_PLAN.TRIAL]: SUPER_ADMIN_LABELS.PLAN_TRIAL,
  [ORG_PLAN.BASIC]: SUPER_ADMIN_LABELS.PLAN_BASIC,
  [ORG_PLAN.PROFESSIONAL]: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL,
  [ORG_PLAN.ENTERPRISE]: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE,
}

const DATE_FORMAT = new Intl.DateTimeFormat('he-IL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const toRow = (org: OrgAdminResponse): OrgRow => ({
  id: org.id,
  name: org.name,
  slug: org.slug,
  planLabel: PLAN_LABEL[org.plan] ?? org.plan,
  statusLabel: org.is_active ? SUPER_ADMIN_LABELS.STATUS_ACTIVE : SUPER_ADMIN_LABELS.STATUS_INACTIVE,
  memberCount: org.member_count,
  createdAt: DATE_FORMAT.format(new Date(org.created_at)),
  isActive: org.is_active,
})

export const useOrgsList = (): UseOrgsListReturn => {
  const router = useRouter()
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

  return {
    pageTitle: SUPER_ADMIN_LABELS.PAGE_TITLE,
    orgs: (data?.items ?? []).map(toRow),
    isLoading,
    isError,
    emptyLabel: SUPER_ADMIN_LABELS.EMPTY,
    colName: SUPER_ADMIN_LABELS.TABLE_COL_NAME,
    colSlug: SUPER_ADMIN_LABELS.TABLE_COL_SLUG,
    colPlan: SUPER_ADMIN_LABELS.TABLE_COL_PLAN,
    colStatus: SUPER_ADMIN_LABELS.TABLE_COL_STATUS,
    colMembers: SUPER_ADMIN_LABELS.TABLE_COL_MEMBERS,
    colCreated: SUPER_ADMIN_LABELS.TABLE_COL_CREATED,
    colActions: SUPER_ADMIN_LABELS.TABLE_COL_ACTIONS,
    menuState,
    createOrgHref: ROUTES.SUPER_ADMIN_NEW_ORG,
    addOrgLabel: SUPER_ADMIN_LABELS.ADD_ORG_BUTTON,
    onRowMenuClick,
    closeMenu,
  }
}
