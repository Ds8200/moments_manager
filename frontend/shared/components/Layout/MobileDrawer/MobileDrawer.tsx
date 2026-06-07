'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMobileDrawer, type MobileDrawerProps } from './useMobileDrawer'
import { ROUTES } from '@/shared/constants/routes'
import styles from './MobileDrawer.module.scss'

export const MobileDrawer = (props: MobileDrawerProps): ReactElement => {
  const { isOpen, pathname, visibleNavItems, logoSrc, logoAlt, onClose } = useMobileDrawer(props)

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
        <Link href={ROUTES.HOME} className={styles.logo} onClick={onClose}>
          <Image src={logoSrc} alt={logoAlt} width={140} height={52} priority />
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
      </aside>
    </>
  )
}
