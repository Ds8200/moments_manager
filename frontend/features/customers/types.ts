import type { OrderSummary } from '@/features/orders/types'

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerDetail extends Customer {
  orders: OrderSummary[]
  total_orders: number
  total_revenue: string
  total_profit: string
}

export interface CustomersResponse {
  items: Customer[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface CustomerFormValues {
  name: string
  phone: string
  email: string
  notes: string
}
