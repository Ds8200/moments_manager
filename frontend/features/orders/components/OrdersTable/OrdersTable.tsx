'use client'
import type { ReactElement } from 'react'
import { useOrdersTable } from './useOrdersTable'
import { StatusBadge } from '@/shared/components/StatusBadge/StatusBadge'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrdersTable.module.scss'

export const OrdersTable = (): ReactElement => {
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
    formatDueDateTime,
    getUrgencyLabel,
    getUrgencyClass,
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
                  <div className={styles.targetCell}>
                    <span className={styles.target}>{formatDueDateTime(order.due_datetime)}</span>
                    {order.urgency && (
                      <span className={`${styles.urgencyBadge} ${styles[getUrgencyClass(order.urgency)]}`}>
                        {getUrgencyLabel(order.urgency)}
                      </span>
                    )}
                  </div>
                </td>
                <td className={styles.cell}>
                  <span className={styles.amount}>{formatAmount(order.total_amount)}</span>
                </td>
                <td className={styles.cell}>
                  <StatusBadge status={order.status} />
                </td>
                <td className={styles.cell}>
                  <span className={`${styles.paidBadge} ${order.is_paid ? styles.paid : styles.unpaid}`}>
                    {getPaymentLabel(order.is_paid, order.payment_method)}
                  </span>
                </td>
                <td className={`${styles.cell} ${styles.actionsCell}`} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.actionBtn} onClick={() => onEditOrder(order.id)} title={ORDERS_LABELS.TABLE_EDIT_TITLE}>✏️</button>
                  <button className={styles.actionBtn} onClick={() => onDeleteOrder(order.id)} title={ORDERS_LABELS.TABLE_DELETE_TITLE}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span>{ORDERS_LABELS.TABLE_TOTAL} {total} {ORDERS_LABELS.TABLE_ORDERS_SUFFIX}</span>
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              {ORDERS_LABELS.TABLE_PREV}
            </button>
            <span className={styles.pageBtn}>{currentPage} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              {ORDERS_LABELS.TABLE_NEXT}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
