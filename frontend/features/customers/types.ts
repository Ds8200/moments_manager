export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Mirrors the backend's CustomerWithStatsSchema (backend/src/customers/schemas.py) exactly —
// it only adds total_orders/total_spent on top of Customer, there is no embedded orders list.
export interface CustomerDetail extends Customer {
  total_orders: number
  total_spent: number
}

export interface CustomersResponse {
  items: Customer[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface CustomerFilters {
  search: string
  page: number
  page_size: number
}

export interface CustomerFormValues {
  name: string
  phone: string
  email: string
  notes: string
}
