'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMobileDrawer } from './useMobileDrawer'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'
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
        <Link href={ROUTES.DASHBOARD} className={styles.logo} onClick={onClose}>
          <Image
            src="/moments_logo.png"
            alt={UI_LABELS.APP_NAME}
            width={140}
            height={52}
            priority
          />
        </Link>
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
