'use client'
import type { ReactElement } from 'react'
import { useCustomersPage } from './useCustomersPage'
import { CustomerForm } from '../CustomerForm/CustomerForm'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import styles from './CustomersPage.module.scss'

export const CustomersPage = (): ReactElement => {
  const {
    data, isLoading, isError, page, search,
    onSearchChange, onPageNext, onPagePrev,
    onNew, onEdit, onDelete,
  } = useCustomersPage()

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{CUSTOMERS_LABELS.PAGE_TITLE}</h1>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={CUSTOMERS_LABELS.SEARCH_PLACEHOLDER}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className={styles.newBtn} onClick={onNew}>{CUSTOMERS_LABELS.NEW_CUSTOMER}</button>
      </div>

      {isLoading && <PageSkeleton rows={6} />}

      {isError && <EmptyState title={CUSTOMERS_LABELS.ERROR_LOAD} description="" icon="⚠️" />}

      {data && data.items.length === 0 && (
        <EmptyState title={CUSTOMERS_LABELS.EMPTY_TITLE} description={CUSTOMERS_LABELS.EMPTY_DESC} icon="👥" />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={styles.grid}>
            {data.items.map((customer) => (
              <div key={customer.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.customerName}>{customer.name}</span>
                  <div className={styles.customerActions}>
                    <button className={styles.actionBtn} title="עריכה" onClick={() => onEdit(customer.id)}>✏️</button>
                    <button
                      className={styles.actionBtn}
                      title="מחיקה"
                      onClick={() => onDelete(customer.id, customer.name)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className={styles.customerMeta}>
                  {customer.phone && <span>{CUSTOMERS_LABELS.PHONE_PREFIX} {customer.phone}</span>}
                  {customer.email && <span>{CUSTOMERS_LABELS.EMAIL_PREFIX} {customer.email}</span>}
                  {!customer.phone && !customer.email && <span>{CUSTOMERS_LABELS.NO_CONTACT}</span>}
                </div>
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={onPagePrev} disabled={page <= 1}>
                {CUSTOMERS_LABELS.PAGE_PREV}
              </button>
              <span>{page} / {data.pages}</span>
              <button className={styles.pageBtn} onClick={onPageNext} disabled={page >= data.pages}>
                {CUSTOMERS_LABELS.PAGE_NEXT}
              </button>
            </div>
          )}
        </>
      )}
      <CustomerForm />
    </div>
  )
}
