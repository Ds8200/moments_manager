'use client'
import type { ReactElement } from 'react'
import { useProductsPage } from './useProductsPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { ProductsFiltersBar } from '../ProductsFiltersBar/ProductsFiltersBar'
import { ProductsTable } from '../ProductsTable/ProductsTable'
import { ProductForm } from '../ProductForm/ProductForm'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import styles from './ProductsPage.module.scss'

export const ProductsPage = (): ReactElement => {
  const { onAdd } = useProductsPage()

  return (
    <>
      <PageLayout
        title={PRODUCTS_LABELS.PAGE_TITLE}
        actionLabel={PRODUCTS_LABELS.NEW_PRODUCT}
        onAction={onAdd}
        filters={<ProductsFiltersBar />}
      >
        <div className={styles.card}>
          <ProductsTable />
        </div>
      </PageLayout>

      <ProductForm />
    </>
  )
}
