'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSidebar, type SidebarProps } from './useSidebar'
import { ROUTES } from '@/shared/constants/routes'
import styles from './Sidebar.module.scss'

export const Sidebar = (props: SidebarProps): ReactElement => {
  const { pathname, visibleNavItems, isOpen, logoSrc, logoAlt } = useSidebar(props)

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <Link href={ROUTES.HOME} className={styles.logo}>
        <Image src={logoSrc} alt={logoAlt} width={160} height={60} priority />
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
