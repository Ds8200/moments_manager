'use client'
import { useAdminOrgs, useToggleOrgStatus } from '../../queries/useSuperAdminOrgs'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { ORG_PLAN } from '../../enums/orgPlanEnums'
import { ROUTES } from '@/shared/constants/routes'
import type { OrgAdminResponse } from '../../types'

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
  toggleActivateLabel: string
  toggleDeactivateLabel: string
  createOrgHref: string
  addOrgLabel: string
  onToggleStatus: (org: OrgRow) => void
}

const PLAN_LABEL: Record<string, string> = {
  [ORG_PLAN.TRIAL]: SUPER_ADMIN_LABELS.PLAN_TRIAL,
  [ORG_PLAN.BASIC]: SUPER_ADMIN_LABELS.PLAN_BASIC,
  [ORG_PLAN.PROFESSIONAL]: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL,
  [ORG_PLAN.ENTERPRISE]: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE,
}

const toRow = (org: OrgAdminResponse): OrgRow => ({
  id: org.id,
  name: org.name,
  slug: org.slug,
  planLabel: PLAN_LABEL[org.plan] ?? org.plan,
  statusLabel: org.is_active ? SUPER_ADMIN_LABELS.STATUS_ACTIVE : SUPER_ADMIN_LABELS.STATUS_INACTIVE,
  memberCount: org.member_count,
  createdAt: org.created_at,
  isActive: org.is_active,
})

export const useOrgsList = (): UseOrgsListReturn => {
  const { data, isLoading, isError } = useAdminOrgs()
  const toggleStatus = useToggleOrgStatus()
  const confirm = useConfirm()

  const onToggleStatus = (org: OrgRow): void => {
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
    toggleActivateLabel: SUPER_ADMIN_LABELS.TOGGLE_ACTIVATE,
    toggleDeactivateLabel: SUPER_ADMIN_LABELS.TOGGLE_DEACTIVATE,
    createOrgHref: ROUTES.SUPER_ADMIN_NEW_ORG,
    addOrgLabel: SUPER_ADMIN_LABELS.ADD_ORG_BUTTON,
    onToggleStatus,
  }
}
