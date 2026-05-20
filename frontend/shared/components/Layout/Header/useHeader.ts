'use client'

import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'

interface UseHeaderReturn {
  pageTitle: string
}

export const useHeader = (): UseHeaderReturn => {
  const pathname = usePathname()
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.href))
  return { pageTitle: current?.label ?? UI_LABELS.APP_NAME }
}
