'use client'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { useMoreMenu, type MoreMenuProps } from './useMoreMenu'
import styles from './MoreMenu.module.scss'

const LOGOUT_ICON = '🚪'

export const MoreMenu = (props: MoreMenuProps): ReactElement => {
  const { items, pathname, title, logoutLabel, onClose, onLogout } = useMoreMenu(props)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{title}</div>

        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`${styles.row} ${pathname.startsWith(item.href) ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}

        <button type="button" className={styles.logoutBtn} onClick={onLogout}>
          <span className={styles.icon}>{LOGOUT_ICON}</span>
          <span className={styles.label}>{logoutLabel}</span>
        </button>
      </div>
    </div>
  )
}
