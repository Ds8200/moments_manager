'use client'
import { useEffect, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useRouter, usePathname } from 'next/navigation'
import { accessTokenAtom, initAuthAtom } from '@/features/auth/store/authAtoms'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ROUTES } from '@/shared/constants/routes'

export interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [accessToken] = useAtom(accessTokenAtom)
  const initAuth = useSetAtom(initAuthAtom)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    initAuth()
    setChecked(true)
  }, [initAuth])

  useEffect(() => {
    if (checked && accessToken === null && pathname !== ROUTES.LOGIN) {
      router.replace(ROUTES.LOGIN)
    }
  }, [checked, accessToken, pathname, router])

  if (!checked) return <PageSkeleton rows={6} />
  if (accessToken === null) return null

  return <>{children}</>
}
