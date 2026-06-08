'use client'
import { useEffect, useState, startTransition } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useRouter, usePathname } from 'next/navigation'
import {
  accessTokenAtom,
  clearTokensAtom,
  initAuthAtom,
  isSysAdminAtom,
  currentOrgIdAtom,
} from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

export interface AuthGuardProps {
  children: React.ReactNode
}

export interface UseAuthGuardReturn {
  checked: boolean
  isAuthenticated: boolean
}

export const useAuthGuard = (): UseAuthGuardReturn => {
  const router = useRouter()
  const pathname = usePathname()
  const [accessToken] = useAtom(accessTokenAtom)
  const isSysAdmin = useAtomValue(isSysAdminAtom)
  const currentOrgId = useAtomValue(currentOrgIdAtom)
  const initAuth = useSetAtom(initAuthAtom)
  const clearTokens = useSetAtom(clearTokensAtom)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    void initAuth().then(() => {
      if (!cancelled) startTransition(() => setChecked(true))
    })
    return () => { cancelled = true }
  }, [initAuth])

  useEffect(() => {
    if (!checked) return
    if (accessToken === null) {
      if (pathname !== ROUTES.LOGIN) router.replace(ROUTES.LOGIN)
      return
    }
    if (isSysAdmin && !pathname.startsWith(ROUTES.SUPER_ADMIN_BASE)) {
      router.replace(ROUTES.SUPER_ADMIN_ORGS)
      return
    }
    if (!isSysAdmin && !currentOrgId && pathname !== ROUTES.ONBOARDING) {
      router.replace(ROUTES.ONBOARDING)
    }
  }, [checked, accessToken, isSysAdmin, currentOrgId, pathname, router])

  useEffect(() => {
    const handleAuthExpired = (): void => {
      clearTokens()
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [clearTokens])

  return {
    checked,
    isAuthenticated: accessToken !== null,
  }
}
