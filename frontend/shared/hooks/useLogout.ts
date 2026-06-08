'use client'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { authApi } from '@/features/auth/api'
import { clearTokensAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

export interface UseLogoutReturn {
  logout: () => Promise<void>
}

export const useLogout = (): UseLogoutReturn => {
  const router = useRouter()
  const clearTokens = useSetAtom(clearTokensAtom)

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch {
      // Best-effort: revoke server-side if possible, but always clear locally.
    }
    clearTokens()
    router.replace(ROUTES.LOGIN)
  }

  return { logout }
}
