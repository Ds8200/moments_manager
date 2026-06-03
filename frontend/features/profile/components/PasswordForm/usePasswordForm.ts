'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdatePasswordMutation } from '../../queries/useUpdatePasswordMutation'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import type { UpdatePasswordPayload } from '../../types'

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6),
})

export interface UsePasswordFormReturn {
  register: ReturnType<typeof useForm<UpdatePasswordPayload>>['register']
  handleSubmit: ReturnType<typeof useForm<UpdatePasswordPayload>>['handleSubmit']
  onSubmit: (values: UpdatePasswordPayload) => Promise<void>
  errors: ReturnType<typeof useForm<UpdatePasswordPayload>>['formState']['errors']
  isSubmitting: boolean
  sectionTitle: string
  currentPasswordLabel: string
  newPasswordLabel: string
  saveBtnLabel: string
}

export const usePasswordForm = (): UsePasswordFormReturn => {
  const updatePassword = useUpdatePasswordMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordPayload>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '' },
  })

  const onSubmit = async (values: UpdatePasswordPayload): Promise<void> => {
    await updatePassword.mutateAsync(values)
    reset()
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting: isSubmitting || updatePassword.isPending,
    sectionTitle: UI_LABELS.PROFILE_PASSWORD_SECTION,
    currentPasswordLabel: UI_LABELS.CURRENT_PASSWORD_LABEL,
    newPasswordLabel: UI_LABELS.NEW_PASSWORD_LABEL,
    saveBtnLabel: UI_LABELS.SAVE_CHANGES,
  }
}
