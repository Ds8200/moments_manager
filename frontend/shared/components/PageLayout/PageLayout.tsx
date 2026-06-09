'use client'
import type { ReactElement } from 'react'
import { usePageLayout } from './usePageLayout'
import type { PageLayoutProps } from './usePageLayout'
import { FiltersBar } from '@/shared/components/FiltersBar/FiltersBar'
import styles from './PageLayout.module.scss'

export const PageLayout = (props: PageLayoutProps): ReactElement => {
  const { title, actionLabel, onAction, filtersBarProps, children } = usePageLayout(props)

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {actionLabel && (
          <button type="button" className={styles.actionBtn} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      {filtersBarProps && <FiltersBar {...filtersBarProps} />}
      <div className={styles.card}>
        {children}
      </div>
    </div>
  )
}
