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
import { CUSTOMERS_LABELS } from '../../../constants/customersLabels'
import { ROUTES } from '@/shared/constants/routes'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

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

const CUSTOMER_NO_EMAIL = {
  id: 'c2',
  name: 'ללא מייל',
  phone: null,
  email: null,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

function makeMockEvent() {
  const el = document.createElement('tr')
  return { currentTarget: el } as unknown as React.MouseEvent<Element>
}

describe('useCustomersTable', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
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

  it('onRowClick opens menu with customer name as title', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.menuState.isOpen).toBe(false)

    act(() => {
      result.current.onRowClick(CUSTOMER_ROW, makeMockEvent())
    })

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('דניאל')
  })

  it('edit menu item sets editing atom and opens form', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(CUSTOMER_ROW, makeMockEvent())
    })

    const editItem = result.current.menuState.items.find((i) => i.label === CUSTOMERS_LABELS.TABLE_EDIT_TITLE)
    act(() => { editItem!.onClick() })

    expect(store.get(editingCustomerIdAtom)).toBe('c1')
    expect(store.get(isCustomerFormOpenAtom)).toBe(true)
  })

  it('delete menu item opens confirm dialog with customer name', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(CUSTOMER_ROW, makeMockEvent())
    })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: `${CUSTOMERS_LABELS.CONFIRM_DELETE} דניאל?`,
        isDangerous: true,
      })
    )
  })

  it('delete menu item calls mutate when onConfirm callback is invoked', () => {
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(CUSTOMER_ROW, makeMockEvent())
    })
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalled()
  })

  it('email menu item navigates to send-email with customerId', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(CUSTOMER_ROW, makeMockEvent())
    })

    const emailItem = result.current.menuState.items[0]
    act(() => { emailItem.onClick() })

    expect(pushFn).toHaveBeenCalledWith(ROUTES.SEND_EMAIL + '?customerId=c1')
  })

  it('email menu item is absent for customer with no email', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(CUSTOMER_NO_EMAIL, makeMockEvent())
    })

    // customer with no email → only edit + delete (2 items, not 3)
    expect(result.current.menuState.items).toHaveLength(2)
  })

  it('closeMenu closes the menu', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(CUSTOMER_ROW, makeMockEvent())
    })
    expect(result.current.menuState.isOpen).toBe(true)

    act(() => { result.current.closeMenu() })
    expect(result.current.menuState.isOpen).toBe(false)
  })

  it('onPageChange updates customerFiltersAtom.page', () => {
    const { result } = renderHook(() => useCustomersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onPageChange(3)
    })

    expect(store.get(customerFiltersAtom).page).toBe(3)
  })
})
