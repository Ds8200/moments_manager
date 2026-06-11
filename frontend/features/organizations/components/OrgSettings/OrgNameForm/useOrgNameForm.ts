'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMyOrg, useUpdateMyOrg } from '../../../queries/useOrganizations'
import { ORG_SETTINGS_LABELS } from '../../../constants/orgSettingsLabels'

const schema = z.object({
  name: z.string().min(1, ORG_SETTINGS_LABELS.NAME_REQUIRED),
})

export interface OrgNameFormValues {
  name: string
}

export interface UseOrgNameFormReturn {
  register: ReturnType<typeof useForm<OrgNameFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<OrgNameFormValues>>['handleSubmit']
  onSubmit: (values: OrgNameFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<OrgNameFormValues>>['formState']['errors']
  isSubmitting: boolean
  sectionTitle: string
  fieldLabel: string
  saveBtnLabel: string
  savingBtnLabel: string
}

export const useOrgNameForm = (): UseOrgNameFormReturn => {
  const { data: org } = useMyOrg()
  const updateOrg = useUpdateMyOrg()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrgNameFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (org) reset({ name: org.name })
  }, [org, reset])

  const onSubmit = async (values: OrgNameFormValues): Promise<void> => {
    await updateOrg.mutateAsync(values)
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting: isSubmitting || updateOrg.isPending,
    sectionTitle: ORG_SETTINGS_LABELS.NAME_SECTION_TITLE,
    fieldLabel: ORG_SETTINGS_LABELS.NAME_LABEL,
    saveBtnLabel: ORG_SETTINGS_LABELS.SAVE,
    savingBtnLabel: ORG_SETTINGS_LABELS.SAVING,
  }
}
