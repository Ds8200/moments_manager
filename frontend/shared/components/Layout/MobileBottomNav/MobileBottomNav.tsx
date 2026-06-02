'use client'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { useMobileBottomNav } from './useMobileBottomNav'
import { MoreMenu } from './MoreMenu/MoreMenu'
import styles from './MobileBottomNav.module.scss'

const MORE_ICON = '☰'

export const MobileBottomNav = (): ReactElement => {
  const { primaryItems, overflowItems, pathname, isMoreOpen, openMore, closeMore, moreLabel } =
    useMobileBottomNav()

  return (
    <>
      <nav className={styles.nav}>
        {primaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${pathname.startsWith(item.href) ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.shortLabel ?? item.label}</span>
          </Link>
        ))}
        <button type="button" className={styles.item} onClick={openMore}>
          <span className={styles.icon}>{MORE_ICON}</span>
          <span className={styles.label}>{moreLabel}</span>
        </button>
      </nav>

      {isMoreOpen && (
        <MoreMenu overflowItems={overflowItems} pathname={pathname} onClose={closeMore} />
      )}
    </>
  )
}
