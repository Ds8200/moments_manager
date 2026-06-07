'use client'
import { useEffect, useState, startTransition } from 'react'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { isSysAdminAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

export interface SysAdminGuardProps {
  children: React.ReactNode
}

export interface UseSysAdminGuardReturn {
  checked: boolean
  isAllowed: boolean
}

export const useSysAdminGuard = (): UseSysAdminGuardReturn => {
  const router = useRouter()
  const isSysAdmin = useAtomValue(isSysAdminAtom)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    startTransition(() => setChecked(true))
  }, [])

  useEffect(() => {
    if (checked && !isSysAdmin) {
      router.replace(ROUTES.HOME)
    }
  }, [checked, isSysAdmin, router])

  return { checked, isAllowed: isSysAdmin }
}
