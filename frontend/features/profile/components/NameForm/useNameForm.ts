'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProfileQuery } from '../../queries/useProfileQuery'
import { useUpdateNameMutation } from '../../queries/useUpdateNameMutation'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import type { UpdateNamePayload } from '../../types'

const schema = z.object({
  full_name: z.string().min(1, UI_LABELS.FULL_NAME_LABEL),
})

export interface UseNameFormReturn {
  register: ReturnType<typeof useForm<UpdateNamePayload>>['register']
  handleSubmit: ReturnType<typeof useForm<UpdateNamePayload>>['handleSubmit']
  onSubmit: (values: UpdateNamePayload) => Promise<void>
  errors: ReturnType<typeof useForm<UpdateNamePayload>>['formState']['errors']
  isSubmitting: boolean
  sectionTitle: string
  fieldLabel: string
  saveBtnLabel: string
}

export const useNameForm = (): UseNameFormReturn => {
  const { data: profile } = useProfileQuery()
  const updateName = useUpdateNameMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateNamePayload>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '' },
  })

  useEffect(() => {
    if (profile) reset({ full_name: profile.full_name })
  }, [profile, reset])

  const onSubmit = async (values: UpdateNamePayload): Promise<void> => {
    await updateName.mutateAsync(values)
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting: isSubmitting || updateName.isPending,
    sectionTitle: UI_LABELS.PROFILE_NAME_SECTION,
    fieldLabel: UI_LABELS.FULL_NAME_LABEL,
    saveBtnLabel: UI_LABELS.SAVE_CHANGES,
  }
}
