import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useRecipientInput } from '../useRecipientInput'
import type { Recipient } from '../../../../types'

const CUSTOMER_WITH_EMAIL_2 = {
  id: 'c3',
  name: 'שרה',
  phone: null,
  email: 'sara@example.com',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const CUSTOMER_WITH_EMAIL = {
  id: 'c1',
  name: 'דניאל',
  phone: null,
  email: 'daniel@example.com',
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

const ALL_EMAIL_RESPONSE = {
  items: [CUSTOMER_WITH_EMAIL, CUSTOMER_WITH_EMAIL_2],
  total: 2,
  page: 1,
  page_size: 100,
  pages: 1,
}

function setupHandlers() {
  server.use(
    http.get(API_ENDPOINTS.CUSTOMERS, ({ request }) => {
      const url = new URL(request.url)
      if (url.searchParams.get('has_email') === 'true') {
        return HttpResponse.json(ALL_EMAIL_RESPONSE)
      }
      return HttpResponse.json({
        items: [CUSTOMER_WITH_EMAIL, CUSTOMER_NO_EMAIL],
        total: 2,
        page: 1,
        page_size: 20,
        pages: 1,
      })
    })
  )
}

describe('useRecipientInput', () => {
  let qc: QueryClient
  let recipients: Recipient[]
  const onAdd = vi.fn()
  const onRemove = vi.fn()
  const onAddAll = vi.fn()
  const onClearAll = vi.fn()

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    recipients = []
    onAdd.mockClear()
    onRemove.mockClear()
    onAddAll.mockClear()
    onClearAll.mockClear()
    setupHandlers()
  })

  it('filters out customers with no email', async () => {
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    await vi.waitFor(() => {
      expect(result.current.customerOptions).toHaveLength(1)
    })
    expect(result.current.customerOptions[0].value).toBe('c1')
  })

  it('onCustomerSelect calls onAdd with correct recipient', () => {
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => {
      result.current.onCustomerSelect('c1', {
        value: 'c1',
        label: 'דניאל (daniel@example.com)',
        data: CUSTOMER_WITH_EMAIL,
      })
    })
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'daniel@example.com', customer_id: 'c1' })
    )
  })

  it('onFreeTextEmail adds valid email', () => {
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => {
      result.current.onFreeTextEmail('test@example.com')
    })
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', key: 'manual-test@example.com' })
    )
  })

  it('onFreeTextEmail ignores invalid email', () => {
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => {
      result.current.onFreeTextEmail('not-an-email')
    })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('onFreeTextEmail ignores duplicate email', () => {
    recipients = [{ key: 'manual-test@example.com', label: 'test@example.com', email: 'test@example.com' }]
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => {
      result.current.onFreeTextEmail('test@example.com')
    })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('filters already-selected customers from options', async () => {
    recipients = [{ key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' }]
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.customerOptions).toHaveLength(0)
  })

  it('onSelectAll calls onAddAll with all unselected email customers', async () => {
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    await vi.waitFor(() => expect(result.current.isLoadingAll).toBe(false))
    act(() => {
      result.current.onSelectAll()
    })
    expect(onAddAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ customer_id: 'c1' }),
        expect.objectContaining({ customer_id: 'c3' }),
      ])
    )
  })

  it('onSelectAll skips already-selected customers', async () => {
    recipients = [{ key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' }]
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    await vi.waitFor(() => expect(result.current.isLoadingAll).toBe(false))
    act(() => {
      result.current.onSelectAll()
    })
    const called = onAddAll.mock.calls[0][0] as Recipient[]
    expect(called.every((r) => r.customer_id !== 'c1')).toBe(true)
    expect(called).toHaveLength(1)
    expect(called[0].customer_id).toBe('c3')
  })

  it('isAllSelected is true when all email customers are already recipients', async () => {
    recipients = [
      { key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' },
      { key: 'customer-c3', label: 'שרה', email: 'sara@example.com', customer_id: 'c3' },
    ]
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    await vi.waitFor(() => expect(result.current.isLoadingAll).toBe(false))
    expect(result.current.isAllSelected).toBe(true)
  })

  it('onClearAll calls the onClearAll prop', () => {
    recipients = [{ key: 'customer-c1', label: 'דניאל', email: 'daniel@example.com', customer_id: 'c1' }]
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    act(() => {
      result.current.onClearAll()
    })
    expect(onClearAll).toHaveBeenCalledOnce()
  })

  it('hasAnyRecipients is false when recipients is empty', () => {
    const { result } = renderHook(
      () => useRecipientInput({ recipients, onAdd, onRemove, onAddAll, onClearAll }),
      { wrapper: makeWrapper(qc) }
    )
    expect(result.current.hasAnyRecipients).toBe(false)
  })
})
