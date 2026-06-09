import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useDeleteOrg, useResetOrgOwnerPassword } from '../useSuperAdminOrgs'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'

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

describe('useDeleteOrg', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('invalidates orgs cache and notifies success on 200', async () => {
    server.use(
      http.delete(API_ENDPOINTS.ADMIN_ORG('org-abc'), () =>
        HttpResponse.json({ message: 'Organization deleted successfully' }),
      ),
    )
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteOrg(), { wrapper: makeWrapper(qc) })

    act(() => result.current.mutate('org-abc'))

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_DELETED_SUCCESS))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'orgs'] })
  })

  it('notifies error on failure', async () => {
    server.use(
      http.delete(API_ENDPOINTS.ADMIN_ORG('org-xyz'), () =>
        HttpResponse.json({ detail: 'not found', code: 'NOT_FOUND' }, { status: 404 }),
      ),
    )
    const { result } = renderHook(() => useDeleteOrg(), { wrapper: makeWrapper(qc) })

    act(() => result.current.mutate('org-xyz'))

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_DELETE_ERROR))
    expect(notifySuccess).not.toHaveBeenCalled()
  })
})

describe('useResetOrgOwnerPassword', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('notifies success on 202', async () => {
    server.use(
      http.post(API_ENDPOINTS.ADMIN_ORG_RESET_PASSWORD('org-abc'), () =>
        HttpResponse.json({ message: 'Password reset email sent to organization owner' }, { status: 202 }),
      ),
    )
    const { result } = renderHook(() => useResetOrgOwnerPassword(), { wrapper: makeWrapper(qc) })

    act(() => result.current.mutate('org-abc'))

    await waitFor(() =>
      expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_PASSWORD_RESET_SUCCESS),
    )
  })

  it('notifies error on failure', async () => {
    server.use(
      http.post(API_ENDPOINTS.ADMIN_ORG_RESET_PASSWORD('org-xyz'), () =>
        HttpResponse.json({ detail: 'not found', code: 'NOT_FOUND' }, { status: 404 }),
      ),
    )
    const { result } = renderHook(() => useResetOrgOwnerPassword(), { wrapper: makeWrapper(qc) })

    act(() => result.current.mutate('org-xyz'))

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_PASSWORD_RESET_ERROR))
    expect(notifySuccess).not.toHaveBeenCalled()
  })
})
