'use client'
import type { ReactElement } from 'react'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { useSysAdminGuard, type SysAdminGuardProps } from './useSysAdminGuard'

export const SysAdminGuard = ({ children }: SysAdminGuardProps): ReactElement | null => {
  const { checked, isAllowed } = useSysAdminGuard()

  if (!checked) return <PageSkeleton rows={6} />
  if (!isAllowed) return null

  return <>{children}</>
}
