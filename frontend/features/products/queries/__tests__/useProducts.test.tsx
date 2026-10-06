import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useUpdateProduct } from '../useProducts'

vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

const PRODUCT_ID = 'p1'

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useUpdateProduct', () => {
  it('invalidates both the products list and the product detail query on success', async () => {
    server.use(
      http.put(API_ENDPOINTS.PRODUCT(PRODUCT_ID), () => HttpResponse.json({ id: PRODUCT_ID })),
    )
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({ id: PRODUCT_ID, payload: { base_cost: '55' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['product', PRODUCT_ID] })
  })
})
