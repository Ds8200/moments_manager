'use client'
import type { ReactElement } from 'react'
import { useOrderDetailPage } from './useOrderDetailPage'
import { OrderDetailHeader } from './OrderDetailHeader/OrderDetailHeader'
import { OrderDetailInfo } from './OrderDetailInfo/OrderDetailInfo'
import { OrderDetailItems } from './OrderDetailItems/OrderDetailItems'
import { OrderForm } from '../OrderForm/OrderForm'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './OrderDetailPage.module.scss'
import type { OrderDetailPageProps } from './useOrderDetailPage'

export { type OrderDetailPageProps }

export const OrderDetailPage = (props: OrderDetailPageProps): ReactElement => {
  const {
    order,
    isLoading,
    isError,
    refetch,
    formattedTotal,
    formattedCost,
    formattedProfit,
    getFileDownloadUrl,
    sectionSummaryLabel,
    labelTotal,
    labelCost,
    labelProfit,
    sectionNotesLabel,
    sectionFilesLabel,
    attachmentSymbol,
  } = useOrderDetailPage(props)

  if (isLoading) return <PageSkeleton rows={10} />
  if (isError || !order) return <ErrorBoundary message={UI_LABELS.ERROR_LOADING_ORDER_DETAIL} onReset={refetch} />

  return (
    <div className={styles.page}>
      <OrderDetailHeader order={order} />
      <div className={styles.body}>
        <OrderDetailInfo order={order} />
        <OrderDetailItems items={order.items} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{sectionSummaryLabel}</h2>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{labelTotal}</span>
            <span className={styles.summaryValue}>{formattedTotal}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{labelCost}</span>
            <span className={styles.summaryValue}>{formattedCost}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryProfit}`}>
            <span className={styles.summaryLabel}>{labelProfit}</span>
            <span className={styles.summaryValue}>{formattedProfit}</span>
          </div>
        </section>
        {order.notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{sectionNotesLabel}</h2>
            <p className={styles.notes}>{order.notes}</p>
          </section>
        )}
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
      <OrderForm />
    </div>
  )
}
