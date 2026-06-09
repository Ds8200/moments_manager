'use client'
import type { ReactElement } from 'react'
import { useExpenseDetailPage } from './useExpenseDetailPage'
import type { ExpenseDetailPageProps } from './useExpenseDetailPage'
import { DetailLayout } from '@/shared/components/DetailLayout/DetailLayout'
import { ExpenseForm } from '../ExpenseForm/ExpenseForm'

export const ExpenseDetailPage = (props: ExpenseDetailPageProps): ReactElement => {
  const hookReturn = useExpenseDetailPage(props)
  return (
    <>
      <DetailLayout {...hookReturn} />
      <ExpenseForm />
    </>
  )
}
