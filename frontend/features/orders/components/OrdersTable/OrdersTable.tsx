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
  ORDERS_LABELS.COL_CUSTOMER,
  ORDERS_LABELS.COL_PRODUCTS,
  ORDERS_LABELS.COL_DATE,
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
    getRowProps,
    closeMenu,
    onPageChange,
    expandedOrderId,
    toggleExpanded,
    formatAmount,
    formatDate,
    getUrgencyLabel,
    getUrgencyClass,
    getPaymentLabel,
    emptyIcon,
  } = useOrdersTable()

  const renderRow = (order: OrderSummary): ReactElement => {
    const isExpanded = expandedOrderId === order.id

    return (
      <>
        <tr
          className={styles.row}
          {...getRowProps(order)}
        >
          <td className={styles.cell}>
            <span className={styles.customerName}>{order.customer_name}</span>
          </td>
          <td className={styles.cell}>
            <button
              type="button"
              className={styles.productsToggle}
              aria-expanded={isExpanded}
              onClick={(e: MouseEvent<HTMLButtonElement>) => toggleExpanded(order.id, e)}
            >
              <span className={styles.productsCount}>{order.items.length}</span>
              <svg
                className={styles.chevron}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </td>
          <td className={styles.cell}>{formatDate(order.created_at)}</td>
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
        {isExpanded && (
          <tr className={styles.subRow}>
            <td className={styles.subCell} colSpan={HEADERS.length}>
              {order.items.length === 0 ? (
                <span className={styles.subEmpty}>{ORDERS_LABELS.PRODUCTS_EMPTY}</span>
              ) : (
                <ul className={styles.productsList}>
                  {order.items.map((item) => (
                    <li key={item.id} className={styles.productsListItem}>
                      <span className={styles.productsListName}>{item.product_name}</span>
                      <span className={styles.productsListQty}>
                        {ORDERS_LABELS.PRODUCTS_QTY_PREFIX} {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        )}
      </>
    )
  }

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
        emptyIcon={emptyIcon}
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
