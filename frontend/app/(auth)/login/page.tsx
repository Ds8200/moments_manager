import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm'

export const metadata: Metadata = { title: 'התחברות — Moments' }

export default function LoginPage() {
  return <LoginForm />
}
