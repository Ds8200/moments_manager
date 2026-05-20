'use client'
import { useOrdersTable } from './useOrdersTable'
import { StatusBadge } from '@/shared/components/StatusBadge/StatusBadge'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrdersTable.module.scss'

export function OrdersTable() {
  const {
    orders,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    onRowClick,
    onEditOrder,
    onDeleteOrder,
    onPageChange,
    formatAmount,
    formatDate,
    getPaymentLabel,
  } = useOrdersTable()

  if (isLoading) return <PageSkeleton rows={8} />

  if (isError) return (
    <EmptyState title={ORDERS_LABELS.ERROR} description="" icon="⚠️" />
  )

  if (orders.length === 0) return (
    <EmptyState
      title={ORDERS_LABELS.EMPTY_TITLE}
      description={ORDERS_LABELS.EMPTY_DESC}
      icon="📋"
    />
  )

  return (
    <div>
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th>{ORDERS_LABELS.COL_NUMBER}</th>
              <th>{ORDERS_LABELS.COL_CUSTOMER}</th>
              <th>{ORDERS_LABELS.COL_DATE}</th>
              <th>{ORDERS_LABELS.COL_TARGET}</th>
              <th>{ORDERS_LABELS.COL_AMOUNT}</th>
              <th>{ORDERS_LABELS.COL_STATUS}</th>
              <th>{ORDERS_LABELS.COL_PAYMENT}</th>
              <th>{ORDERS_LABELS.COL_ACTIONS}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className={styles.row}
                onClick={() => onRowClick(order.id)}
              >
                <td className={styles.cell}>
                  <span className={styles.orderNumber}>{order.order_number}</span>
                </td>
                <td className={styles.cell}>
                  <span className={styles.customerName}>{order.customer_name}</span>
                </td>
                <td className={styles.cell}>{formatDate(order.date)}</td>
                <td className={styles.cell}>
                  <span className={styles.target}>{order.target_description ?? '—'}</span>
                </td>
                <td className={styles.cell}>
                  <span className={styles.amount}>{formatAmount(order.total_amount)}</span>
                </td>
                <td className={styles.cell}>
                  <StatusBadge status={order.status} />
                </td>
                <td className={styles.cell}>
                  <span className={`${styles.paidBadge} ${order.is_paid ? styles.paid : styles.unpaid}`}>
                    {getPaymentLabel(order.payment_method, order.is_paid)}
                  </span>
                </td>
                <td className={`${styles.cell} ${styles.actionsCell}`} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.actionBtn} onClick={() => onEditOrder(order.id)} title="עריכה">✏️</button>
                  <button className={styles.actionBtn} onClick={() => onDeleteOrder(order.id)} title="מחיקה">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span>סה"כ {total} הזמנות</span>
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              הקודם
            </button>
            <span className={styles.pageBtn}>{currentPage} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
