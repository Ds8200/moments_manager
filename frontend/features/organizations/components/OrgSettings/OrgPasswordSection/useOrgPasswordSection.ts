'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdatePasswordMutation } from '@/features/profile/queries/useUpdatePasswordMutation'
import { ORG_SETTINGS_LABELS } from '../../../constants/orgSettingsLabels'

const schema = z.object({
  current_password: z.string().min(1, ORG_SETTINGS_LABELS.PASSWORD_REQUIRED),
  new_password: z.string().min(8, ORG_SETTINGS_LABELS.PASSWORD_NEW_MIN),
})

type FormValues = z.infer<typeof schema>

export interface UseOrgPasswordSectionReturn {
  sectionTitle: string
  currentPasswordLabel: string
  newPasswordLabel: string
  saveLabel: string
  savingLabel: string
  currentPasswordError: string | undefined
  newPasswordError: string | undefined
  register: ReturnType<typeof useForm<FormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<FormValues>>['handleSubmit']
  onSubmit: (values: FormValues) => Promise<void>
  isSubmitting: boolean
}

export const useOrgPasswordSection = (): UseOrgPasswordSectionReturn => {
  const updatePassword = useUpdatePasswordMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '' },
  })

  const onSubmit = async (values: FormValues): Promise<void> => {
    try {
      await updatePassword.mutateAsync(values)
      reset()
    } catch {
      // mutation's onError handler fires; no duplicate handling needed
    }
  }

  return {
    sectionTitle: ORG_SETTINGS_LABELS.PASSWORD_SECTION_TITLE,
    currentPasswordLabel: ORG_SETTINGS_LABELS.PASSWORD_CURRENT_LABEL,
    newPasswordLabel: ORG_SETTINGS_LABELS.PASSWORD_NEW_LABEL,
    saveLabel: ORG_SETTINGS_LABELS.SAVE,
    savingLabel: ORG_SETTINGS_LABELS.SAVING,
    currentPasswordError: errors.current_password?.message,
    newPasswordError: errors.new_password?.message,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting: isSubmitting || updatePassword.isPending,
  }
}
