'use client'
import type { ReactElement } from 'react'
import { useProductsTable } from './useProductsTable'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import styles from './ProductsTable.module.scss'
import type { Product } from '../../types'

const HEADERS = [
  PRODUCTS_LABELS.COL_NAME,
  PRODUCTS_LABELS.COL_CATEGORY,
  PRODUCTS_LABELS.COL_PRICE,
  PRODUCTS_LABELS.COL_COST,
  PRODUCTS_LABELS.COL_STATUS,
]

export const ProductsTable = (): ReactElement => {
  const {
    products,
    total,
    currentPage,
    totalPages,
    isLoading,
    isError,
    menuState,
    getRowProps,
    closeMenu,
    onPageChange,
    formatAmount,
    emptyIcon,
    emptyValue,
  } = useProductsTable()

  const renderRow = (product: Product): ReactElement => (
    <tr
      className={styles.row}
      {...getRowProps(product)}
    >
      <td className={styles.cell}>
        <span className={styles.name}>{product.name}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{product.category?.name ?? emptyValue}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.price}>{formatAmount(product.base_price)}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.secondary}>{formatAmount(product.base_cost)}</span>
      </td>
      <td className={styles.cell}>
        <span className={product.is_active ? styles.activeBadge : styles.inactiveBadge}>
          {product.is_active ? PRODUCTS_LABELS.ACTIVE_LABEL : PRODUCTS_LABELS.INACTIVE_LABEL}
        </span>
      </td>
    </tr>
  )

  return (
    <>
      <DataTable
        headers={HEADERS}
        rows={products}
        keyExtractor={(p) => p.id}
        renderRow={renderRow}
        isLoading={isLoading}
        isError={isError}
        emptyTitle={PRODUCTS_LABELS.EMPTY_TITLE}
        emptyDescription={PRODUCTS_LABELS.EMPTY_DESC}
        emptyIcon={emptyIcon}
        errorTitle={PRODUCTS_LABELS.ERROR_LOAD}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        paginationLabels={{
          totalPrefix: PRODUCTS_LABELS.TABLE_TOTAL,
          totalSuffix: PRODUCTS_LABELS.TABLE_PRODUCTS_SUFFIX,
          prev: PRODUCTS_LABELS.TABLE_PREV,
          next: PRODUCTS_LABELS.TABLE_NEXT,
        }}
      />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
