'use client'
import type { ReactElement } from 'react'
import { useProductDetailPage } from './useProductDetailPage'
import type { ProductDetailPageProps } from './useProductDetailPage'
import { DetailLayout } from '@/shared/components/DetailLayout/DetailLayout'
import { ProductForm } from '../ProductForm/ProductForm'

export const ProductDetailPage = (props: ProductDetailPageProps): ReactElement => {
  const hookReturn = useProductDetailPage(props)
  return (
    <>
      <DetailLayout {...hookReturn} />
      <ProductForm />
    </>
  )
}
