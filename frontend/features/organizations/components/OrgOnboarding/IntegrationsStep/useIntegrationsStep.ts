'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMyOrg, useUpdateMyOrg } from '../../../queries/useOrganizations'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'
import { useNotify } from '@/shared/hooks/useNotify'
import type { OrgUpdatePayload } from '../../../types'

const schema = z.object({
  openai_api_key: z.string().optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.number().int().positive().optional().nullable(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  smtp_from_name: z.string().optional(),
})

type IntegrationsFormValues = z.infer<typeof schema>

export interface IntegrationsStepProps {
  onNext: () => void
  onBack: () => void
}

export interface UseIntegrationsStepReturn {
  register: ReturnType<typeof useForm<IntegrationsFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<IntegrationsFormValues>>['handleSubmit']
  onSubmit: (values: IntegrationsFormValues) => Promise<void>
  isSubmitting: boolean
  onSkip: () => void
  onBack: () => void
  hasOpenaiKey: boolean
  openaiKeyPreview: string | null
  hasSmtpConfig: boolean
}

export const useIntegrationsStep = ({
  onNext,
  onBack,
}: IntegrationsStepProps): UseIntegrationsStepReturn => {
  const { data: org } = useMyOrg()
  const updateOrg = useUpdateMyOrg()
  const notify = useNotify()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IntegrationsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      openai_api_key: '',
      smtp_host: '',
      smtp_port: null,
      smtp_username: '',
      smtp_password: '',
      smtp_from_name: '',
    },
  })

  const onSubmit = async (values: IntegrationsFormValues): Promise<void> => {
    const payload: OrgUpdatePayload = {}
    if (values.openai_api_key) payload.openai_api_key = values.openai_api_key
    if (values.smtp_host) payload.smtp_host = values.smtp_host
    if (values.smtp_port) payload.smtp_port = values.smtp_port
    if (values.smtp_username) {
      payload.smtp_username = values.smtp_username
      payload.smtp_from_email = values.smtp_username
    }
    if (values.smtp_password) payload.smtp_password = values.smtp_password
    if (values.smtp_from_name) payload.smtp_from_name = values.smtp_from_name

    if (Object.keys(payload).length > 0) {
      try {
        await updateOrg.mutateAsync(payload)
        notify.success(ONBOARDING_LABELS.INTEGRATIONS_SAVE_SUCCESS)
      } catch {
        notify.error(ONBOARDING_LABELS.INTEGRATIONS_SAVE_ERROR)
        return
      }
    }
    onNext()
  }

  const onSkip = (): void => {
    onNext()
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    isSubmitting: isSubmitting || updateOrg.isPending,
    onSkip,
    onBack,
    hasOpenaiKey: org?.has_openai_key ?? false,
    openaiKeyPreview: org?.openai_key_preview ?? null,
    hasSmtpConfig: org?.has_smtp_config ?? false,
  }
}
