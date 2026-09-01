'use client'
import type { ReactElement } from 'react'
import { usePageLayout } from './usePageLayout'
import type { PageLayoutProps } from './usePageLayout'
import styles from './PageLayout.module.scss'

// Generic shell for every list page: title + primary action pinned at top (title on the
// inline-start side, action on the inline-end side — RTL puts that right/left automatically),
// an optional filters row pinned right below it, and a content area that fills the rest of the
// viewport. The content area itself never scrolls — a child like DataTable is expected to be
// the one bounded box inside it that scrolls its own rows, so the header/filters/table-head/
// pagination all stay in view.
export const PageLayout = (props: PageLayoutProps): ReactElement => {
  const { title, showAction, actionLabel, onAction, filters, children } = usePageLayout(props)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {showAction && (
          <button type="button" className={styles.actionBtn} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>

      {filters && <div className={styles.filters}>{filters}</div>}

      <div className={styles.content}>{children}</div>
    </div>
  )
}
