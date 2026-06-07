'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { isSidebarOpenAtom, navItemsAtom } from '@/shared/store/globalAtoms'
import { isAdminAtom } from '@/features/auth/store/authAtoms'
import { NAV_ITEMS } from '@/shared/constants/routes'
import styles from './AppLayout.module.scss'

const DESKTOP_BREAKPOINT = 768

export const AppContentWrapper = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom)
  const isAdmin = useAtomValue(isAdminAtom)
  const setNavItems = useSetAtom(navItemsAtom)

  useEffect(() => {
    setNavItems(NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin))
  }, [isAdmin, setNavItems])

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
