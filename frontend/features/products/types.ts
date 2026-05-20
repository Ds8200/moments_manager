export interface Product {
  id: string
  name: string
  category: string | null
  base_price: string
  base_cost: string
  avg_production_days: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductsResponse {
  items: Product[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ProductFormValues {
  name: string
  category: string
  base_price: string
  base_cost: string
  avg_production_days: number | null
  is_active: boolean
}
