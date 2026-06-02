'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSidebar } from './useSidebar'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './Sidebar.module.scss'

const LOGOUT_ICON = '🚪'

export const Sidebar = (): ReactElement => {
  const { pathname, visibleNavItems, logoutLabel, onLogout } = useSidebar()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/moments_logo.png"
          alt={UI_LABELS.APP_NAME}
          width={160}
          height={60}
          priority
        />
      </div>
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
      <button type="button" className={styles.logoutBtn} onClick={onLogout}>
        <span className={styles.navIcon}>{LOGOUT_ICON}</span>
        <span className={styles.navLabel}>{logoutLabel}</span>
      </button>
    </aside>
  )
}
