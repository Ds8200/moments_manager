'use client'
import { useOrderDetail } from './useOrderDetail'
import { StatusBadge } from '@/shared/components/StatusBadge/StatusBadge'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import styles from './OrderDetail.module.scss'

export function OrderDetail() {
  const {
    isOpen,
    order,
    isLoading,
    statusOptions,
    onClose,
    onEdit,
    onStatusChange,
    formatAmount,
    formatOrderDate,
  } = useOrderDetail()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.orderNumber}>{order?.order_number}</span>
            <span className={styles.customerName}>{order?.customer_name}</span>
          </div>
          <div>
            <button className={styles.closeBtn} onClick={onEdit} title="ערוך">✏️</button>
            <button className={styles.closeBtn} onClick={onClose} title="סגור">✕</button>
          </div>
        </div>

        {isLoading || !order ? (
          <div className={styles.skeleton}><PageSkeleton rows={5} /></div>
        ) : (
          <div className={styles.body}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>פרטי הזמנה</div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>תאריך</span>
                <span className={styles.metaValue}>{formatOrderDate(order.date)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>יעד</span>
                <span className={styles.metaValue}>{order.target_description ?? '—'}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>סטטוס</span>
                <div>
                  <select
                    className={styles.statusSelect}
                    value={order.status}
                    onChange={(e) => onStatusChange(e.target.value as Parameters<typeof onStatusChange>[0])}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>תשלום</span>
                <StatusBadge status={order.status} />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>פריטים</div>
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
              <div className={styles.sectionTitle}>סיכום</div>
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>סה"כ</span>
                <span className={styles.totalsValue}>{formatAmount(order.total_amount)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>עלות</span>
                <span className={styles.totalsValue}>{formatAmount(order.total_cost)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>רווח</span>
                <span className={`${styles.totalsValue} ${styles.totalProfit}`}>{formatAmount(order.total_profit)}</span>
              </div>
            </div>

            {order.notes && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>הערות</div>
                <p>{order.notes}</p>
              </div>
            )}

            {order.files.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>קבצים</div>
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
  )
}
