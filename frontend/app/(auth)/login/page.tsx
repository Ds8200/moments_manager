import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.LOGIN_TITLE }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
