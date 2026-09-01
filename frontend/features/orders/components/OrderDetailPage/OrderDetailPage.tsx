'use client'
import type { ReactElement } from 'react'
import { useOrderDetailPage } from './useOrderDetailPage'
import { RecordDetailHeader } from '@/shared/components/RecordDetailHeader/RecordDetailHeader'
import { OrderDetailInfo } from './OrderDetailInfo/OrderDetailInfo'
import { OrderDetailItems } from './OrderDetailItems/OrderDetailItems'
import { InlineEditField } from '@/shared/components/InlineEditField/InlineEditField'
import { OrderForm } from '../OrderForm/OrderForm'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './OrderDetailPage.module.scss'
import type { OrderDetailPageProps } from './useOrderDetailPage'

export { type OrderDetailPageProps }

export const OrderDetailPage = (props: OrderDetailPageProps): ReactElement => {
  const {
    order,
    isLoading,
    isError,
    refetch,
    backLabel,
    menuTitle,
    menuItems,
    formattedTotal,
    formattedCost,
    formattedProfit,
    getFileDownloadUrl,
    sectionSummaryLabel,
    labelTotal,
    labelCost,
    labelProfit,
    sectionNotesLabel,
    labelNotes,
    onSaveNotes,
    sectionFilesLabel,
    attachmentSymbol,
  } = useOrderDetailPage(props)

  if (isLoading) return <PageSkeleton rows={10} />
  if (isError || !order) return <ErrorBoundary message={UI_LABELS.ERROR_LOADING_ORDER_DETAIL} onReset={refetch} />

  return (
    <div className={styles.page}>
      <RecordDetailHeader
        title={order.order_number}
        subtitle={order.customer_name}
        backLabel={backLabel}
        backHref={ROUTES.ORDERS}
        menuTitle={menuTitle}
        menuItems={menuItems}
      />
      <div className={styles.layout}>
        {/* sidebar comes first so its info/status/totals show above the items table on
            mobile, where the grid collapses to one column */}
        <div className={styles.sidebar}>
          <OrderDetailInfo order={order} />
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{sectionSummaryLabel}</h2>
            <div className={styles.fieldsGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>{labelTotal}</span>
                <span className={styles.summaryValue}>{formattedTotal}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>{labelCost}</span>
                <span className={styles.summaryValue}>{formattedCost}</span>
              </div>
              <div className={`${styles.summaryCard} ${styles.summaryProfit}`}>
                <span className={styles.summaryLabel}>{labelProfit}</span>
                <span className={styles.summaryValue}>{formattedProfit}</span>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.main}>
          <OrderDetailItems orderId={order.id} items={order.items} />
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{sectionNotesLabel}</h2>
            <InlineEditField label={labelNotes} value={order.notes ?? ''} type="textarea" editable onSave={onSaveNotes} />
          </section>
          {order.files.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{sectionFilesLabel}</h2>
              <div className={styles.fileList}>
                {order.files.map((f) => (
                  <a
                    key={f.id}
                    className={styles.fileChip}
                    href={getFileDownloadUrl(f.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {attachmentSymbol} {f.original_name}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <OrderForm />
    </div>
  )
}
