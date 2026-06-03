'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { useMobileDrawer } from './useMobileDrawer'
import styles from './MobileDrawer.module.scss'

const LOGOUT_ICON = '🚪'

export const MobileDrawer = (): ReactElement => {
  const { isOpen, pathname, visibleNavItems, logoutLabel, onClose, onLogout } = useMobileDrawer()

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!isOpen}
      >
        <nav className={styles.nav}>
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}
              onClick={onClose}
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
    </>
  )
}
