'use client'
import type { ReactElement } from 'react'
import { useOrderDetail } from './useOrderDetail'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { InlineSelectField } from '@/shared/components/InlineSelectField/InlineSelectField'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrderDetail.module.scss'
import type { OrderStatus } from '@/shared/enums/statusEnums'
import type { PaymentState } from '@/shared/enums/statusEnums'
import type { UrgencyLevel } from '../../types'

export const OrderDetail = (): ReactElement | null => {
  const {
    isOpen,
    order,
    isLoading,
    statusOptions,
    paymentState,
    paymentOptions,
    urgencyOptions,
    onClose,
    onEdit,
    onStatusChange,
    onPaymentChange,
    onUrgencyChange,
    formatAmount,
    formatOrderDate,
    formatDueDateTime,
  } = useOrderDetail()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.orderNumber}>{order?.order_number}</span>
            <span className={styles.customerName}>{order?.customer_name}</span>
          </div>
          <div>
            <button className={styles.closeBtn} onClick={onEdit} title={ORDERS_LABELS.DETAIL_EDIT_TITLE}>✏️</button>
            <button className={styles.closeBtn} onClick={onClose} title={ORDERS_LABELS.DETAIL_CLOSE_TITLE}>✕</button>
          </div>
        </div>

        {isLoading || !order ? (
          <div className={styles.skeleton}><PageSkeleton rows={5} /></div>
        ) : (
          <div className={styles.body}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{ORDERS_LABELS.DETAIL_SECTION_INFO}</div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>{ORDERS_LABELS.DETAIL_LABEL_DATE}</span>
                <span className={styles.metaValue}>{formatOrderDate(order.date)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>{ORDERS_LABELS.DETAIL_LABEL_TARGET}</span>
                <span className={styles.metaValue}>{formatDueDateTime(order.due_datetime)}</span>
              </div>
              <InlineSelectField
                label={ORDERS_LABELS.DETAIL_LABEL_URGENCY}
                value={order.urgency}
                options={urgencyOptions}
                onChange={(v) => onUrgencyChange(v as UrgencyLevel)}
              />
              <InlineSelectField
                label={ORDERS_LABELS.DETAIL_LABEL_STATUS}
                value={order.status}
                options={statusOptions}
                onChange={(v) => onStatusChange(v as OrderStatus)}
              />
              <InlineSelectField
                label={ORDERS_LABELS.DETAIL_LABEL_PAYMENT}
                value={paymentState}
                options={paymentOptions}
                onChange={(v) => onPaymentChange(v as PaymentState)}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>{ORDERS_LABELS.DETAIL_SECTION_ITEMS}</div>
              {order.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div>
                    <div className={styles.itemName}>{item.product_name}</div>
                    {item.design_notes && (
                      <div className={styles.itemNotes}>{item.design_notes}</div>
                    )}
                  </div>
                  <span className={styles.itemQty}>×{item.quantity}</span>
                  <span className={styles.itemPrice}>{formatAmount(item.total_price)}</span>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>{ORDERS_LABELS.DETAIL_SECTION_SUMMARY}</div>
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>{ORDERS_LABELS.DETAIL_LABEL_TOTAL}</span>
                <span className={styles.totalsValue}>{formatAmount(order.total_amount)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>{ORDERS_LABELS.DETAIL_LABEL_COST}</span>
                <span className={styles.totalsValue}>{formatAmount(order.total_cost)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>{ORDERS_LABELS.DETAIL_LABEL_PROFIT}</span>
                <span className={`${styles.totalsValue} ${styles.totalProfit}`}>{formatAmount(order.total_profit)}</span>
              </div>
            </div>

            {order.notes && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>{ORDERS_LABELS.DETAIL_SECTION_NOTES}</div>
                <p>{order.notes}</p>
              </div>
            )}

            {order.files.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>{ORDERS_LABELS.DETAIL_SECTION_FILES}</div>
                <div>
                  {order.files.map((f) => (
                    <a
                      key={f.id}
                      className={styles.fileChip}
                      href={`/api/v1/orders/${order.id}/files/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📎 {f.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null
}
