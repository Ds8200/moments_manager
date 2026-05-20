'use client'
import type { ReactElement } from 'react'
import { useProductsPage } from './useProductsPage'
import { ProductForm } from '../ProductForm/ProductForm'
import { EmptyState } from '@/shared/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import styles from './ProductsPage.module.scss'

export const ProductsPage = (): ReactElement => {
  const {
    data, isLoading, isError, search,
    onSearchChange, onNew, onEdit, onDelete, calcProfit, formatAmount,
  } = useProductsPage()

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{PRODUCTS_LABELS.PAGE_TITLE}</h1>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={PRODUCTS_LABELS.SEARCH_PLACEHOLDER}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className={styles.newBtn} onClick={onNew}>{PRODUCTS_LABELS.NEW_PRODUCT}</button>
      </div>

      {isLoading && <PageSkeleton rows={4} />}
      {isError && <EmptyState title={PRODUCTS_LABELS.ERROR_LOAD} description="" icon="⚠️" />}

      {data && data.items.length === 0 && (
        <EmptyState title={PRODUCTS_LABELS.EMPTY_TITLE} description={PRODUCTS_LABELS.EMPTY_DESC} icon="🎨" />
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
                <span className={styles.price}>{formatAmount(product.base_price)}</span>
                <span className={styles.cost}>{PRODUCTS_LABELS.COST_PREFIX} {formatAmount(product.base_cost)}</span>
              </div>
              <div className={styles.profit}>
                {PRODUCTS_LABELS.PROFIT_PREFIX} {calcProfit(product.base_price, product.base_cost)}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} title={UI_LABELS.EDIT} onClick={() => onEdit(product.id)}>✏️ {UI_LABELS.EDIT}</button>
                <button className={styles.actionBtn} title={UI_LABELS.DELETE} onClick={() => onDelete(product.id, product.name)}>🗑️ {UI_LABELS.DELETE}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProductForm />
    </div>
  )
}
