'use client'
import { useState } from 'react'
import { useSetAtom } from 'jotai'
import { useProducts, useDeleteProduct } from '../../queries/useProducts'
import { isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { ProductForm } from '../ProductForm/ProductForm'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { formatCurrency } from '@/shared/utils/formatters'
import styles from './ProductsPage.module.scss'

const LABELS = {
  TITLE:       'מוצרים',
  NEW:         '+ מוצר חדש',
  SEARCH:      'חיפוש מוצר...',
  EMPTY_TITLE: 'אין מוצרים בקטלוג',
  EMPTY_DESC:  'הוסף מוצר ראשון',
  PROFIT:      'רווח:',
  INACTIVE:    'לא פעיל',
} as const

export function ProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useProducts(page, search)
  const deleteProduct = useDeleteProduct()
  const setOpen = useSetAtom(isProductFormOpenAtom)
  const setEditingId = useSetAtom(editingProductIdAtom)

  const handleNew = (): void => setOpen(true)
  const handleEdit = (id: string): void => { setEditingId(id); setOpen(true) }

  const calcProfit = (price: string, cost: string): string => {
    const p = parseFloat(price) - parseFloat(cost)
    return formatCurrency(p)
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
        <button className={styles.newBtn} onClick={handleNew}>{LABELS.NEW}</button>
      </div>

      {isLoading && <PageSkeleton rows={4} />}
      {isError && <EmptyState title="שגיאה בטעינת מוצרים" description="" icon="⚠️" />}

      {data && data.items.length === 0 && (
        <EmptyState title={LABELS.EMPTY_TITLE} description={LABELS.EMPTY_DESC} icon="🎨" />
      )}

      {data && data.items.length > 0 && (
        <div className={styles.grid}>
          {data.items.map((product) => (
            <div key={product.id} className={`${styles.card}${!product.is_active ? ` ${styles.inactive}` : ''}`}>
              <div className={styles.cardHeader}>
                <span className={styles.productName}>{product.name}</span>
                {product.category && (
                  <span className={styles.categoryBadge}>{product.category}</span>
                )}
              </div>

              <div className={styles.priceRow}>
                <span className={styles.price}>{formatCurrency(product.base_price)}</span>
                <span className={styles.cost}>עלות: {formatCurrency(product.base_cost)}</span>
              </div>

              <div className={styles.profit}>
                {LABELS.PROFIT} {calcProfit(product.base_price, product.base_cost)}
              </div>

              <div className={styles.cardActions}>
                <button className={styles.actionBtn} title="עריכה" onClick={() => handleEdit(product.id)}>✏️ ערוך</button>
                <button
                  className={styles.actionBtn}
                  title="מחיקה"
                  onClick={() => {
                    if (window.confirm(`למחוק את ${product.name}?`)) {
                      deleteProduct.mutate(product.id)
                    }
                  }}
                >
                  🗑️ מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProductForm />
    </div>
  )
}
