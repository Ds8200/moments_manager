'use client'
import type { ReactElement } from 'react'
import { useOrdersPage } from './useOrdersPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { OrderFiltersBar } from '../OrderFiltersBar/OrderFiltersBar'
import { OrdersTable } from '../OrdersTable/OrdersTable'
import { OrderForm } from '../OrderForm/OrderForm'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrdersPage.module.scss'

export const OrdersPage = (): ReactElement => {
  const { onAdd } = useOrdersPage()

  return (
    <>
      <PageLayout
        title={ORDERS_LABELS.PAGE_TITLE}
        actionLabel={ORDERS_LABELS.NEW_ORDER}
        onAction={onAdd}
        filters={<OrderFiltersBar />}
      >
        <div className={styles.card}>
          <OrdersTable />
        </div>
      </PageLayout>

      <OrderForm />
    </>
  )
}
