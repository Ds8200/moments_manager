import type { ExpenseCategory } from '@/features/expenseCategories/types'

export type { ExpenseCategory }

export interface Expense {
  id: string
  date: string
  category_id: string | null
  category: ExpenseCategory | null
  amount: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ExpensesResponse {
  items: Expense[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ExpenseFormValues {
  date: string
  category_id: string
  amount: string
  notes: string
}
