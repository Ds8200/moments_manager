import type { Metadata } from 'next'
import { ExpenseDetailPage } from '@/features/expenses/components/ExpenseDetailPage/ExpenseDetailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.EXPENSE_DETAIL_TITLE }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExpenseDetailPage expenseId={id} />
}
