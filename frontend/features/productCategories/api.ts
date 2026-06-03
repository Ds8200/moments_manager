'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { ProductCategory } from './types'

export const productCategoriesApi = {
  list: (): Promise<ProductCategory[]> =>
    apiClient<ProductCategory[]>(API_ENDPOINTS.PRODUCT_CATEGORIES),

  create: (name: string): Promise<ProductCategory> =>
    apiClient<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORIES, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  update: (id: string, name: string): Promise<ProductCategory> =>
    apiClient<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY(id), {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.PRODUCT_CATEGORY(id), { method: 'DELETE' }),
}
