import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useDeleteOrgUser } from '../useSuperAdminUsers'
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

describe('useDeleteOrgUser', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('invalidates org-users cache and notifies success on 200', async () => {
    server.use(
      http.delete(API_ENDPOINTS.ADMIN_ORG_USER('user-abc'), () =>
        HttpResponse.json({ message: 'User deleted successfully' }),
      ),
    )
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteOrgUser(), { wrapper: makeWrapper(qc) })

    act(() => result.current.mutate('user-abc'))

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.USER_DELETED_SUCCESS))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'org-users'] })
  })

  it('notifies error on failure', async () => {
    server.use(
      http.delete(API_ENDPOINTS.ADMIN_ORG_USER('user-xyz'), () =>
        HttpResponse.json({ detail: 'has orgs', code: 'CONFLICT' }, { status: 409 }),
      ),
    )
    const { result } = renderHook(() => useDeleteOrgUser(), { wrapper: makeWrapper(qc) })

    act(() => result.current.mutate('user-xyz'))

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.USER_DELETE_ERROR))
    expect(notifySuccess).not.toHaveBeenCalled()
  })
})
