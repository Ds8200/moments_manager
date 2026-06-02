'use client'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { authApi } from '@/features/auth/api'
import { clearTokensAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

const REFRESH_TOKEN_KEY = 'refresh_token'

export interface UseLogoutReturn {
  logout: () => Promise<void>
}

export const useLogout = (): UseLogoutReturn => {
  const router = useRouter()
  const clearTokens = useSetAtom(clearTokensAtom)

  const logout = async (): Promise<void> => {
    const refreshToken =
      typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // Best-effort: revoke server-side if possible, but always clear locally.
      }
    }
    clearTokens()
    router.replace(ROUTES.LOGIN)
  }

  return { logout }
}
