import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useCreateExpense, useUpdateExpense } from '../useExpenses'

const EXPENSE = {
  id: 'e1', date: '2025-01-01', category_id: null, category: null,
  amount: '100', notes: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useExpenses mutations', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('useCreateExpense posts a new expense and succeeds', async () => {
    server.use(http.post(API_ENDPOINTS.EXPENSES, () => HttpResponse.json(EXPENSE, { status: 201 })))
    const { result } = renderHook(() => useCreateExpense(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.mutateAsync({ date: '2025-01-01', category_id: '', amount: '100', notes: '' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useUpdateExpense PUTs the changed fields and succeeds', async () => {
    server.use(http.put(API_ENDPOINTS.EXPENSE(':id'), () => HttpResponse.json({ ...EXPENSE, amount: '150' })))
    const { result } = renderHook(() => useUpdateExpense(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.mutateAsync({ id: 'e1', payload: { amount: '150' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.amount).toBe('150')
  })
})
