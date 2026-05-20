'use client'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { useMobileBottomNav } from './useMobileBottomNav'
import styles from './MobileBottomNav.module.scss'

export const MobileBottomNav = (): ReactElement => {
  const { visibleItems, pathname } = useMobileBottomNav()

  return (
    <nav className={styles.nav}>
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.item} ${pathname.startsWith(item.href) ? styles.active : ''}`}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.shortLabel ?? item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
