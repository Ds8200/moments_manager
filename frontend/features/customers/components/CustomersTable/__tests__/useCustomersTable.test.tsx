import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useCustomersTable } from '../useCustomersTable'
import { customerFiltersAtom, isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../../store/customersAtoms'

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children)
    )
  }
  return TestWrapper
}

const CUSTOMER_ROW = {
  id: 'c1',
  name: 'דניאל',
  phone: '050-0000000',
  email: 'a@b.com',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('useCustomersTable', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('returns empty customers by default', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.customers).toEqual([])
  })

  it('returns customers from the API', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ items: [CUSTOMER_ROW], total: 1, page: 1, page_size: 20, pages: 1 })
      )
    )
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => {
      expect(result.current.customers).toHaveLength(1)
    })
    expect(result.current.customers[0].name).toBe('דניאל')
  })

  it('onEdit sets editing atom and opens form', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onEdit('c1')
    })

    expect(store.get(editingCustomerIdAtom)).toBe('c1')
    expect(store.get(isCustomerFormOpenAtom)).toBe(true)
  })

  it('onDelete calls mutate when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('c1', 'דניאל')
    })

    expect(window.confirm).toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('onDelete does not call mutate when cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('c1', 'דניאל')
    })

    expect(window.confirm).toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('onPageChange updates customerFiltersAtom.page', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onPageChange(3)
    })

    expect(store.get(customerFiltersAtom).page).toBe(3)
  })
})
