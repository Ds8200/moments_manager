import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useEmailDialog } from '../useEmailDialog'
import { emailingCustomerIdAtom } from '../../../store/customersAtoms'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const CUSTOMER = {
  id: 'c1',
  name: 'דניאל',
  phone: null,
  email: 'test@example.com',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

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

describe('useEmailDialog', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('isOpen is false when emailingCustomerIdAtom is null', () => {
    const { result } = renderHook(() => useEmailDialog(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isOpen).toBe(false)
  })

  it('isOpen is true when emailingCustomerIdAtom has a value', () => {
    store.set(emailingCustomerIdAtom, 'c1')
    const { result } = renderHook(() => useEmailDialog(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isOpen).toBe(true)
  })

  it('onClose resets emailingCustomerIdAtom to null', () => {
    store.set(emailingCustomerIdAtom, 'c1')
    const { result } = renderHook(() => useEmailDialog(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onClose()
    })

    expect(store.get(emailingCustomerIdAtom)).toBeNull()
  })

  it('shows customer name when customer data is loaded', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMER('c1'), () => HttpResponse.json({ ...CUSTOMER, total_orders: 0, total_spent: 0 }))
    )
    store.set(emailingCustomerIdAtom, 'c1')
    const { result } = renderHook(() => useEmailDialog(), { wrapper: makeWrapper(store, qc) })

    await vi.waitFor(() => {
      expect(result.current.customerNameSuffix).toBe('— דניאל')
    })
  })

  it('onSubmit calls mutation and closes on success', async () => {
    server.use(
      http.post(API_ENDPOINTS.CUSTOMER_SEND_EMAIL('c1'), () =>
        HttpResponse.json({ message: 'Email queued for delivery' })
      )
    )
    store.set(emailingCustomerIdAtom, 'c1')
    const { result } = renderHook(() => useEmailDialog(), { wrapper: makeWrapper(store, qc) })

    await act(async () => {
      result.current.onSubmit({ subject: 'נושא', body: 'גוף' })
    })

    await vi.waitFor(() => {
      expect(store.get(emailingCustomerIdAtom)).toBeNull()
    })
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('onSubmit shows error toast on failure', async () => {
    server.use(
      http.post(API_ENDPOINTS.CUSTOMER_SEND_EMAIL('c1'), () =>
        HttpResponse.json({ detail: 'err', code: 'CONFLICT' }, { status: 409 })
      )
    )
    store.set(emailingCustomerIdAtom, 'c1')
    const { result } = renderHook(() => useEmailDialog(), { wrapper: makeWrapper(store, qc) })

    await act(async () => {
      result.current.onSubmit({ subject: 'נושא', body: 'גוף' })
    })

    await vi.waitFor(() => {
      expect(notifyError).toHaveBeenCalled()
    })
  })
})
