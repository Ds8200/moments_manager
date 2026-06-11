import type { Metadata } from 'next'
import { RegistrationForm } from '@/features/registration/components/RegistrationForm/RegistrationForm'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.REGISTER_TITLE }

export default function RegisterPage() {
  return <RegistrationForm />
}
