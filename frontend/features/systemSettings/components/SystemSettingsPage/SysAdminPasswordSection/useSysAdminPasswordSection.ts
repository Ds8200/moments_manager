'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useChangeSysAdminPassword } from '../../../queries/useSystemSettings'
import { SYSTEM_SETTINGS_LABELS } from '../../../constants/systemSettingsLabels'
import { useNotify } from '@/shared/hooks/useNotify'

const schema = z.object({
  current_password: z.string().min(1, SYSTEM_SETTINGS_LABELS.PASSWORD_REQUIRED),
  new_password: z.string().min(8, SYSTEM_SETTINGS_LABELS.NEW_PASSWORD_MIN),
})

type FormValues = z.infer<typeof schema>

export interface UseSysAdminPasswordSectionReturn {
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

export const useSysAdminPasswordSection = (): UseSysAdminPasswordSectionReturn => {
  const changePassword = useChangeSysAdminPassword()
  const notify = useNotify()

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
      await changePassword.mutateAsync({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      reset()
      notify.success(SYSTEM_SETTINGS_LABELS.PASSWORD_CHANGE_SUCCESS)
    } catch {
      notify.error(SYSTEM_SETTINGS_LABELS.PASSWORD_CHANGE_ERROR)
    }
  }

  return {
    sectionTitle: SYSTEM_SETTINGS_LABELS.PASSWORD_SECTION_TITLE,
    currentPasswordLabel: SYSTEM_SETTINGS_LABELS.CURRENT_PASSWORD_LABEL,
    newPasswordLabel: SYSTEM_SETTINGS_LABELS.NEW_PASSWORD_LABEL,
    saveLabel: SYSTEM_SETTINGS_LABELS.SAVE,
    savingLabel: SYSTEM_SETTINGS_LABELS.SAVING,
    currentPasswordError: errors.current_password?.message,
    newPasswordError: errors.new_password?.message,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting: isSubmitting || changePassword.isPending,
  }
}
