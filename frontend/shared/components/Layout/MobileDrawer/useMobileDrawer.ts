'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { usePathname } from 'next/navigation'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { isSidebarOpenAtom } from '@/shared/store/globalAtoms'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/routes'

export interface UseMobileDrawerReturn {
  isOpen: boolean
  pathname: string
  visibleNavItems: NavItem[]
  onClose: () => void
}

export const useMobileDrawer = (): UseMobileDrawerReturn => {
  const isOpen = useAtomValue(isSidebarOpenAtom)
  const setOpen = useSetAtom(isSidebarOpenAtom)
  const pathname = usePathname()
  const isAdmin = useAtomValue(isAdminAtom)

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return {
    isOpen,
    pathname,
    visibleNavItems,
    onClose: () => setOpen(false),
  }
}
