'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAtom } from 'jotai'
import { isSidebarOpenAtom } from '@/shared/store/globalAtoms'
import styles from './AppLayout.module.scss'

const DESKTOP_BREAKPOINT = 768

export const AppContentWrapper = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom)

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
