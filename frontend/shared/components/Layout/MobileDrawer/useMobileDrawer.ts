'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { usePathname } from 'next/navigation'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { isSidebarOpenAtom } from '@/shared/store/globalAtoms'
import { useLogout } from '@/shared/hooks/useLogout'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface UseMobileDrawerReturn {
  isOpen: boolean
  pathname: string
  visibleNavItems: NavItem[]
  logoutLabel: string
  closeLabel: string
  onClose: () => void
  onLogout: () => Promise<void>
}

export const useMobileDrawer = (): UseMobileDrawerReturn => {
  const isOpen = useAtomValue(isSidebarOpenAtom)
  const setOpen = useSetAtom(isSidebarOpenAtom)
  const pathname = usePathname()
  const isAdmin = useAtomValue(isAdminAtom)
  const { logout } = useLogout()

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  const onClose = (): void => setOpen(false)

  return {
    isOpen,
    pathname,
    visibleNavItems,
    logoutLabel: UI_LABELS.LOGOUT,
    closeLabel: UI_LABELS.CLOSE_NAV,
    onClose,
    onLogout: logout,
  }
}
