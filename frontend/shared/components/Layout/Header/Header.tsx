'use client'

import { useHeader } from './useHeader'
import styles from './Header.module.scss'

export function Header() {
  const { pageTitle } = useHeader()

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{pageTitle}</h1>
    </header>
  )
}
