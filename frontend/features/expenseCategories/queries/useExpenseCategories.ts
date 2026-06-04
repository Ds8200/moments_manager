'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { expenseCategoriesApi } from '../api'
import type { ExpenseCategory } from '../types'

export const EXPENSE_CATEGORIES_KEY = ['expense-categories'] as const

export const useExpenseCategories = (): UseQueryResult<ExpenseCategory[]> =>
  useQuery({
    queryKey: EXPENSE_CATEGORIES_KEY,
    queryFn: () => expenseCategoriesApi.list(),
  })

export const useCreateExpenseCategory = (): UseMutationResult<ExpenseCategory, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => expenseCategoriesApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_KEY })
    },
  })
}

export const useDeleteExpenseCategory = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expenseCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_KEY })
    },
  })
}
