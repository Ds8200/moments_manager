'use client'
import type { ReactElement } from 'react'
import { usePageLayout } from './usePageLayout'
import type { PageLayoutProps } from './usePageLayout'
import styles from './PageLayout.module.scss'

// Generic shell for every list page: title + primary action pinned at top (title on the
// inline-start side, action on the inline-end side — RTL puts that right/left automatically),
// an optional filters row pinned right below it, and a content area that fills the rest of the
// viewport. By default the content area never scrolls itself — a child like DataTable is
// expected to be the one bounded box inside it that scrolls its own rows, so the header/
// filters/table-head/pagination all stay in view. Pass `scrollContent` for pages whose content
// should just scroll normally beneath the pinned header instead.
export const PageLayout = (props: PageLayoutProps): ReactElement => {
  const { title, showAction, actionLabel, onAction, actions, filters, scrollContent, children } =
    usePageLayout(props)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {actions ? (
          <div className={styles.actions}>{actions}</div>
        ) : (
          showAction && (
            <button type="button" className={styles.actionBtn} onClick={onAction}>
              {actionLabel}
            </button>
          )
        )}
      </div>

      {filters && <div className={styles.filters}>{filters}</div>}

      <div className={`${styles.content}${scrollContent ? ` ${styles.contentScroll}` : ''}`}>
        {children}
      </div>
    </div>
  )
}
