import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useSendEmailPage } from '../useSendEmailPage'
import { SEND_EMAIL_LABELS } from '../../../constants/sendEmailLabels'
import type { Customer } from '@/features/customers/types'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

const CUSTOMER: Customer = {
  id: 'c1',
  name: 'דניאל',
  phone: null,
  email: 'test@example.com',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const CUSTOMER_2: Customer = {
  id: 'c2',
  name: 'שרה',
  phone: null,
  email: 'sara@example.com',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('useSendEmailPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('starts with empty recipients', () => {
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    expect(result.current.recipients).toHaveLength(0)
  })

  it('onToggleRecipient adds customer', () => {
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => { result.current.onToggleRecipient(CUSTOMER) })
    expect(result.current.recipients).toHaveLength(1)
    expect(result.current.recipients[0].customer_id).toBe('c1')
    expect(result.current.recipients[0].email).toBe('test@example.com')
  })

  it('onToggleRecipient removes customer already in list', () => {
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => { result.current.onToggleRecipient(CUSTOMER) })
    act(() => { result.current.onToggleRecipient(CUSTOMER) })
    expect(result.current.recipients).toHaveLength(0)
  })

  it('onSelectAllRecipients replaces list with all provided customers', () => {
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => { result.current.onToggleRecipient(CUSTOMER) })
    act(() => { result.current.onSelectAllRecipients([CUSTOMER, CUSTOMER_2]) })
    expect(result.current.recipients).toHaveLength(2)
    expect(result.current.recipients.map((r) => r.customer_id)).toEqual(['c1', 'c2'])
  })

  it('onClearAllRecipients empties the list', () => {
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => { result.current.onSelectAllRecipients([CUSTOMER, CUSTOMER_2]) })
    act(() => { result.current.onClearAllRecipients() })
    expect(result.current.recipients).toHaveLength(0)
  })

  it('onSubmit sets recipientsError when no recipients', () => {
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => {
      result.current.onSubmit({ subject: 'נושא', body: 'גוף' })
    })
    expect(result.current.recipientsError).toBe(SEND_EMAIL_LABELS.VALIDATION_RECIPIENTS)
  })

  it('onSubmit calls mutation and resets on success', async () => {
    server.use(
      http.post(API_ENDPOINTS.COMPOSE_EMAIL, () =>
        HttpResponse.json({ message: 'Emails queued', sent_to: 1 })
      )
    )
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => { result.current.onToggleRecipient(CUSTOMER) })

    await act(async () => {
      result.current.onSubmit({ subject: 'נושא', body: 'גוף' })
    })

    await vi.waitFor(() => {
      expect(result.current.recipients).toHaveLength(0)
    })
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('onSubmit shows error toast on failure', async () => {
    server.use(
      http.post(API_ENDPOINTS.COMPOSE_EMAIL, () =>
        HttpResponse.json({ detail: 'err' }, { status: 500 })
      )
    )
    const { result } = renderHook(() => useSendEmailPage(), { wrapper: makeWrapper(qc) })
    act(() => { result.current.onToggleRecipient(CUSTOMER) })

    await act(async () => {
      result.current.onSubmit({ subject: 'נושא', body: 'גוף' })
    })

    await vi.waitFor(() => {
      expect(notifyError).toHaveBeenCalled()
    })
  })
})
