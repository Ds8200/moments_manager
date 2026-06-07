'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useInviteMember } from '../../../../queries/useOrganizations'
import { ORG_SETTINGS_LABELS } from '../../../../constants/orgSettingsLabels'
import { ORG_ROLE } from '../../../../enums/orgRoleEnums'
import type { InvitePayload } from '../../../../types'

const schema = z.object({
  email: z.string().min(1, ORG_SETTINGS_LABELS.EMAIL_REQUIRED).email(ORG_SETTINGS_LABELS.EMAIL_INVALID),
  role: z.enum([ORG_ROLE.ADMIN, ORG_ROLE.MEMBER]),
})

const DEFAULT_VALUES: InvitePayload = { email: '', role: ORG_ROLE.MEMBER }

export interface UseInviteMemberFormReturn {
  register: ReturnType<typeof useForm<InvitePayload>>['register']
  handleSubmit: ReturnType<typeof useForm<InvitePayload>>['handleSubmit']
  onSubmit: (values: InvitePayload) => Promise<void>
  errors: ReturnType<typeof useForm<InvitePayload>>['formState']['errors']
  isSubmitting: boolean
  sectionTitle: string
  emailLabel: string
  emailPlaceholder: string
  roleLabel: string
  adminRoleLabel: string
  memberRoleLabel: string
  submitLabel: string
  submittingLabel: string
}

export const useInviteMemberForm = (): UseInviteMemberFormReturn => {
  const inviteMember = useInviteMember()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitePayload>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (values: InvitePayload): Promise<void> => {
    try {
      await inviteMember.mutateAsync(values)
      reset(DEFAULT_VALUES)
    } catch {
      // onError on the mutation handles user notification
    }
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting: isSubmitting || inviteMember.isPending,
    sectionTitle: ORG_SETTINGS_LABELS.INVITE_SECTION_TITLE,
    emailLabel: ORG_SETTINGS_LABELS.EMAIL_LABEL,
    emailPlaceholder: ORG_SETTINGS_LABELS.EMAIL_PLACEHOLDER,
    roleLabel: ORG_SETTINGS_LABELS.ROLE_LABEL,
    adminRoleLabel: ORG_SETTINGS_LABELS.ROLE_ADMIN,
    memberRoleLabel: ORG_SETTINGS_LABELS.ROLE_MEMBER,
    submitLabel: ORG_SETTINGS_LABELS.INVITE_BUTTON,
    submittingLabel: ORG_SETTINGS_LABELS.INVITING,
  }
}
