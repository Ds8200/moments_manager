'use client'
import type { ReactElement } from 'react'
import { useCustomerDetailPage } from './useCustomerDetailPage'
import { RecordDetailHeader } from '@/shared/components/RecordDetailHeader/RecordDetailHeader'
import { InlineEditField } from '@/shared/components/InlineEditField/InlineEditField'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './CustomerDetailPage.module.scss'
import type { CustomerDetailPageProps } from './useCustomerDetailPage'

export { type CustomerDetailPageProps }

export const CustomerDetailPage = (props: CustomerDetailPageProps): ReactElement => {
  const {
    customer, isLoading, isError, refetch,
    backLabel, menuTitle, menuItems,
    sectionInfoLabel, sectionStatsLabel,
    labelName, labelPhone, labelEmail, labelNotes, labelTotalOrders, labelTotalSpent,
    formattedTotalSpent,
    onSaveName, onSavePhone, onSaveEmail, onSaveNotes,
  } = useCustomerDetailPage(props)

  if (isLoading) return <PageSkeleton rows={6} />
  if (isError || !customer) {
    return <ErrorBoundary message={UI_LABELS.ERROR_LOADING_CUSTOMER_DETAIL} onReset={refetch} />
  }

  return (
    <div className={styles.page}>
      <RecordDetailHeader
        title={customer.name}
        backLabel={backLabel}
        backHref={ROUTES.CUSTOMERS}
        menuTitle={menuTitle}
        menuItems={menuItems}
      />
      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{sectionInfoLabel}</h2>
          <InlineEditField label={labelName} value={customer.name} type="text" editable onSave={onSaveName} />
          <InlineEditField label={labelPhone} value={customer.phone ?? ''} type="text" editable onSave={onSavePhone} />
          <InlineEditField label={labelEmail} value={customer.email ?? ''} type="text" editable onSave={onSaveEmail} />
          <InlineEditField label={labelNotes} value={customer.notes ?? ''} type="textarea" editable onSave={onSaveNotes} />
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{sectionStatsLabel}</h2>
          <div className={styles.statsRow}>
            <span className={styles.statsLabel}>{labelTotalOrders}</span>
            <span className={styles.statsValue}>{customer.total_orders}</span>
          </div>
          <div className={styles.statsRow}>
            <span className={styles.statsLabel}>{labelTotalSpent}</span>
            <span className={styles.statsValue}>{formattedTotalSpent}</span>
          </div>
        </section>
      </div>
    </div>
  )
}
