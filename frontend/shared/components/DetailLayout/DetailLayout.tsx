'use client'
import type { ReactElement } from 'react'
import { useDetailLayout } from './useDetailLayout'
import type { DetailLayoutProps } from './useDetailLayout'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import styles from './DetailLayout.module.scss'

export const DetailLayout = (props: DetailLayoutProps): ReactElement => {
  const {
    title,
    backLabel,
    onBack,
    editLabel,
    onEdit,
    deleteLabel,
    onDelete,
    sections,
    isLoading,
    isError,
    errorMessage,
    children,
  } = useDetailLayout(props)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.actions}>
          {onEdit && editLabel && (
            <button type="button" className={styles.editBtn} onClick={onEdit}>
              {editLabel}
            </button>
          )}
          {onDelete && deleteLabel && (
            <button type="button" className={styles.deleteBtn} onClick={onDelete}>
              {deleteLabel}
            </button>
          )}
          <button type="button" className={styles.backBtn} onClick={onBack}>
            {backLabel}
          </button>
        </div>
      </div>

      {isLoading && <PageSkeleton rows={4} />}

      {isError && !isLoading && (
        <ErrorBoundary message={errorMessage} onReset={onBack} />
      )}

      {!isLoading && !isError && (
        <>
          <div className={styles.sections}>
            {sections.map((section, si) => (
              <div key={si} className={styles.card}>
                {section.title && (
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                )}
                <dl className={styles.grid}>
                  {section.fields.map((field, fi) => (
                    <div
                      key={fi}
                      className={field.span === 2 ? styles.fieldSpan2 : styles.field}
                    >
                      <dt className={styles.label}>{field.label}</dt>
                      <dd className={styles.value}>{field.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          {children}
        </>
      )}
    </div>
  )
}
