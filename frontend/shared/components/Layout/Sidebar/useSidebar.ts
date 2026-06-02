'use client'

import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/routes'

export interface UseSidebarReturn {
  pathname: string
  visibleNavItems: NavItem[]
}

export const useSidebar = (): UseSidebarReturn => {
  const pathname = usePathname()
  const isAdmin = useAtomValue(isAdminAtom)
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  return { pathname, visibleNavItems }
}
