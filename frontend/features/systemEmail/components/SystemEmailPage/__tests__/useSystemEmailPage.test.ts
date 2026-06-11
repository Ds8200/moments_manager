import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useSystemEmailPage } from '../useSystemEmailPage'
import { SYSTEM_EMAIL_LABELS } from '../../../constants/systemEmailLabels'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const ORG_OWNERS = [
  { user_id: 'u1', email: 'owner1@example.com', full_name: 'Owner One', org_name: 'Org 1', org_id: 'org1' },
  { user_id: 'u2', email: 'owner2@example.com', full_name: 'Owner Two', org_name: 'Org 2', org_id: 'org2' },
]

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useSystemEmailPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('exposes page title and labels', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)))
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })
    expect(result.current.pageTitle).toBe(SYSTEM_EMAIL_LABELS.PAGE_TITLE)
    expect(result.current.sendLabel).toBe(SYSTEM_EMAIL_LABELS.SEND)
  })

  it('starts with empty recipients list', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)))
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })
    expect(result.current.recipients).toHaveLength(0)
  })

  it('toggles an org owner as recipient', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)))
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onToggleRecipient(ORG_OWNERS[0])
    })
    expect(result.current.recipients).toHaveLength(1)
    expect(result.current.recipients[0].user_id).toBe('u1')

    act(() => {
      result.current.onToggleRecipient(ORG_OWNERS[0])
    })
    expect(result.current.recipients).toHaveLength(0)
  })

  it('adds a manual email as recipient', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)))
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onAddManualRecipient('manual@example.com')
    })
    expect(result.current.recipients).toHaveLength(1)
    expect(result.current.recipients[0].email).toBe('manual@example.com')
    expect(result.current.recipients[0].user_id).toBeUndefined()
  })

  it('sets recipients error when submitting with no recipients', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)))
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.onSubmit({ subject: 'Test', body: 'Body' })
    })

    expect(result.current.recipientsError).toBe(SYSTEM_EMAIL_LABELS.VALIDATION_RECIPIENTS)
  })

  it('notifies success after sending email', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)),
      http.post(API_ENDPOINTS.ADMIN_EMAIL_COMPOSE, () =>
        HttpResponse.json({ message: 'sent', sent_to: 1 }),
      ),
    )
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onToggleRecipient(ORG_OWNERS[0])
    })

    await act(async () => {
      await result.current.onSubmit({ subject: 'Hello', body: 'World' })
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SYSTEM_EMAIL_LABELS.SEND_SUCCESS))
    expect(result.current.recipients).toHaveLength(0)
  })

  it('notifies error when sending email fails', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG_OWNERS, () => HttpResponse.json(ORG_OWNERS)),
      http.post(API_ENDPOINTS.ADMIN_EMAIL_COMPOSE, () =>
        HttpResponse.json({ detail: 'SMTP not configured', code: 'PLATFORM_EMAIL_NOT_CONFIGURED' }, { status: 409 }),
      ),
    )
    const { result } = renderHook(() => useSystemEmailPage(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onToggleRecipient(ORG_OWNERS[0])
    })

    await act(async () => {
      await result.current.onSubmit({ subject: 'Hello', body: 'World' })
    })

    expect(notifyError).toHaveBeenCalledWith(SYSTEM_EMAIL_LABELS.SEND_ERROR)
  })
})
