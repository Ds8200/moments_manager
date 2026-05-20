'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { useSidebar } from './useSidebar'
import { NAV_ITEMS } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './Sidebar.module.scss'

export const Sidebar = (): ReactElement => {
  const { pathname } = useSidebar()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✦</span>
        <span className={styles.logoText}>{UI_LABELS.APP_NAME}</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
