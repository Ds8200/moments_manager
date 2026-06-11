'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMyOrg, useUpdateMyOrg } from '../../../queries/useOrganizations'
import { ORG_SETTINGS_LABELS } from '../../../constants/orgSettingsLabels'
import { useNotify } from '@/shared/hooks/useNotify'
import type { OrgUpdatePayload } from '../../../types'

const aiSchema = z.object({
  openai_api_key: z.string().optional(),
})

const smtpSchema = z.object({
  smtp_host: z.string().optional(),
  smtp_port: z.number().int().positive().optional().nullable(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  smtp_from_name: z.string().optional(),
})

type AiFormValues = z.infer<typeof aiSchema>
type SmtpFormValues = z.infer<typeof smtpSchema>

export interface UseOrgIntegrationsSectionReturn {
  sectionTitle: string
  aiSectionTitle: string
  smtpSectionTitle: string
  aiKeyLabel: string
  aiKeyPlaceholder: string
  aiKeyConfigured: string
  aiKeyNotConfigured: string
  aiKeyPreviewLabel: string
  smtpHostLabel: string
  smtpHostPlaceholder: string
  smtpPortLabel: string
  smtpUsernameLabel: string
  smtpUsernamePlaceholder: string
  smtpPasswordLabel: string
  smtpPasswordPlaceholder: string
  smtpFromNameLabel: string
  smtpFromNamePlaceholder: string
  smtpConfigured: string
  smtpNotConfigured: string
  saveLabel: string
  savingLabel: string
  hasOpenaiKey: boolean
  openaiKeyPreview: string | null
  hasSmtpConfig: boolean
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  aiRegister: ReturnType<typeof useForm<AiFormValues>>['register']
  aiHandleSubmit: ReturnType<typeof useForm<AiFormValues>>['handleSubmit']
  onAiSubmit: (values: AiFormValues) => Promise<void>
  isAiSubmitting: boolean
  smtpRegister: ReturnType<typeof useForm<SmtpFormValues>>['register']
  smtpHandleSubmit: ReturnType<typeof useForm<SmtpFormValues>>['handleSubmit']
  onSmtpSubmit: (values: SmtpFormValues) => Promise<void>
  isSmtpSubmitting: boolean
}

export const useOrgIntegrationsSection = (): UseOrgIntegrationsSectionReturn => {
  const { data: org } = useMyOrg()
  const updateOrg = useUpdateMyOrg()
  const notify = useNotify()

  const {
    register: aiRegister,
    handleSubmit: aiHandleSubmit,
    reset: aiReset,
    formState: { isSubmitting: aiIsSubmitting },
  } = useForm<AiFormValues>({
    resolver: zodResolver(aiSchema),
    defaultValues: { openai_api_key: '' },
  })

  const {
    register: smtpRegister,
    handleSubmit: smtpHandleSubmit,
    reset: smtpReset,
    formState: { isSubmitting: smtpIsSubmitting },
  } = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      smtp_host: '',
      smtp_port: null,
      smtp_username: '',
      smtp_password: '',
      smtp_from_name: '',
    },
  })

  useEffect(() => {
    if (org) {
      smtpReset({
        smtp_host: org.smtp_host ?? '',
        smtp_port: org.smtp_port ?? null,
        smtp_username: org.smtp_username ?? '',
        smtp_password: '',
        smtp_from_name: org.smtp_from_name ?? '',
      })
    }
  }, [org, smtpReset])

  const onAiSubmit = async (values: AiFormValues): Promise<void> => {
    const payload: OrgUpdatePayload = {}
    if (values.openai_api_key !== undefined) {
      payload.openai_api_key = values.openai_api_key || null
    }
    try {
      await updateOrg.mutateAsync(payload)
      aiReset({ openai_api_key: '' })
      notify.success(ORG_SETTINGS_LABELS.INTEGRATIONS_SAVE_SUCCESS)
    } catch {
      notify.error(ORG_SETTINGS_LABELS.INTEGRATIONS_SAVE_ERROR)
    }
  }

  const onSmtpSubmit = async (values: SmtpFormValues): Promise<void> => {
    const payload: OrgUpdatePayload = {
      smtp_host: values.smtp_host || null,
      smtp_port: values.smtp_port || null,
      smtp_username: values.smtp_username || null,
      smtp_from_email: values.smtp_username || null,
      smtp_password: values.smtp_password || null,
      smtp_from_name: values.smtp_from_name || null,
    }
    try {
      await updateOrg.mutateAsync(payload)
      notify.success(ORG_SETTINGS_LABELS.INTEGRATIONS_SAVE_SUCCESS)
    } catch {
      notify.error(ORG_SETTINGS_LABELS.INTEGRATIONS_SAVE_ERROR)
    }
  }

  return {
    sectionTitle: ORG_SETTINGS_LABELS.INTEGRATIONS_SECTION_TITLE,
    aiSectionTitle: ORG_SETTINGS_LABELS.AI_SECTION_TITLE,
    smtpSectionTitle: ORG_SETTINGS_LABELS.SMTP_SECTION_TITLE,
    aiKeyLabel: ORG_SETTINGS_LABELS.AI_KEY_LABEL,
    aiKeyPlaceholder: ORG_SETTINGS_LABELS.AI_KEY_PLACEHOLDER,
    aiKeyConfigured: ORG_SETTINGS_LABELS.AI_KEY_CONFIGURED,
    aiKeyNotConfigured: ORG_SETTINGS_LABELS.AI_KEY_NOT_CONFIGURED,
    aiKeyPreviewLabel: ORG_SETTINGS_LABELS.AI_KEY_PREVIEW_LABEL,
    smtpHostLabel: ORG_SETTINGS_LABELS.SMTP_HOST_LABEL,
    smtpHostPlaceholder: ORG_SETTINGS_LABELS.SMTP_HOST_PLACEHOLDER,
    smtpPortLabel: ORG_SETTINGS_LABELS.SMTP_PORT_LABEL,
    smtpUsernameLabel: ORG_SETTINGS_LABELS.SMTP_USERNAME_LABEL,
    smtpUsernamePlaceholder: ORG_SETTINGS_LABELS.SMTP_USERNAME_PLACEHOLDER,
    smtpPasswordLabel: ORG_SETTINGS_LABELS.SMTP_PASSWORD_LABEL,
    smtpPasswordPlaceholder: ORG_SETTINGS_LABELS.SMTP_PASSWORD_PLACEHOLDER,
    smtpFromNameLabel: ORG_SETTINGS_LABELS.SMTP_FROM_NAME_LABEL,
    smtpFromNamePlaceholder: ORG_SETTINGS_LABELS.SMTP_FROM_NAME_PLACEHOLDER,
    smtpConfigured: ORG_SETTINGS_LABELS.SMTP_CONFIGURED,
    smtpNotConfigured: ORG_SETTINGS_LABELS.SMTP_NOT_CONFIGURED,
    saveLabel: ORG_SETTINGS_LABELS.SAVE,
    savingLabel: ORG_SETTINGS_LABELS.SAVING,
    hasOpenaiKey: org?.has_openai_key ?? false,
    openaiKeyPreview: org?.openai_key_preview ?? null,
    hasSmtpConfig: org?.has_smtp_config ?? false,
    smtpHost: org?.smtp_host ?? null,
    smtpPort: org?.smtp_port ?? null,
    smtpUsername: org?.smtp_username ?? null,
    aiRegister,
    aiHandleSubmit,
    onAiSubmit,
    isAiSubmitting: aiIsSubmitting || updateOrg.isPending,
    smtpRegister,
    smtpHandleSubmit,
    onSmtpSubmit,
    isSmtpSubmitting: smtpIsSubmitting || updateOrg.isPending,
  }
}
