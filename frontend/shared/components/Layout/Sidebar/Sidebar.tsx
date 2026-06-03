'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSidebar } from './useSidebar'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './Sidebar.module.scss'

export const Sidebar = (): ReactElement => {
  const { pathname, visibleNavItems, isOpen } = useSidebar()

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <Link href={ROUTES.DASHBOARD} className={styles.logo}>
        <Image
          src="/moments_logo.png"
          alt={UI_LABELS.APP_NAME}
          width={160}
          height={60}
          priority
        />
      </Link>
      <nav className={styles.nav}>
        {visibleNavItems.map((item) => (
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
