'use client'
import type { ReactElement, MouseEvent } from 'react'
import { useOrdersTable } from './useOrdersTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { StatusBadge } from '@/shared/components/StatusBadge/StatusBadge'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrdersTable.module.scss'
import type { OrderSummary } from '../../types'

const HEADERS = [
  ORDERS_LABELS.COL_NUMBER,
  ORDERS_LABELS.COL_CUSTOMER,
  ORDERS_LABELS.COL_DATE,
  ORDERS_LABELS.COL_TARGET,
  ORDERS_LABELS.COL_URGENCY,
  ORDERS_LABELS.COL_AMOUNT,
  ORDERS_LABELS.COL_STATUS,
  ORDERS_LABELS.COL_PAYMENT,
]

export const OrdersTable = (): ReactElement => {
  const {
    orders,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    menuState,
    onRowMenuClick,
    closeMenu,
    onPageChange,
    formatAmount,
    formatDate,
    formatDueDateTime,
    getUrgencyLabel,
    getUrgencyClass,
    getPaymentLabel,
  } = useOrdersTable()

  const renderRow = (order: OrderSummary): ReactElement => (
    <tr
      className={styles.row}
      onClick={(e: MouseEvent<HTMLTableRowElement>) => onRowMenuClick(order, e)}
    >
      <td className={styles.cell}>
        <span className={styles.orderNumber}>{order.order_number}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.customerName}>{order.customer_name}</span>
      </td>
      <td className={styles.cell}>{formatDate(order.created_at)}</td>
      <td className={styles.cell}>
        <span className={styles.target}>{formatDueDateTime(order.due_datetime)}</span>
      </td>
      <td className={styles.cell}>
        <span className={`${styles.urgencyBadge} ${styles[getUrgencyClass(order.urgency)]}`}>
          {getUrgencyLabel(order.urgency)}
        </span>
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
    </tr>
  )

  return (
    <>
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
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
