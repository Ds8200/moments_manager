export type ExpenseCategory = 'ink' | 'materials' | 'equipment' | 'shipping' | 'utilities' | 'other'

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
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
  category: ExpenseCategory
  amount: string
  notes: string
}
