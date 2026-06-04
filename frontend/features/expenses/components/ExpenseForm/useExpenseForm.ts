'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isExpenseFormOpenAtom, editingExpenseAtom } from '../../store/expensesAtoms'
import { useCreateExpense, useUpdateExpense } from '../../queries/useExpenses'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/expenseCategories'
import type { UseCategoryManagerModalOptions } from '@/shared/components/CategoryManagerModal/useCategoryManagerModal'
import type { ExpenseCategory, ExpenseFormValues } from '../../types'
import { EXPENSES_LABELS } from '../../constants/expensesLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

const schema = z.object({
  date:        z.string().min(1, EXPENSES_LABELS.VALIDATION_DATE),
  category_id: z.string(),
  amount:      z.string().min(1, EXPENSES_LABELS.VALIDATION_AMOUNT),
  notes:       z.string(),
})

const DEFAULT_VALUES: ExpenseFormValues = {
  date:        new Date().toISOString().split('T')[0],
  category_id: '',
  amount:      '',
  notes:       '',
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
  isCategoryManagerOpen: boolean
  openCategoryManager: () => void
  categoryManagerOptions: UseCategoryManagerModalOptions
  closeSymbol: string
  currencySymbol: string
}

export const useExpenseForm = (): UseExpenseFormReturn => {
  const [isOpen, setOpen]                     = useAtom(isExpenseFormOpenAtom)
  const [editingExpense, setEditingExpense]    = useAtom(editingExpenseAtom)
  const createExpense                          = useCreateExpense()
  const updateExpense                          = useUpdateExpense()
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories()
  const createCategory                         = useCreateExpenseCategory()
  const deleteCategory                         = useDeleteExpenseCategory()
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false)

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
        date:        editingExpense.date,
        category_id: editingExpense.category_id ?? '',
        amount:      editingExpense.amount,
        notes:       editingExpense.notes ?? '',
      })
    } else if (isOpen && !editingExpense) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, editingExpense, reset])

  const onClose = (): void => {
    setOpen(false)
    setEditingExpense(null)
    setCategoryManagerOpen(false)
  }

  const onSubmit = async (values: ExpenseFormValues): Promise<void> => {
    const payload = { ...values, category_id: values.category_id || undefined }
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, payload })
    } else {
      await createExpense.mutateAsync(payload as ExpenseFormValues)
    }
    onClose()
  }

  const categoryManagerOptions: UseCategoryManagerModalOptions = {
    categories,
    isLoading: categoriesLoading,
    onCreate: (name) => createCategory.mutateAsync(name),
    onDelete: (id) => deleteCategory.mutateAsync(id),
    isCreating: createCategory.isPending,
    inUseErrorCode: 'CATEGORY_IN_USE',
    inUseErrorMessage: EXPENSES_LABELS.CATEGORY_IN_USE_ERROR,
    onClose: () => setCategoryManagerOpen(false),
    labels: {
      title:          EXPENSES_LABELS.CATEGORY_MANAGER_TITLE,
      addPlaceholder: EXPENSES_LABELS.CATEGORY_ADD_PLACEHOLDER,
      addBtn:         EXPENSES_LABELS.CATEGORY_ADD_BTN,
      empty:          EXPENSES_LABELS.CATEGORY_EMPTY,
      deleteTitle:    EXPENSES_LABELS.CATEGORY_DELETE_TITLE,
    },
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
    categories,
    isCategoryManagerOpen,
    openCategoryManager: () => setCategoryManagerOpen(true),
    categoryManagerOptions,
    closeSymbol: UI_SYMBOLS.CLOSE,
    currencySymbol: UI_SYMBOLS.CURRENCY,
  }
}
