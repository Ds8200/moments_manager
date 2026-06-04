'use client'
import { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { accessTokenAtom, isAdminAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

export const useAdminGuard = (): void => {
  const router = useRouter()
  const isAdmin = useAtomValue(isAdminAtom)
  const accessToken = useAtomValue(accessTokenAtom)

  useEffect(() => {
    if (accessToken !== null && !isAdmin) {
      router.replace(ROUTES.HOME)
    }
  }, [isAdmin, accessToken, router])
}
