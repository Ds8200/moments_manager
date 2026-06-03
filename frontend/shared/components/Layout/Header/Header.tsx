'use client'

import type { ReactElement } from 'react'
import { useHeader } from './useHeader'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './Header.module.scss'

export const Header = (): ReactElement => {
  const { greeting, userName, toggleSidebar, profileMenu, onProfileClick } = useHeader()

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.hamburger}
        onClick={toggleSidebar}
        aria-label={UI_LABELS.OPEN_NAV}
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      <p className={styles.greeting}>
        {greeting}{userName !== UI_LABELS.GREETING_FALLBACK ? `, ${userName}` : ''}
      </p>

      <button
        type="button"
        className={styles.profileBtn}
        onClick={onProfileClick}
        aria-label={UI_LABELS.OPEN_PROFILE_MENU}
      >
        👤
      </button>

      <DropdownMenu state={profileMenu.menuState} onClose={profileMenu.closeMenu} />
    </header>
  )
}
