'use client'
import type { ReactElement } from 'react'
import { useEffect, useState, startTransition } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useRouter, usePathname } from 'next/navigation'
import { accessTokenAtom, initAuthAtom, clearTokensAtom } from '@/features/auth/store/authAtoms'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ROUTES } from '@/shared/constants/routes'

export interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps): ReactElement | null => {
  const router = useRouter()
  const pathname = usePathname()
  const [accessToken] = useAtom(accessTokenAtom)
  const initAuth = useSetAtom(initAuthAtom)
  const clearTokens = useSetAtom(clearTokensAtom)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    initAuth()
    startTransition(() => setChecked(true))
  }, [initAuth])

  useEffect(() => {
    if (checked && accessToken === null && pathname !== ROUTES.LOGIN) {
      router.replace(ROUTES.LOGIN)
    }
  }, [checked, accessToken, pathname, router])

  useEffect(() => {
    const handleAuthExpired = () => {
      clearTokens()
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [clearTokens])

  if (!checked) return <PageSkeleton rows={6} />
  if (accessToken === null) return null

  return <>{children}</>
}
