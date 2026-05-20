'use client'

import { usePathname } from 'next/navigation'

interface UseSidebarReturn {
  pathname: string
}

export const useSidebar = (): UseSidebarReturn => {
  const pathname = usePathname()
  return { pathname }
}
