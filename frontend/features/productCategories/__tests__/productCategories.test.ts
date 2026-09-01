import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { productCategoriesApi } from '../api'
import {
  useProductCategories,
  useCreateProductCategory,
  useDeleteProductCategory,
} from '../queries/useProductCategories'

const CATEGORY = { id: 'cat-1', name: 'הדפסות', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('productCategoriesApi', () => {
  it('list fetches all categories', async () => {
    server.use(http.get(API_ENDPOINTS.PRODUCT_CATEGORIES, () => HttpResponse.json([CATEGORY])))
    const result = await productCategoriesApi.list()
    expect(result).toHaveLength(1)
  })

  it('create POSTs a name', async () => {
    server.use(http.post(API_ENDPOINTS.PRODUCT_CATEGORIES, () => HttpResponse.json(CATEGORY, { status: 201 })))
    const result = await productCategoriesApi.create('הדפסות')
    expect(result.name).toBe('הדפסות')
  })

  it('update PUTs a new name', async () => {
    server.use(http.put(API_ENDPOINTS.PRODUCT_CATEGORY(':id'), () => HttpResponse.json({ ...CATEGORY, name: 'שם חדש' })))
    const result = await productCategoriesApi.update('cat-1', 'שם חדש')
    expect(result.name).toBe('שם חדש')
  })

  it('delete sends a DELETE request', async () => {
    server.use(http.delete(API_ENDPOINTS.PRODUCT_CATEGORY(':id'), () => new HttpResponse(null, { status: 204 })))
    await expect(productCategoriesApi.delete('cat-1')).resolves.toBeUndefined()
  })
})

describe('useProductCategories query hooks', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('useProductCategories loads the list', async () => {
    server.use(http.get(API_ENDPOINTS.PRODUCT_CATEGORIES, () => HttpResponse.json([CATEGORY])))
    const { result } = renderHook(() => useProductCategories(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
  })

  it('useCreateProductCategory invalidates the list on success', async () => {
    server.use(http.post(API_ENDPOINTS.PRODUCT_CATEGORIES, () => HttpResponse.json(CATEGORY, { status: 201 })))
    const { result } = renderHook(() => useCreateProductCategory(), { wrapper: makeWrapper(qc) })

    await act(async () => { await result.current.mutateAsync('הדפסות') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useDeleteProductCategory calls the delete endpoint', async () => {
    server.use(http.delete(API_ENDPOINTS.PRODUCT_CATEGORY(':id'), () => new HttpResponse(null, { status: 204 })))
    const { result } = renderHook(() => useDeleteProductCategory(), { wrapper: makeWrapper(qc) })

    await act(async () => { await result.current.mutateAsync('cat-1') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
