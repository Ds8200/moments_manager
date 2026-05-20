'use client'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/shared/constants/routes'

const VISIBLE_ITEM_COUNT = 5

export interface UseMobileBottomNavReturn {
  visibleItems: typeof NAV_ITEMS
  pathname: string
}

export const useMobileBottomNav = (): UseMobileBottomNavReturn => {
  const pathname = usePathname()
  return {
    visibleItems: NAV_ITEMS.slice(0, VISIBLE_ITEM_COUNT),
    pathname,
  }
}
