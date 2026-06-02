'use client'
import type { ReactElement } from 'react'
import { useOrderFiltersBar } from './useOrderFiltersBar'
import styles from './OrderFiltersBar.module.scss'
import type { PaymentState } from '@/shared/enums/statusEnums'
import { ORDERS_LABELS } from '../../constants/ordersLabels'

export const OrderFiltersBar = (): ReactElement => {
  const {
    filters,
    statusOptions,
    paymentStateOptions,
    onSearchChange,
    onStatusChange,
    onPaymentStateChange,
    onDateFromChange,
    onDateToChange,
    onNewOrder,
  } = useOrderFiltersBar()

  return (
    <div className={styles.bar}>
      <div className={styles.searchWrapper}>
        <i className={styles.searchIcon}>🔍</i>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={ORDERS_LABELS.SEARCH_PLACEHOLDER}
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className={styles.select}
        value={filters.status}
        onChange={(e) => onStatusChange(e.target.value as Parameters<typeof onStatusChange>[0])}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        className={styles.select}
        value={filters.payment_state}
        onChange={(e) => onPaymentStateChange(e.target.value as '' | PaymentState)}
      >
        {paymentStateOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input
        type="date"
        className={styles.dateInput}
        value={filters.date_from}
        onChange={(e) => onDateFromChange(e.target.value)}
      />

      <input
        type="date"
        className={styles.dateInput}
        value={filters.date_to}
        onChange={(e) => onDateToChange(e.target.value)}
      />

      <button className={styles.newButton} onClick={onNewOrder}>
        {ORDERS_LABELS.NEW_ORDER}
      </button>
    </div>
  )
}
