'use client'
import type { ReactElement } from 'react'
import { useProductDetailPage } from './useProductDetailPage'
import { RecordDetailHeader } from '@/shared/components/RecordDetailHeader/RecordDetailHeader'
import { InlineEditField } from '@/shared/components/InlineEditField/InlineEditField'
import { InlineSelectField } from '@/shared/components/InlineSelectField/InlineSelectField'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './ProductDetailPage.module.scss'
import type { ProductDetailPageProps } from './useProductDetailPage'

export { type ProductDetailPageProps }

export const ProductDetailPage = (props: ProductDetailPageProps): ReactElement => {
  const {
    product, isLoading, isError, refetch,
    backLabel, menuTitle, menuItems,
    sectionInfoLabel, labelName, labelCategory, labelPrice, labelCost, labelProdDays, labelStatus,
    categoryOptions, statusOptions, currentCategoryId, currentStatus,
    onSaveName, onSavePrice, onSaveCost, onSaveProdDays, onCategoryChange, onStatusChange,
  } = useProductDetailPage(props)

  if (isLoading) return <PageSkeleton rows={6} />
  if (isError || !product) {
    return <ErrorBoundary message={UI_LABELS.ERROR_LOADING_PRODUCT_DETAIL} onReset={refetch} />
  }

  return (
    <div className={styles.page}>
      <RecordDetailHeader
        title={product.name}
        backLabel={backLabel}
        backHref={ROUTES.PRODUCTS}
        menuTitle={menuTitle}
        menuItems={menuItems}
      />
      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{sectionInfoLabel}</h2>
          <InlineEditField label={labelName} value={product.name} type="text" editable onSave={onSaveName} />
          <InlineEditField label={labelPrice} value={product.base_price} type="number" editable onSave={onSavePrice} />
          <InlineEditField label={labelCost} value={product.base_cost} type="number" editable onSave={onSaveCost} />
          <InlineEditField
            label={labelProdDays}
            value={product.avg_production_days === null ? '' : String(product.avg_production_days)}
            type="number"
            editable
            onSave={onSaveProdDays}
          />
          <InlineSelectField label={labelCategory} value={currentCategoryId} options={categoryOptions} onChange={onCategoryChange} />
          <InlineSelectField label={labelStatus} value={currentStatus} options={statusOptions} onChange={onStatusChange} />
        </section>
      </div>
    </div>
  )
}
