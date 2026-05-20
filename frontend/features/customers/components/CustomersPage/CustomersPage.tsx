'use client'
import { useState } from 'react'
import { useCustomers, useDeleteCustomer } from '../../queries/useCustomers'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import styles from './CustomersPage.module.scss'

const LABELS = {
  TITLE:       'לקוחות',
  NEW:         '+ לקוח חדש',
  SEARCH:      'חיפוש לקוח...',
  EMPTY_TITLE: 'אין לקוחות',
  EMPTY_DESC:  'הוסף לקוח ראשון',
  PHONE:       'טלפון:',
  EMAIL:       'אימייל:',
} as const

export function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useCustomers(page, search)
  const deleteCustomer = useDeleteCustomer()

  const handleDelete = (id: string, name: string): void => {
    if (window.confirm(`למחוק את ${name}?`)) {
      deleteCustomer.mutate(id)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{LABELS.TITLE}</h1>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={LABELS.SEARCH}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <button className={styles.newBtn}>{LABELS.NEW}</button>
      </div>

      {isLoading && <PageSkeleton rows={6} />}

      {isError && <EmptyState title="שגיאה בטעינת לקוחות" description="" icon="⚠️" />}

      {data && data.items.length === 0 && (
        <EmptyState title={LABELS.EMPTY_TITLE} description={LABELS.EMPTY_DESC} icon="👥" />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={styles.grid}>
            {data.items.map((customer) => (
              <div key={customer.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.customerName}>{customer.name}</span>
                  <div className={styles.customerActions}>
                    <button className={styles.actionBtn} title="עריכה">✏️</button>
                    <button
                      className={styles.actionBtn}
                      title="מחיקה"
                      onClick={() => handleDelete(customer.id, customer.name)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className={styles.customerMeta}>
                  {customer.phone && <span>{LABELS.PHONE} {customer.phone}</span>}
                  {customer.email && <span>{LABELS.EMAIL} {customer.email}</span>}
                  {!customer.phone && !customer.email && <span>אין פרטי קשר</span>}
                </div>
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                הקודם
              </button>
              <span>{page} / {data.pages}</span>
              <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}>
                הבא
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
