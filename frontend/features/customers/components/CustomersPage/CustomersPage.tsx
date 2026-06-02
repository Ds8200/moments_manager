'use client'
import type { ReactElement } from 'react'
import { CustomersFiltersBar } from '../CustomersFiltersBar/CustomersFiltersBar'
import { CustomersTable } from '../CustomersTable/CustomersTable'
import { CustomerForm } from '../CustomerForm/CustomerForm'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import styles from './CustomersPage.module.scss'

export const CustomersPage = (): ReactElement => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{CUSTOMERS_LABELS.PAGE_TITLE}</h1>
      </div>

      <CustomersFiltersBar />

      <div className={styles.card}>
        <CustomersTable />
      </div>

      <CustomerForm />
    </div>
  )
}
