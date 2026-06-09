'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { Expense, ExpensesResponse, ExpenseFormValues } from './types'

export const expensesApi = {
  list: (page = 1): Promise<ExpensesResponse> =>
    apiClient<ExpensesResponse>(`${API_ENDPOINTS.EXPENSES}?page=${page}&page_size=20`),

  get: (id: string): Promise<Expense> =>
    apiClient<Expense>(API_ENDPOINTS.EXPENSE(id)),

  create: (payload: ExpenseFormValues): Promise<Expense> =>
    apiClient<Expense>(API_ENDPOINTS.EXPENSES, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<ExpenseFormValues>): Promise<Expense> =>
    apiClient<Expense>(API_ENDPOINTS.EXPENSE(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.EXPENSE(id), { method: 'DELETE' }),
}
