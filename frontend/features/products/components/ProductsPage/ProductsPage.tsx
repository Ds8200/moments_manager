'use client'
import type { ReactElement } from 'react'
import { ProductsFiltersBar } from '../ProductsFiltersBar/ProductsFiltersBar'
import { ProductsTable } from '../ProductsTable/ProductsTable'
import { ProductForm } from '../ProductForm/ProductForm'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import styles from './ProductsPage.module.scss'

export const ProductsPage = (): ReactElement => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{PRODUCTS_LABELS.PAGE_TITLE}</h1>
      </div>

      <ProductsFiltersBar />

      <div className={styles.card}>
        <ProductsTable />
      </div>

      <ProductForm />
    </div>
  )
}
