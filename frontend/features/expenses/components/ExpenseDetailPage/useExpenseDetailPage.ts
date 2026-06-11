'use client'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { useExpense } from '../../queries/useExpense'
import { useDeleteExpense } from '../../queries/useExpenses'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { DetailSection } from '@/shared/components/DetailLayout/useDetailLayout'

export interface ExpenseDetailPageProps {
  expenseId: string
}

export interface UseExpenseDetailPageReturn {
  title: string
  backLabel: string
  onBack: () => void
  editLabel: string
  onEdit: () => void
  deleteLabel: string
  onDelete: () => void
  sections: DetailSection[]
  isLoading: boolean
  isError: boolean
  errorMessage: string
}

export const useExpenseDetailPage = (props: ExpenseDetailPageProps): UseExpenseDetailPageReturn => {
  const router = useRouter()
  const setConfirmDialog = useSetAtom(confirmDialogAtom)
  const setEditingExpense = useSetAtom(editingExpenseAtom)
  const setFormOpen = useSetAtom(isExpenseFormOpenAtom)
  const { data, isLoading, isError } = useExpense(props.expenseId)
  const { mutate: deleteExpense } = useDeleteExpense()

  const onBack = (): void => router.push(ROUTES.EXPENSES)

  const onEdit = (): void => {
    if (data) {
      setEditingExpense(data)
      setFormOpen(true)
    }
  }

  const onDelete = (): void => {
    setConfirmDialog({
      isOpen: true,
      options: {
        message: EXPENSES_LABELS.DETAIL_DELETE_MSG,
        isDangerous: true,
        onConfirm: () =>
          deleteExpense(props.expenseId, {
            onSuccess: () => router.push(ROUTES.EXPENSES),
          }),
      },
    })
  }

  const sections: DetailSection[] = data
    ? [
        {
          fields: [
            { label: EXPENSES_LABELS.DETAIL_DATE, value: formatDate(data.date) },
            { label: EXPENSES_LABELS.DETAIL_CATEGORY, value: data.category?.name ?? UI_LABELS.NOT_SET },
            { label: EXPENSES_LABELS.DETAIL_AMOUNT, value: formatCurrency(data.amount) },
            { label: EXPENSES_LABELS.DETAIL_CREATED_AT, value: formatDate(data.created_at) },
            { label: EXPENSES_LABELS.DETAIL_NOTES, value: data.notes ?? UI_LABELS.NOT_SET, span: 2 },
          ],
        },
      ]
    : []

  return {
    title: data
      ? `${EXPENSES_LABELS.DETAIL_TITLE} — ${formatDate(data.date)}`
      : EXPENSES_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    onBack,
    editLabel: UI_LABELS.EDIT,
    onEdit,
    deleteLabel: UI_LABELS.DELETE,
    onDelete,
    sections,
    isLoading,
    isError,
    errorMessage: UI_LABELS.ERROR_LOADING_EXPENSE_DETAIL,
  }
}
