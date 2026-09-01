'use client'
import type { ReactElement } from 'react'
import { useCustomersPage } from './useCustomersPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { CustomersFiltersBar } from '../CustomersFiltersBar/CustomersFiltersBar'
import { CustomersTable } from '../CustomersTable/CustomersTable'
import { CustomerForm } from '../CustomerForm/CustomerForm'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import styles from './CustomersPage.module.scss'

export const CustomersPage = (): ReactElement => {
  const { onAdd } = useCustomersPage()

  return (
    <>
      <PageLayout
        title={CUSTOMERS_LABELS.PAGE_TITLE}
        actionLabel={CUSTOMERS_LABELS.NEW_CUSTOMER}
        onAction={onAdd}
        filters={<CustomersFiltersBar />}
      >
        <div className={styles.card}>
          <CustomersTable />
        </div>
      </PageLayout>

      <CustomerForm />
    </>
  )
}
