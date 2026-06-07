'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { isSidebarOpenAtom, navItemsAtom } from '@/shared/store/globalAtoms'
import { SUPER_ADMIN_NAV_ITEMS } from '@/shared/constants/routes'
import styles from './SuperAdminLayout.module.scss'

const DESKTOP_BREAKPOINT = 768

export const SuperAdminContentWrapper = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom)
  const setNavItems = useSetAtom(navItemsAtom)

  useEffect(() => {
    setNavItems(SUPER_ADMIN_NAV_ITEMS)
  }, [setNavItems])

  useEffect(() => {
    if (window.innerWidth >= DESKTOP_BREAKPOINT) {
      setIsOpen(true)
    }
  }, [setIsOpen])

  return (
    <div className={`${styles.content} ${!isOpen ? styles.contentExpanded : ''}`}>
      {children}
    </div>
  )
}
