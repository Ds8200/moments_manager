'use client'

import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import { isSidebarOpenAtom, navItemsAtom } from '@/shared/store/globalAtoms'
import type { NavItem } from '@/shared/constants/routes'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { useAssistantName } from '@/shared/hooks/useAssistantName'
import { useMyOrg } from '@/features/organizations/queries/useOrganizations'
import { resolveLogoUrl } from '@/shared/utils/branding'

export interface SidebarProps {
  logoUrl?: string | null
  logoAlt?: string
}

export interface UseSidebarReturn {
  pathname: string
  visibleNavItems: NavItem[]
  isOpen: boolean
  logoSrc: string
  logoAlt: string
}

export const useSidebar = ({ logoUrl, logoAlt }: SidebarProps): UseSidebarReturn => {
  const pathname = usePathname()
  const isOpen = useAtomValue(isSidebarOpenAtom)
  const rawNavItems = useAtomValue(navItemsAtom)
  const assistantName = useAssistantName()
  const { data: org } = useMyOrg()

  const visibleNavItems = useMemo(
    () => rawNavItems.map((item) => (item.href === ROUTES.AI ? { ...item, label: assistantName } : item)),
    [rawNavItems, assistantName]
  )

  // Prefer client-side org data so the logo updates immediately after upload
  // without requiring a subdomain (x-org-slug). Fall back to the SSR prop which
  // is populated on subdomains via fetchBranding in AppLayout.
  const clientLogoUrl = resolveLogoUrl(org?.logo_path)

  return {
    pathname,
    visibleNavItems,
    isOpen,
    logoSrc: clientLogoUrl ?? logoUrl ?? UI_LABELS.GENERIC_LOGO_SRC,
    logoAlt: logoAlt ?? UI_LABELS.APP_NAME,
  }
}
