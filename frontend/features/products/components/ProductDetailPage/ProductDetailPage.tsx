'use client'
import type { ReactElement } from 'react'
import { useProductDetailPage } from './useProductDetailPage'
import styles from './ProductDetailPage.module.scss'
import type { ProductDetailPageProps } from './useProductDetailPage'

export const ProductDetailPage = (props: ProductDetailPageProps): ReactElement => {
  const { title, backLabel, comingSoon, onBack } = useProductDetailPage(props)
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button className={styles.backBtn} onClick={onBack}>{backLabel}</button>
      </div>
      <p className={styles.placeholder}>{comingSoon}</p>
    </div>
  )
}
