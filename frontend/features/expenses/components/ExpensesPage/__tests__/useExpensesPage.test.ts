import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useExpensesPage } from '../useExpensesPage'
import { isExpenseFormOpenAtom } from '../../../store/expensesAtoms'

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children),
    )
  }
  return TestWrapper
}

describe('useExpensesPage', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('totalAmount sums the current page of expenses', async () => {
    server.use(
      http.get(API_ENDPOINTS.EXPENSES, () =>
        HttpResponse.json({
          items: [
            { id: 'e1', date: '2025-01-01', category_id: null, category: null, amount: '100', notes: null, created_at: '', updated_at: '' },
            { id: 'e2', date: '2025-01-02', category_id: null, category: null, amount: '50', notes: null, created_at: '', updated_at: '' },
          ],
          total: 2, page: 1, page_size: 20, pages: 1,
        })
      )
    )
    const { result } = renderHook(() => useExpensesPage(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.totalAmount).toContain('150'))
  })

  it('onNew opens the form', () => {
    server.use(http.get(API_ENDPOINTS.EXPENSES, () => HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 1 })))
    const { result } = renderHook(() => useExpensesPage(), { wrapper: makeWrapper(store, qc) })

    act(() => { result.current.onNew() })

    expect(store.get(isExpenseFormOpenAtom)).toBe(true)
  })
})
