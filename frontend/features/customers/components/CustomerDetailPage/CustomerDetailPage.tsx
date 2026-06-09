'use client'
import type { ReactElement } from 'react'
import { useCustomerDetailPage } from './useCustomerDetailPage'
import type { CustomerDetailPageProps } from './useCustomerDetailPage'
import { DetailLayout } from '@/shared/components/DetailLayout/DetailLayout'
import { CustomerForm } from '../CustomerForm/CustomerForm'

export const CustomerDetailPage = (props: CustomerDetailPageProps): ReactElement => {
  const hookReturn = useCustomerDetailPage(props)
  return (
    <>
      <DetailLayout {...hookReturn} />
      <CustomerForm />
    </>
  )
}
