import type { Metadata } from 'next'
import { ExpensesPage } from '@/features/expenses/components/ExpensesPage/ExpensesPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.EXPENSES_TITLE }

export default function Page() {
  return <ExpensesPage />
}
