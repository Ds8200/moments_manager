'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSystemSettings, useUpdateSystemOpenai } from '../../../queries/useSystemSettings'
import { SYSTEM_SETTINGS_LABELS } from '../../../constants/systemSettingsLabels'
import { useNotify } from '@/shared/hooks/useNotify'

const schema = z.object({
  platform_openai_api_key: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export interface UseSystemOpenAISectionReturn {
  sectionTitle: string
  keyLabel: string
  keyPlaceholder: string
  configuredLabel: string
  notConfiguredLabel: string
  keyPreviewLabel: string
  saveLabel: string
  savingLabel: string
  hasOpenaiKey: boolean
  openaiKeyPreview: string | null
  register: ReturnType<typeof useForm<FormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<FormValues>>['handleSubmit']
  onSubmit: (values: FormValues) => Promise<void>
  isSubmitting: boolean
}

export const useSystemOpenAISection = (): UseSystemOpenAISectionReturn => {
  const { data: settings } = useSystemSettings()
  const updateOpenai = useUpdateSystemOpenai()
  const notify = useNotify()

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { platform_openai_api_key: '' },
  })

  const onSubmit = async (values: FormValues): Promise<void> => {
    try {
      await updateOpenai.mutateAsync({
        platform_openai_api_key: values.platform_openai_api_key || null,
      })
      reset({ platform_openai_api_key: '' })
      notify.success(SYSTEM_SETTINGS_LABELS.OPENAI_SAVE_SUCCESS)
    } catch {
      notify.error(SYSTEM_SETTINGS_LABELS.OPENAI_SAVE_ERROR)
    }
  }

  return {
    sectionTitle: SYSTEM_SETTINGS_LABELS.OPENAI_SECTION_TITLE,
    keyLabel: SYSTEM_SETTINGS_LABELS.OPENAI_KEY_LABEL,
    keyPlaceholder: SYSTEM_SETTINGS_LABELS.OPENAI_KEY_PLACEHOLDER,
    configuredLabel: SYSTEM_SETTINGS_LABELS.OPENAI_KEY_CONFIGURED,
    notConfiguredLabel: SYSTEM_SETTINGS_LABELS.OPENAI_KEY_NOT_CONFIGURED,
    keyPreviewLabel: SYSTEM_SETTINGS_LABELS.OPENAI_KEY_PREVIEW_LABEL,
    saveLabel: SYSTEM_SETTINGS_LABELS.SAVE,
    savingLabel: SYSTEM_SETTINGS_LABELS.SAVING,
    hasOpenaiKey: settings?.has_openai_key ?? false,
    openaiKeyPreview: settings?.openai_key_preview ?? null,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting: isSubmitting || updateOpenai.isPending,
  }
}
