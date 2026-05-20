'use client'

import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/shared/constants/routes'

export function useHeader() {
  const pathname = usePathname()
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.href))
  return { pageTitle: current?.label ?? 'Moments' }
}
