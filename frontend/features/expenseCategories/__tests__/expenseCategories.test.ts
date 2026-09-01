import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { expenseCategoriesApi } from '../api'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
} from '../queries/useExpenseCategories'

const CATEGORY = { id: 'cat-1', name: 'דיו', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('expenseCategoriesApi', () => {
  it('list fetches all categories', async () => {
    server.use(http.get(API_ENDPOINTS.EXPENSE_CATEGORIES, () => HttpResponse.json([CATEGORY])))
    const result = await expenseCategoriesApi.list()
    expect(result).toHaveLength(1)
  })

  it('create POSTs a name', async () => {
    server.use(http.post(API_ENDPOINTS.EXPENSE_CATEGORIES, () => HttpResponse.json(CATEGORY, { status: 201 })))
    const result = await expenseCategoriesApi.create('דיו')
    expect(result.name).toBe('דיו')
  })

  it('update PUTs a new name', async () => {
    server.use(http.put(API_ENDPOINTS.EXPENSE_CATEGORY(':id'), () => HttpResponse.json({ ...CATEGORY, name: 'שם חדש' })))
    const result = await expenseCategoriesApi.update('cat-1', 'שם חדש')
    expect(result.name).toBe('שם חדש')
  })

  it('delete sends a DELETE request', async () => {
    server.use(http.delete(API_ENDPOINTS.EXPENSE_CATEGORY(':id'), () => new HttpResponse(null, { status: 204 })))
    await expect(expenseCategoriesApi.delete('cat-1')).resolves.toBeUndefined()
  })
})

describe('useExpenseCategories query hooks', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('useExpenseCategories loads the list', async () => {
    server.use(http.get(API_ENDPOINTS.EXPENSE_CATEGORIES, () => HttpResponse.json([CATEGORY])))
    const { result } = renderHook(() => useExpenseCategories(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
  })

  it('useCreateExpenseCategory invalidates the list on success', async () => {
    server.use(http.post(API_ENDPOINTS.EXPENSE_CATEGORIES, () => HttpResponse.json(CATEGORY, { status: 201 })))
    const { result } = renderHook(() => useCreateExpenseCategory(), { wrapper: makeWrapper(qc) })

    await act(async () => { await result.current.mutateAsync('דיו') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useDeleteExpenseCategory calls the delete endpoint', async () => {
    server.use(http.delete(API_ENDPOINTS.EXPENSE_CATEGORY(':id'), () => new HttpResponse(null, { status: 204 })))
    const { result } = renderHook(() => useDeleteExpenseCategory(), { wrapper: makeWrapper(qc) })

    await act(async () => { await result.current.mutateAsync('cat-1') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
