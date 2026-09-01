'use client'
import { useAtomValue, useSetAtom } from 'jotai'
import { useExpenses } from '../../queries/useExpenses'
import { expensesPageAtom, isExpenseFormOpenAtom } from '../../store/expensesAtoms'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { formatCurrency } from '@/shared/utils/formatters'

export interface UseExpensesPageReturn {
  totalAmount: string
  totalLabel: string
  onNew: () => void
}

export const useExpensesPage = (): UseExpensesPageReturn => {
  const page = useAtomValue(expensesPageAtom)
  const setFormOpen = useSetAtom(isExpenseFormOpenAtom)
  // Shares the same ['expenses', page] cache entry ExpensesTable reads — no extra request.
  const { data } = useExpenses(page)

  const totalAmount = formatCurrency(
    data?.items.reduce((sum, e) => sum + parseFloat(e.amount), 0) ?? 0
  )

  return {
    totalAmount,
    totalLabel: EXPENSES_LABELS.TOTAL_LABEL,
    onNew: () => setFormOpen(true),
  }
}
