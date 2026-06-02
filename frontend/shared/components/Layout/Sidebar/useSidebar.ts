'use client'

import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { useLogout } from '@/shared/hooks/useLogout'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface UseSidebarReturn {
  pathname: string
  visibleNavItems: NavItem[]
  logoutLabel: string
  onLogout: () => Promise<void>
}

export const useSidebar = (): UseSidebarReturn => {
  const pathname = usePathname()
  const isAdmin = useAtomValue(isAdminAtom)
  const { logout } = useLogout()
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  return {
    pathname,
    visibleNavItems,
    logoutLabel: UI_LABELS.LOGOUT,
    onLogout: logout,
  }
}
