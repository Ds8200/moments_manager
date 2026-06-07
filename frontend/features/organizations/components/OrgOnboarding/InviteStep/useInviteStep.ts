'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useInviteMember } from '../../../queries/useOrganizations'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'
import { ORG_ROLE } from '../../../enums/orgRoleEnums'
import type { InvitePayload } from '../../../types'

const schema = z.object({
  email: z.string().min(1, ONBOARDING_LABELS.EMAIL_REQUIRED).email(ONBOARDING_LABELS.EMAIL_INVALID),
  role: z.enum([ORG_ROLE.ADMIN, ORG_ROLE.MEMBER]),
})

const DEFAULT_VALUES: InvitePayload = {
  email: '',
  role: ORG_ROLE.MEMBER,
}

export interface InviteStepProps {
  onNext: () => void
  onBack: () => void
}

export interface UseInviteStepReturn {
  register: ReturnType<typeof useForm<InvitePayload>>['register']
  handleSubmit: ReturnType<typeof useForm<InvitePayload>>['handleSubmit']
  onSubmit: (values: InvitePayload) => Promise<void>
  errors: ReturnType<typeof useForm<InvitePayload>>['formState']['errors']
  isSubmitting: boolean
  onSkip: () => void
  onBack: () => void
}

export const useInviteStep = ({ onNext, onBack }: InviteStepProps): UseInviteStepReturn => {
  const inviteMember = useInviteMember()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitePayload>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (values: InvitePayload): Promise<void> => {
    try {
      await inviteMember.mutateAsync(values)
      reset(DEFAULT_VALUES)
      onNext()
    } catch {
      // The failure is surfaced via the mutation's onError notify toast;
      // keep the form open so the user can correct and retry.
    }
  }

  const onSkip = (): void => {
    onNext()
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    onSkip,
    onBack,
  }
}
