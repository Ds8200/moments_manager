'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './MobileBottomNav.module.scss'
import { NAV_ITEMS } from '@/shared/constants/routes'

export function MobileBottomNav() {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.slice(0, 5)

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
