'use client'

import Link from 'next/link'
import { useSidebar } from './useSidebar'
import styles from './Sidebar.module.scss'
import { NAV_ITEMS } from '@/shared/constants/routes'

export function Sidebar() {
  const { pathname } = useSidebar()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✦</span>
        <span className={styles.logoText}>Moments</span>
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
