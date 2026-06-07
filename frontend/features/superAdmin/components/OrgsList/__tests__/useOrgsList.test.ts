import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgsList } from '../useOrgsList'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import { ORG_PLAN } from '../../../enums/orgPlanEnums'
import { ROUTES } from '@/shared/constants/routes'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const ORG_1 = {
  id: 'org1',
  slug: 'cohen-print',
  name: 'דפוס כהן',
  logo_path: null,
  plan: ORG_PLAN.TRIAL,
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'u1',
  member_count: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const ORG_2 = {
  ...ORG_1,
  id: 'org2',
  slug: 'levy-studio',
  name: 'סטודיו לוי',
  plan: ORG_PLAN.BASIC,
  is_active: false,
}

const PAGE_RESPONSE = { items: [ORG_1, ORG_2], total: 2, page: 1, page_size: 20, pages: 1 }

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrgsList', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
    confirmFn.mockClear()
  })

  it('maps orgs to rows with derived plan and status labels', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGE_RESPONSE)))
    const { result } = renderHook(() => useOrgsList(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.orgs).toHaveLength(2))
    expect(result.current.orgs[0]).toMatchObject({
      id: 'org1',
      planLabel: SUPER_ADMIN_LABELS.PLAN_TRIAL,
      statusLabel: SUPER_ADMIN_LABELS.STATUS_ACTIVE,
      isActive: true,
    })
    expect(result.current.orgs[1]).toMatchObject({
      id: 'org2',
      planLabel: SUPER_ADMIN_LABELS.PLAN_BASIC,
      statusLabel: SUPER_ADMIN_LABELS.STATUS_INACTIVE,
      isActive: false,
    })
  })

  it('exposes the create-org route and label for the add-org button', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGE_RESPONSE)))
    const { result } = renderHook(() => useOrgsList(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.orgs).toHaveLength(2))
    expect(result.current.createOrgHref).toBe(ROUTES.SUPER_ADMIN_NEW_ORG)
    expect(result.current.addOrgLabel).toBe(SUPER_ADMIN_LABELS.ADD_ORG_BUTTON)
  })

  it('activating an inactive org mutates without a confirm dialog', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGE_RESPONSE)),
      http.patch(API_ENDPOINTS.ADMIN_ORG_STATUS('org2'), () => HttpResponse.json({ ...ORG_2, is_active: true })),
    )
    const { result } = renderHook(() => useOrgsList(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.orgs).toHaveLength(2))

    act(() => {
      result.current.onToggleStatus(result.current.orgs[1])
    })

    expect(confirmFn).not.toHaveBeenCalled()
    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_ACTIVATED_SUCCESS))
  })

  it('deactivating requires a confirm dialog', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGE_RESPONSE)))
    const { result } = renderHook(() => useOrgsList(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.orgs).toHaveLength(2))

    act(() => {
      result.current.onToggleStatus(result.current.orgs[0])
    })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: SUPER_ADMIN_LABELS.CONFIRM_DEACTIVATE,
        isDangerous: true,
      }),
    )
  })

  it('deactivating org notifies success when confirmed', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGE_RESPONSE)),
      http.patch(API_ENDPOINTS.ADMIN_ORG_STATUS('org1'), () => HttpResponse.json({ ...ORG_1, is_active: false })),
    )
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useOrgsList(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.orgs).toHaveLength(2))

    act(() => {
      result.current.onToggleStatus(result.current.orgs[0])
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_DEACTIVATED_SUCCESS))
  })

  it('notifies an error when the status toggle fails', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGE_RESPONSE)),
      http.patch(API_ENDPOINTS.ADMIN_ORG_STATUS('org2'), () => HttpResponse.json({ detail: 'bad', code: 'X' }, { status: 409 })),
    )
    const { result } = renderHook(() => useOrgsList(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.orgs).toHaveLength(2))

    act(() => {
      result.current.onToggleStatus(result.current.orgs[1])
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_STATUS_ERROR))
  })
})
