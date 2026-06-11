import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useCreateOrg } from '../useSuperAdminOrgs'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { ORG_PLAN } from '../../enums/orgPlanEnums'
import type { OrgCreatePayload } from '../../types'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const PAYLOAD: OrgCreatePayload = {
  business_name: 'דפוס כהן',
  slug: 'cohen-print',
  owner_email: 'owner@cohen.com',
  owner_full_name: 'דני כהן',
  owner_password: 'supersecret1',
  plan: ORG_PLAN.TRIAL,
}

const ORG_RESPONSE = {
  id: 'org-new-1',
  org_number: 'ORG-2026-0001',
  slug: PAYLOAD.slug,
  name: PAYLOAD.business_name,
  logo_path: null,
  plan: PAYLOAD.plan,
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'owner-1',
  owner_email: PAYLOAD.owner_email ?? '',
  member_count: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useCreateOrg', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('invalidates the orgs list and notifies success on a successful create', async () => {
    server.use(http.post(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(ORG_RESPONSE, { status: 201 })))
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateOrg(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.mutate(PAYLOAD)
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_CREATED_SUCCESS))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'orgs'] })
  })

  it('notifies an error when org creation fails', async () => {
    server.use(
      http.post(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json({ detail: 'taken', code: 'SLUG_TAKEN' }, { status: 409 })),
    )
    const { result } = renderHook(() => useCreateOrg(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.mutate(PAYLOAD)
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_CREATE_ERROR))
    expect(notifySuccess).not.toHaveBeenCalled()
  })
})
