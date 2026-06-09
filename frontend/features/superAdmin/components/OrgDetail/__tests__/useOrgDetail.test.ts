import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgDetail } from '../useOrgDetail'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import { ORG_PLAN } from '../../../enums/orgPlanEnums'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const INITIAL_ORG = {
  id: 'org-1',
  slug: 'test-org',
  name: 'Test Org',
  logo_path: null,
  plan: ORG_PLAN.TRIAL,
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'u1',
  owner_email: 'owner@test.com',
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

describe('useOrgDetail', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG(INITIAL_ORG.id), () => HttpResponse.json(INITIAL_ORG)),
    )
  })

  it('returns the org from initialData and is not editing by default', () => {
    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.org.name).toBe(INITIAL_ORG.name)
    expect(result.current.org.owner_email).toBe(INITIAL_ORG.owner_email)
    expect(result.current.isEditing).toBe(false)
  })

  it('switches to edit mode when onEdit is called', () => {
    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    act(() => result.current.onEdit())

    expect(result.current.isEditing).toBe(true)
  })

  it('returns to view mode when onCancel is called', () => {
    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    act(() => result.current.onEdit())
    act(() => result.current.editFormProps.onCancel())

    expect(result.current.isEditing).toBe(false)
  })

  it('validates slug format in the edit form', async () => {
    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    act(() => result.current.onEdit())

    await act(async () => {
      await result.current.editFormProps.nameInputProps.onChange({
        target: { name: 'name', value: 'Updated Name' },
      })
      await result.current.editFormProps.slugInputProps.onChange({
        target: { name: 'slug', value: 'INVALID SLUG!' },
      })
    })

    await act(async () => {
      await result.current.editFormProps.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>)
    })

    await waitFor(() =>
      expect(result.current.editFormProps.slugError).toBe(SUPER_ADMIN_LABELS.VALIDATION_SLUG),
    )
  })

  it('calls update mutation and exits edit mode on success', async () => {
    const UPDATED_ORG = { ...INITIAL_ORG, name: 'Renamed', slug: 'renamed-org' }
    server.use(
      http.patch(API_ENDPOINTS.ADMIN_ORG(INITIAL_ORG.id), () => HttpResponse.json(UPDATED_ORG)),
    )

    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    act(() => result.current.onEdit())

    await act(async () => {
      await result.current.editFormProps.nameInputProps.onChange({
        target: { name: 'name', value: 'Renamed' },
      })
      await result.current.editFormProps.slugInputProps.onChange({
        target: { name: 'slug', value: 'renamed-org' },
      })
    })

    await act(async () => {
      await result.current.editFormProps.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>)
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_UPDATED_SUCCESS))
    await waitFor(() => expect(result.current.isEditing).toBe(false))
  })

  it('shows error notification when update mutation fails', async () => {
    server.use(
      http.patch(API_ENDPOINTS.ADMIN_ORG(INITIAL_ORG.id), () =>
        HttpResponse.json({ detail: 'conflict', code: 'CONFLICT' }, { status: 409 }),
      ),
    )

    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    act(() => result.current.onEdit())

    await act(async () => {
      await result.current.editFormProps.nameInputProps.onChange({
        target: { name: 'name', value: 'X' },
      })
      await result.current.editFormProps.slugInputProps.onChange({
        target: { name: 'slug', value: 'x' },
      })
    })

    await act(async () => {
      await result.current.editFormProps.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>)
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.ORG_UPDATE_ERROR))
  })

  it('derives planLabel from org.plan', () => {
    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.planLabel).toBe(SUPER_ADMIN_LABELS.PLAN_TRIAL)
  })

  it('formats created_at date correctly', () => {
    const { result } = renderHook(() => useOrgDetail({ initialOrg: INITIAL_ORG }), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.formattedDate).not.toContain('T')
    expect(result.current.formattedDate.length).toBeGreaterThan(0)
  })
})
