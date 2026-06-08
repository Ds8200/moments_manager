'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSystemSettings, useUpdateSystemSmtp } from '../../../queries/useSystemSettings'
import { SYSTEM_SETTINGS_LABELS } from '../../../constants/systemSettingsLabels'
import { buildSmtpProviderOptions } from '../../../enums/smtpProviderEnums'
import type { SmtpProviderConfig } from '../../../enums/smtpProviderEnums'
import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'
import { useNotify } from '@/shared/hooks/useNotify'

const schema = z.object({
  platform_smtp_host:     z.string().optional(),
  platform_smtp_port:     z.number().int().positive().optional().nullable(),
  platform_smtp_username: z.string().optional(),
  platform_smtp_password: z.string().optional(),
  platform_smtp_from_name: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export interface UseSystemSmtpSectionReturn {
  sectionTitle:       string
  hostLabel:          string
  hostPlaceholder:    string
  portLabel:          string
  usernameLabel:      string
  usernamePlaceholder: string
  passwordLabel:      string
  passwordPlaceholder: string
  fromNameLabel:      string
  fromNamePlaceholder: string
  configuredLabel:    string
  notConfiguredLabel: string
  saveLabel:          string
  savingLabel:        string
  hasSmtpConfig:      boolean
  smtpHost:           string | null
  smtpPort:           number | null
  smtpUsername:       string | null
  hostValue:          string | null
  hostOptions:        AutocompleteOption<SmtpProviderConfig>[]
  onHostChange:       (value: string | null, option: AutocompleteOption<SmtpProviderConfig> | null) => void
  onHostSearch:       (query: string) => void
  onHostFreeText:     (text: string) => void
  register:           ReturnType<typeof useForm<FormValues>>['register']
  handleSubmit:       ReturnType<typeof useForm<FormValues>>['handleSubmit']
  onSubmit:           (values: FormValues) => Promise<void>
  isSubmitting:       boolean
}

export const useSystemSmtpSection = (): UseSystemSmtpSectionReturn => {
  const { data: settings } = useSystemSettings()
  const updateSmtp = useUpdateSystemSmtp()
  const notify = useNotify()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      platform_smtp_host:      '',
      platform_smtp_port:      null,
      platform_smtp_username:  '',
      platform_smtp_password:  '',
      platform_smtp_from_name: '',
    },
  })

  useEffect(() => {
    if (settings) {
      reset({
        platform_smtp_host:      settings.smtp_host ?? '',
        platform_smtp_port:      settings.smtp_port ?? null,
        platform_smtp_username:  settings.smtp_username ?? '',
        platform_smtp_password:  '',
        platform_smtp_from_name: settings.smtp_from_name ?? '',
      })
    }
  }, [settings, reset])

  const [hostSearch, setHostSearch] = useState('')

  const hostValue = watch('platform_smtp_host') || null

  const hostOptions = useMemo<AutocompleteOption<SmtpProviderConfig>[]>(
    () => buildSmtpProviderOptions(hostSearch),
    [hostSearch],
  )

  const onHostChange = useCallback(
    (value: string | null, option: AutocompleteOption<SmtpProviderConfig> | null) => {
      setValue('platform_smtp_host', value ?? '')
      if (option?.data) setValue('platform_smtp_port', option.data.port)
    },
    [setValue],
  )

  const onHostSearch   = useCallback((q: string) => setHostSearch(q), [])
  const onHostFreeText = useCallback((text: string) => setValue('platform_smtp_host', text), [setValue])

  const onSubmit = async (values: FormValues): Promise<void> => {
    try {
      await updateSmtp.mutateAsync({
        platform_smtp_host:      values.platform_smtp_host || null,
        platform_smtp_port:      values.platform_smtp_port || null,
        platform_smtp_username:  values.platform_smtp_username || null,
        platform_smtp_password:  values.platform_smtp_password || null,
        platform_smtp_from_email: values.platform_smtp_username || null,
        platform_smtp_from_name: values.platform_smtp_from_name || null,
      })
      notify.success(SYSTEM_SETTINGS_LABELS.SMTP_SAVE_SUCCESS)
    } catch {
      notify.error(SYSTEM_SETTINGS_LABELS.SMTP_SAVE_ERROR)
    }
  }

  return {
    sectionTitle:       SYSTEM_SETTINGS_LABELS.SMTP_SECTION_TITLE,
    hostLabel:          SYSTEM_SETTINGS_LABELS.SMTP_HOST_LABEL,
    hostPlaceholder:    SYSTEM_SETTINGS_LABELS.SMTP_HOST_PLACEHOLDER,
    portLabel:          SYSTEM_SETTINGS_LABELS.SMTP_PORT_LABEL,
    usernameLabel:      SYSTEM_SETTINGS_LABELS.SMTP_USERNAME_LABEL,
    usernamePlaceholder: SYSTEM_SETTINGS_LABELS.SMTP_USERNAME_PLACEHOLDER,
    passwordLabel:      SYSTEM_SETTINGS_LABELS.SMTP_PASSWORD_LABEL,
    passwordPlaceholder: SYSTEM_SETTINGS_LABELS.SMTP_PASSWORD_PLACEHOLDER,
    fromNameLabel:      SYSTEM_SETTINGS_LABELS.SMTP_FROM_NAME_LABEL,
    fromNamePlaceholder: SYSTEM_SETTINGS_LABELS.SMTP_FROM_NAME_PLACEHOLDER,
    configuredLabel:    SYSTEM_SETTINGS_LABELS.SMTP_CONFIGURED,
    notConfiguredLabel: SYSTEM_SETTINGS_LABELS.SMTP_NOT_CONFIGURED,
    saveLabel:          SYSTEM_SETTINGS_LABELS.SAVE,
    savingLabel:        SYSTEM_SETTINGS_LABELS.SAVING,
    hasSmtpConfig:      settings?.has_smtp_config ?? false,
    smtpHost:           settings?.smtp_host ?? null,
    smtpPort:           settings?.smtp_port ?? null,
    smtpUsername:       settings?.smtp_username ?? null,
    hostValue,
    hostOptions,
    onHostChange,
    onHostSearch,
    onHostFreeText,
    register,
    handleSubmit,
    onSubmit,
    isSubmitting:       isSubmitting || updateSmtp.isPending,
  }
}
