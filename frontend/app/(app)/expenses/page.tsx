import type { Metadata } from 'next'
import { ExpensesPage } from '@/features/expenses/components/ExpensesPage/ExpensesPage'

export const metadata: Metadata = { title: 'הוצאות — Moments' }

export default function Page() {
  return <ExpensesPage />
}
