'use client'

import type { ReactElement } from 'react'
import { useHeader } from './useHeader'
import styles from './Header.module.scss'

export const Header = (): ReactElement => {
  const { pageTitle } = useHeader()

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{pageTitle}</h1>
    </header>
  )
}
