'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { useCreateExpense, useUpdateExpense } from '../../queries/useExpenses'
import type { ExpenseFormValues, ExpenseCategory } from '../../types'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'ink', 'materials', 'equipment', 'shipping', 'utilities', 'other',
]

const schema = z.object({
  date:     z.string().min(1, EXPENSES_LABELS.VALIDATION_DATE),
  category: z.enum(['ink', 'materials', 'equipment', 'shipping', 'utilities', 'other']),
  amount:   z.string().min(1, EXPENSES_LABELS.VALIDATION_AMOUNT),
  notes:    z.string(),
})

const DEFAULT_VALUES: ExpenseFormValues = {
  date:     new Date().toISOString().split('T')[0],
  category: 'other',
  amount:   '',
  notes:    '',
}

export interface UseExpenseFormReturn {
  isOpen: boolean
  isEditing: boolean
  register: ReturnType<typeof useForm<ExpenseFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<ExpenseFormValues>>['handleSubmit']
  onSubmit: (values: ExpenseFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<ExpenseFormValues>>['formState']['errors']
  isSubmitting: boolean
  onClose: () => void
  categories: ExpenseCategory[]
}

export const useExpenseForm = (): UseExpenseFormReturn => {
  const [isOpen, setOpen]                     = useAtom(isExpenseFormOpenAtom)
  const [editingExpense, setEditingExpense]    = useAtom(editingExpenseAtom)
  const createExpense                          = useCreateExpense()
  const updateExpense                          = useUpdateExpense()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (isOpen && editingExpense) {
      reset({
        date:     editingExpense.date,
        category: editingExpense.category,
        amount:   editingExpense.amount,
        notes:    editingExpense.notes ?? '',
      })
    } else if (isOpen && !editingExpense) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, editingExpense, reset])

  const onClose = (): void => {
    setOpen(false)
    setEditingExpense(null)
  }

  const onSubmit = async (values: ExpenseFormValues): Promise<void> => {
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, payload: values })
    } else {
      await createExpense.mutateAsync(values)
    }
    onClose()
  }

  return {
    isOpen,
    isEditing: !!editingExpense,
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    onClose,
    categories: EXPENSE_CATEGORIES,
  }
}
