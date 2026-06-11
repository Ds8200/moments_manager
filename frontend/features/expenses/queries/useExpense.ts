'use client'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { expensesApi } from '../api'
import type { Expense } from '../types'

export const useExpense = (id: string | null): UseQueryResult<Expense> =>
  useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.get(id!),
    enabled: id !== null,
  })
