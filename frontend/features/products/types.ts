import type { ProductCategory } from '@/features/productCategories/types'

export type { ProductCategory }

export interface Product {
  id: string
  name: string
  category_id: string | null
  category: ProductCategory | null
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

export interface ProductFilters {
  search: string
  is_active: boolean | null
  page: number
  page_size: number
}

export interface ProductFormValues {
  name: string
  category_id: string
  base_price: string
  base_cost: string
  avg_production_days: number | null
  is_active: boolean
}
