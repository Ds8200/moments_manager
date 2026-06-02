'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { Product, ProductsResponse, ProductFormValues } from './types'

export const productsApi = {
  list: (page = 1, search = '', isActive: boolean | null = null): Promise<ProductsResponse> => {
    const params = new URLSearchParams({ page: String(page), page_size: '20' })
    if (search) params.set('search', search)
    if (isActive !== null) params.set('is_active', String(isActive))
    return apiClient<ProductsResponse>(`${API_ENDPOINTS.PRODUCTS}?${params}`)
  },

  get: (id: string): Promise<Product> =>
    apiClient<Product>(API_ENDPOINTS.PRODUCT(id)),

  create: (payload: ProductFormValues): Promise<Product> =>
    apiClient<Product>(API_ENDPOINTS.PRODUCTS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<ProductFormValues>): Promise<Product> =>
    apiClient<Product>(API_ENDPOINTS.PRODUCT(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.PRODUCT(id), { method: 'DELETE' }),
}
