'use client'
import { useEffect, useState, startTransition } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useRouter, usePathname } from 'next/navigation'
import {
  accessTokenAtom,
  clearTokensAtom,
  initAuthAtom,
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
