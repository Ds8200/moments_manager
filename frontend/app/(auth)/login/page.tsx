import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.LOGIN_TITLE }

export default function LoginPage() {
  return <LoginForm />
}
