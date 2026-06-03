'use client'

import type { ReactNode } from 'react'
import { useAtomValue } from 'jotai'
import { isSidebarOpenAtom } from '@/shared/store/globalAtoms'
import styles from './AppLayout.module.scss'

export const AppContentWrapper = ({ children }: { children: ReactNode }) => {
  const isOpen = useAtomValue(isSidebarOpenAtom)
  return (
    <div className={`${styles.content} ${!isOpen ? styles.contentExpanded : ''}`}>
      {children}
    </div>
  )
}
