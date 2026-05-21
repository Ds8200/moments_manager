'use client'
import type { ReactElement } from 'react'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { useAuthGuard, type AuthGuardProps } from './useAuthGuard'

export const AuthGuard = ({ children }: AuthGuardProps): ReactElement | null => {
  const { checked, isAuthenticated } = useAuthGuard()

  if (!checked) return <PageSkeleton rows={6} />
  if (!isAuthenticated) return null

  return <>{children}</>
}
