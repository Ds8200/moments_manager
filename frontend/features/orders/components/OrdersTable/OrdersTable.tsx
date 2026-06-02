'use client'
import type { ReactElement } from 'react'
import { useOrdersTable } from './useOrdersTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge/StatusBadge'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrdersTable.module.scss'
import type { OrderSummary } from '../../types'

const HEADERS = [
  ORDERS_LABELS.COL_NUMBER,
  ORDERS_LABELS.COL_CUSTOMER,
  ORDERS_LABELS.COL_DATE,
  ORDERS_LABELS.COL_TARGET,
  ORDERS_LABELS.COL_AMOUNT,
  ORDERS_LABELS.COL_STATUS,
  ORDERS_LABELS.COL_PAYMENT,
  ORDERS_LABELS.COL_ACTIONS,
]

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

  const renderRow = (order: OrderSummary): ReactElement => (
    <tr className={styles.row} onClick={() => onRowClick(order.id)}>
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
  )

  return (
    <DataTable
      headers={HEADERS}
      rows={orders}
      keyExtractor={(order) => order.id}
      renderRow={renderRow}
      isLoading={isLoading}
      isError={isError}
      emptyTitle={ORDERS_LABELS.EMPTY_TITLE}
      emptyDescription={ORDERS_LABELS.EMPTY_DESC}
      emptyIcon="📋"
      errorTitle={ORDERS_LABELS.ERROR}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      onPageChange={onPageChange}
      paginationLabels={{
        totalPrefix: ORDERS_LABELS.TABLE_TOTAL,
        totalSuffix: ORDERS_LABELS.TABLE_ORDERS_SUFFIX,
        prev: ORDERS_LABELS.TABLE_PREV,
        next: ORDERS_LABELS.TABLE_NEXT,
      }}
    />
  )
}
