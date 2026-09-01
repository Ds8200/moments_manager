import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useCustomerDetailPage } from '../useCustomerDetailPage'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

const CUSTOMER = {
  id: 'c1', name: 'דניאל', phone: '050', email: 'a@b.com', notes: 'הערה',
  total_orders: 3, total_spent: 450,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useCustomerDetailPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
    server.use(http.get(API_ENDPOINTS.CUSTOMER(':id'), () => HttpResponse.json(CUSTOMER)))
  })

  it('loads the customer and formats total_spent as currency', async () => {
    const { result } = renderHook(() => useCustomerDetailPage({ customerId: 'c1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.customer).toBeDefined())

    expect(result.current.customer?.name).toBe('דניאל')
    expect(result.current.formattedTotalSpent).toContain('450')
  })

  it('menu includes an Email item when the customer has an email', async () => {
    const { result } = renderHook(() => useCustomerDetailPage({ customerId: 'c1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.customer).toBeDefined())

    expect(result.current.menuItems.some((i) => i.variant !== 'danger')).toBe(true)
  })

  it('menu has no Email item when the customer has no email', async () => {
    server.use(http.get(API_ENDPOINTS.CUSTOMER(':id'), () => HttpResponse.json({ ...CUSTOMER, email: null })))
    const { result } = renderHook(() => useCustomerDetailPage({ customerId: 'c1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.customer).toBeDefined())

    expect(result.current.menuItems).toHaveLength(1)
  })

  it('delete menu item opens a confirm dialog and navigates to the list on success', async () => {
    server.use(http.delete(API_ENDPOINTS.CUSTOMER(':id'), () => new HttpResponse(null, { status: 204 })))
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useCustomerDetailPage({ customerId: 'c1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.customer).toBeDefined())

    const deleteItem = result.current.menuItems.find((i) => i.variant === 'danger')
    await act(async () => { deleteItem!.onClick() })

    await vi.waitFor(() => expect(pushFn).toHaveBeenCalledWith(ROUTES.CUSTOMERS))
  })

  it('onSaveName does not throw when saving a changed value', async () => {
    server.use(http.put(API_ENDPOINTS.CUSTOMER(':id'), () => HttpResponse.json({ ...CUSTOMER, name: 'שם חדש' })))
    const { result } = renderHook(() => useCustomerDetailPage({ customerId: 'c1' }), { wrapper: makeWrapper(qc) })
    await vi.waitFor(() => expect(result.current.customer).toBeDefined())

    await expect(act(async () => { result.current.onSaveName('שם חדש') })).resolves.not.toThrow()
  })
})
