'use client'

import { useMemo } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { usePathname } from 'next/navigation'
import { isSidebarOpenAtom, navItemsAtom } from '@/shared/store/globalAtoms'
import type { NavItem } from '@/shared/constants/routes'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { useAssistantName } from '@/shared/hooks/useAssistantName'

export interface MobileDrawerProps {
  logoUrl?: string | null
  logoAlt?: string
}

export interface UseMobileDrawerReturn {
  isOpen: boolean
  pathname: string
  visibleNavItems: NavItem[]
  logoSrc: string
  logoAlt: string
  onClose: () => void
}

export const useMobileDrawer = ({ logoUrl, logoAlt }: MobileDrawerProps): UseMobileDrawerReturn => {
  const isOpen = useAtomValue(isSidebarOpenAtom)
  const setOpen = useSetAtom(isSidebarOpenAtom)
  const pathname = usePathname()
  const rawNavItems = useAtomValue(navItemsAtom)
  const assistantName = useAssistantName()

  const visibleNavItems = useMemo(
    () => rawNavItems.map((item) => (item.href === ROUTES.AI ? { ...item, label: assistantName } : item)),
    [rawNavItems, assistantName]
  )

  return {
    isOpen,
    pathname,
    visibleNavItems,
    logoSrc: logoUrl ?? UI_LABELS.GENERIC_LOGO_SRC,
    logoAlt: logoAlt ?? UI_LABELS.APP_NAME,
    onClose: () => setOpen(false),
  }
}
