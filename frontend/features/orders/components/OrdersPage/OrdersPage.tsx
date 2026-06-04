'use client'
import type { ReactElement } from 'react'
import { OrderFiltersBar } from '../OrderFiltersBar/OrderFiltersBar'
import { OrdersTable } from '../OrdersTable/OrdersTable'
import { OrderForm } from '../OrderForm/OrderForm'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrdersPage.module.scss'

export const OrdersPage = (): ReactElement => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{ORDERS_LABELS.PAGE_TITLE}</h1>
      </div>

      <OrderFiltersBar />

      <div className={styles.card}>
        <OrdersTable />
      </div>

      <OrderForm />
    </div>
  )
}
