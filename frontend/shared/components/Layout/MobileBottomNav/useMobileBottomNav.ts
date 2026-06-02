'use client'
import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { NAV_ITEMS, type NavItem } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'

const PRIMARY_ITEM_COUNT = 4

export interface UseMobileBottomNavReturn {
  primaryItems: NavItem[]
  overflowItems: NavItem[]
  pathname: string
  isMoreOpen: boolean
  openMore: () => void
  closeMore: () => void
  moreLabel: string
}

export const useMobileBottomNav = (): UseMobileBottomNavReturn => {
  const pathname = usePathname()
  const isAdmin = useAtomValue(isAdminAtom)
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false)

  const filteredItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return {
    primaryItems: filteredItems.slice(0, PRIMARY_ITEM_COUNT),
    overflowItems: filteredItems.slice(PRIMARY_ITEM_COUNT),
    pathname,
    isMoreOpen,
    openMore: () => setIsMoreOpen(true),
    closeMore: () => setIsMoreOpen(false),
    moreLabel: UI_LABELS.MORE,
  }
}
