'use client'
import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/routes'

const VISIBLE_ITEM_COUNT = 5

export interface UseMobileBottomNavReturn {
  visibleItems: NavItem[]
  pathname: string
}

export const useMobileBottomNav = (): UseMobileBottomNavReturn => {
  const pathname = usePathname()
  const isAdmin = useAtomValue(isAdminAtom)
  const filteredItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  return {
    visibleItems: filteredItems.slice(0, VISIBLE_ITEM_COUNT),
    pathname,
  }
}
