'use client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export interface ExpenseDetailPageProps {
  expenseId: string
}

export interface UseExpenseDetailPageReturn {
  title: string
  backLabel: string
  comingSoon: string
  expenseId: string
  onBack: () => void
}

export const useExpenseDetailPage = (props: ExpenseDetailPageProps): UseExpenseDetailPageReturn => {
  const router = useRouter()
  return {
    title: EXPENSES_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    comingSoon: UI_LABELS.DETAIL_COMING_SOON,
    expenseId: props.expenseId,
    onBack: () => router.push(ROUTES.EXPENSES),
  }
}
