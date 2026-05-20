'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { expensesApi } from '../api'
import type { Expense, ExpenseFormValues, ExpensesResponse } from '../types'

export const useExpenses = (page = 1): UseQueryResult<ExpensesResponse> =>
  useQuery({
    queryKey: ['expenses', page],
    queryFn: () => expensesApi.list(page),
  })

export const useCreateExpense = (): UseMutationResult<
  Expense,
  Error,
  ExpenseFormValues
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExpenseFormValues) => expensesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export const useUpdateExpense = (): UseMutationResult<
  Expense,
  Error,
  { id: string; payload: Partial<ExpenseFormValues> }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExpenseFormValues> }) =>
      expensesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export const useDeleteExpense = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}
