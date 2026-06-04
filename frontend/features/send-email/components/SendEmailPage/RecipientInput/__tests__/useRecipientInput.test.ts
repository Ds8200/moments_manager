import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useRecipientInput } from '../useRecipientInput'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../../types'

const CUSTOMER_WITH_EMAIL: Customer = {
  id: 'c1',
  name: 'דניאל',
  phone: null,
  email: 'daniel@example.com',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const CUSTOMER_WITH_EMAIL_2: Customer = {
  id: 'c3',
  name: 'שרה',
  phone: null,
  email: 'sara@example.com',
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

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

function setupHandlers() {
  server.use(
    http.get(API_ENDPOINTS.CUSTOMERS, () =>
      HttpResponse.json({
        items: [CUSTOMER_WITH_EMAIL, CUSTOMER_WITH_EMAIL_2, CUSTOMER_NO_EMAIL],
        total: 3,
        page: 1,
        page_size: 100,
        pages: 1,
      })
    )
  )
}

describe('useRecipientInput', () => {
  let qc: QueryClient
  let recipients: Recipient[]
  const onToggle = vi.fn()
  const onSelectAll = vi.fn()
  const onClearAll = vi.fn()
  const onAddManual = vi.fn()
  const onRemoveRecipient = vi.fn()

  function renderInput() {
    return renderHook(
      () => useRecipientInput({ recipients, onToggle, onSelectAll, onClearAll, onAddManual, onRemoveRecipient }),
      { wrapper: makeWrapper(qc) }
    )
  }

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    recipients = []
    onToggle.mockClear()
    onSelectAll.mockClear()
    onClearAll.mockClear()
    onAddManual.mockClear()
    onRemoveRecipient.mockClear()
    setupHandlers()
  })

  it('customers returns only those with email', async () => {
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.customers).toHaveLength(2)
    expect(result.current.customers.every((c) => c.email !== null)).toBe(true)
  })

  it('isCustomerSelected is false for unselected customer', async () => {
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isCustomerSelected('c1')).toBe(false)
  })

  it('isCustomerSelected is true for selected customer', async () => {
    recipients = [{ key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' }]
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isCustomerSelected('c1')).toBe(true)
    expect(result.current.isCustomerSelected('c3')).toBe(false)
  })

  it('isAllSelected is true when all customers are recipients', async () => {
    recipients = [
      { key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' },
      { key: 'customer-c3', label: 'שרה', email: 'sara@example.com', customer_id: 'c3' },
    ]
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAllSelected).toBe(true)
  })

  it('isIndeterminate is true when some but not all are selected', async () => {
    recipients = [{ key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' }]
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isIndeterminate).toBe(true)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('onSelectAll calls prop with all email customers', async () => {
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.onSelectAll() })
    expect(onSelectAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'c1' }),
        expect.objectContaining({ id: 'c3' }),
      ])
    )
    expect(onSelectAll.mock.calls[0][0]).toHaveLength(2)
  })

  it('onClearAll calls the onClearAll prop', () => {
    const { result } = renderInput()
    act(() => { result.current.onClearAll() })
    expect(onClearAll).toHaveBeenCalledOnce()
  })

  it('onToggle calls the onToggle prop with the customer', async () => {
    const { result } = renderInput()
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => { result.current.onToggle(CUSTOMER_WITH_EMAIL) })
    expect(onToggle).toHaveBeenCalledWith(CUSTOMER_WITH_EMAIL)
  })

  it('toggleList opens and closes the customer list', () => {
    const { result } = renderInput()
    expect(result.current.isListOpen).toBe(false)
    act(() => { result.current.toggleList() })
    expect(result.current.isListOpen).toBe(true)
    act(() => { result.current.toggleList() })
    expect(result.current.isListOpen).toBe(false)
  })

  it('onAddManual shows error for invalid email', () => {
    const { result } = renderInput()
    act(() => { result.current.onManualInputChange('not-an-email') })
    act(() => { result.current.onAddManual() })
    expect(result.current.manualError).toBeTruthy()
    expect(onAddManual).not.toHaveBeenCalled()
  })

  it('onAddManual calls prop and clears input for valid email', () => {
    const { result } = renderInput()
    act(() => { result.current.onManualInputChange('test@example.com') })
    act(() => { result.current.onAddManual() })
    expect(onAddManual).toHaveBeenCalledWith('test@example.com')
    expect(result.current.manualInput).toBe('')
    expect(result.current.manualError).toBeUndefined()
  })

  it('onManualKeyDown with Enter key triggers add', () => {
    const { result } = renderInput()
    act(() => { result.current.onManualInputChange('hello@test.com') })
    act(() => {
      result.current.onManualKeyDown({
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>)
    })
    expect(onAddManual).toHaveBeenCalledWith('hello@test.com')
  })
})
