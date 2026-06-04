'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { ExpenseCategory } from './types'

export const expenseCategoriesApi = {
  list: (): Promise<ExpenseCategory[]> =>
    apiClient<ExpenseCategory[]>(API_ENDPOINTS.EXPENSE_CATEGORIES),

  create: (name: string): Promise<ExpenseCategory> =>
    apiClient<ExpenseCategory>(API_ENDPOINTS.EXPENSE_CATEGORIES, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  update: (id: string, name: string): Promise<ExpenseCategory> =>
    apiClient<ExpenseCategory>(API_ENDPOINTS.EXPENSE_CATEGORY(id), {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.EXPENSE_CATEGORY(id), { method: 'DELETE' }),
}
