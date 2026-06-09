'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminOrg, useUpdateOrg } from '../../queries/useSuperAdminOrgs'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import type { OrgAdminResponse } from '../../types'
import type { OrgEditFormProps } from './OrgEditForm/OrgEditForm'

const PLAN_LABEL: Record<string, string> = {
  trial: SUPER_ADMIN_LABELS.PLAN_TRIAL,
  basic: SUPER_ADMIN_LABELS.PLAN_BASIC,
  professional: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL,
  enterprise: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE,
}

const DATE_FORMAT = new Intl.DateTimeFormat('he-IL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const editSchema = z.object({
  name: z.string().min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED),
  slug: z
    .string()
    .min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED)
    .regex(/^[a-z0-9-]+$/, SUPER_ADMIN_LABELS.VALIDATION_SLUG),
})

export type OrgEditFormValues = z.infer<typeof editSchema>

export interface OrgDetailProps {
  initialOrg: OrgAdminResponse
}

export interface UseOrgDetailReturn {
  org: OrgAdminResponse
  isEditing: boolean
  planLabel: string
  formattedDate: string
  formattedTrialDate: string | null
  onEdit: () => void
  editFormProps: OrgEditFormProps
  labels: {
    back: string
    editBtn: string
    fieldName: string
    fieldSlug: string
    fieldPlan: string
    fieldStatus: string
    statusActive: string
    statusInactive: string
    fieldMembers: string
    fieldCreated: string
    fieldTrialEnds: string
    fieldOwnerEmail: string
  }
}

export const useOrgDetail = ({ initialOrg }: OrgDetailProps): UseOrgDetailReturn => {
  const [isEditing, setIsEditing] = useState(false)

  const { data: org = initialOrg } = useAdminOrg(initialOrg.id, initialOrg)
  const { mutate, isPending } = useUpdateOrg()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrgEditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: org.name, slug: org.slug },
  })

  const onEdit = (): void => {
    reset({ name: org.name, slug: org.slug })
    setIsEditing(true)
  }

  const onCancel = (): void => setIsEditing(false)

  const onSave = (values: OrgEditFormValues): void => {
    mutate({ id: org.id, payload: values }, { onSuccess: () => setIsEditing(false) })
  }

  return {
    org,
    isEditing,
    planLabel: PLAN_LABEL[org.plan] ?? org.plan,
    formattedDate: DATE_FORMAT.format(new Date(org.created_at)),
    formattedTrialDate: org.trial_ends_at
      ? DATE_FORMAT.format(new Date(org.trial_ends_at))
      : null,
    onEdit,
    editFormProps: {
      onSubmit: handleSubmit(onSave),
      onCancel,
      isPending,
      nameInputProps: register('name'),
      slugInputProps: register('slug'),
      nameError: errors.name?.message,
      slugError: errors.slug?.message,
      fieldNameLabel: SUPER_ADMIN_LABELS.FIELD_ORG_NAME,
      fieldSlugLabel: SUPER_ADMIN_LABELS.TABLE_COL_SLUG,
      slugHint: SUPER_ADMIN_LABELS.FIELD_SLUG_HINT,
      saveLabel: SUPER_ADMIN_LABELS.SAVE_CHANGES,
      cancelLabel: SUPER_ADMIN_LABELS.CANCEL_EDIT,
    },
    labels: {
      back: SUPER_ADMIN_LABELS.BACK_TO_ORGS,
      editBtn: SUPER_ADMIN_LABELS.EDIT_ORG_BUTTON,
      fieldName: SUPER_ADMIN_LABELS.FIELD_ORG_NAME,
      fieldSlug: SUPER_ADMIN_LABELS.TABLE_COL_SLUG,
      fieldPlan: SUPER_ADMIN_LABELS.TABLE_COL_PLAN,
      fieldStatus: SUPER_ADMIN_LABELS.TABLE_COL_STATUS,
      statusActive: SUPER_ADMIN_LABELS.STATUS_ACTIVE,
      statusInactive: SUPER_ADMIN_LABELS.STATUS_INACTIVE,
      fieldMembers: SUPER_ADMIN_LABELS.TABLE_COL_MEMBERS,
      fieldCreated: SUPER_ADMIN_LABELS.TABLE_COL_CREATED,
      fieldTrialEnds: SUPER_ADMIN_LABELS.FIELD_PLAN,
      fieldOwnerEmail: SUPER_ADMIN_LABELS.FIELD_OWNER_EMAIL,
    },
  }
}
