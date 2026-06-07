'use client'
import { useOrgMembers, useRemoveMember } from '../../../queries/useOrganizations'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { ORG_SETTINGS_LABELS } from '../../../constants/orgSettingsLabels'
import { ORG_ROLE } from '../../../enums/orgRoleEnums'
import type { Member } from '../../../types'

export interface MemberRow {
  id: string
  userId: string
  roleLabel: string
  statusLabel: string
  joinedAt: string | null
}

export interface UseOrgMembersSectionReturn {
  sectionTitle: string
  members: MemberRow[]
  isLoading: boolean
  isError: boolean
  emptyLabel: string
  removeLabel: string
  onRemove: (userId: string) => void
}

const ROLE_LABEL_BY_VALUE: Record<string, string> = {
  [ORG_ROLE.OWNER]: ORG_SETTINGS_LABELS.ROLE_OWNER,
  [ORG_ROLE.ADMIN]: ORG_SETTINGS_LABELS.ROLE_ADMIN,
  [ORG_ROLE.MEMBER]: ORG_SETTINGS_LABELS.ROLE_MEMBER,
}

const toRow = (member: Member): MemberRow => ({
  id: member.id,
  userId: member.user_id,
  roleLabel: ROLE_LABEL_BY_VALUE[member.role] ?? member.role,
  statusLabel: member.is_active ? ORG_SETTINGS_LABELS.STATUS_ACTIVE : ORG_SETTINGS_LABELS.STATUS_INACTIVE,
  joinedAt: member.joined_at,
})

export const useOrgMembersSection = (): UseOrgMembersSectionReturn => {
  const { data: members, isLoading, isError } = useOrgMembers()
  const removeMember = useRemoveMember()
  const confirm = useConfirm()

  const onRemove = (userId: string): void => {
    confirm({
      message: ORG_SETTINGS_LABELS.CONFIRM_REMOVE_MEMBER,
      isDangerous: true,
      onConfirm: () => removeMember.mutate(userId),
    })
  }

  return {
    sectionTitle: ORG_SETTINGS_LABELS.MEMBERS_SECTION_TITLE,
    members: (members ?? []).map(toRow),
    isLoading,
    isError,
    emptyLabel: ORG_SETTINGS_LABELS.MEMBERS_EMPTY,
    removeLabel: ORG_SETTINGS_LABELS.REMOVE_MEMBER,
    onRemove,
  }
}
