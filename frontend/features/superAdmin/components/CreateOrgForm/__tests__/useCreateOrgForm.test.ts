import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useCreateOrgForm, type UseCreateOrgFormReturn } from '../useCreateOrgForm'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import { ORG_PLAN } from '../../../enums/orgPlanEnums'
import { ROUTES } from '@/shared/constants/routes'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

const VALID_VALUES = {
  business_name: 'דפוס כהן',
  slug: 'cohen-print',
  owner_email: 'owner@cohen.com',
  owner_full_name: 'דני כהן',
  owner_password: 'supersecret1',
  plan: ORG_PLAN.TRIAL,
}

const ORG_RESPONSE = {
  id: 'org-new-1',
  slug: VALID_VALUES.slug,
  name: VALID_VALUES.business_name,
  logo_path: null,
  plan: VALID_VALUES.plan,
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'owner-1',
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

type FieldName = 'business_name' | 'slug' | 'owner_email' | 'owner_full_name' | 'owner_password'

const fillField = async (
  result: { current: UseCreateOrgFormReturn },
  name: FieldName,
  value: string,
): Promise<void> => {
  await act(async () => {
    await result.current.register(name).onChange({ target: { name, value } })
  })
}

const fillForm = async (
  result: { current: UseCreateOrgFormReturn },
  overrides: Partial<Record<FieldName, string>> = {},
): Promise<void> => {
  const values = { ...VALID_VALUES, ...overrides }
  await fillField(result, 'business_name', values.business_name)
  await fillField(result, 'slug', values.slug)
  await fillField(result, 'owner_full_name', values.owner_full_name)
  await fillField(result, 'owner_email', values.owner_email)
  await fillField(result, 'owner_password', values.owner_password)
}

describe('useCreateOrgForm', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    pushMock.mockClear()
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('rejects a slug containing spaces or uppercase letters', async () => {
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    await fillForm(result, { slug: 'My Org' })
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.slug?.message).toBe(SUPER_ADMIN_LABELS.VALIDATION_SLUG)
  })

  it('accepts a lowercase, dash-separated slug', async () => {
    server.use(http.post(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(ORG_RESPONSE, { status: 201 })))
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    await fillForm(result)
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.slug).toBeUndefined()
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(ROUTES.SUPER_ADMIN_ORGS))
  })

  it('rejects an invalid email address', async () => {
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    await fillForm(result, { owner_email: 'notanemail' })
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.owner_email?.message).toBe(SUPER_ADMIN_LABELS.VALIDATION_EMAIL)
  })

  it('rejects a password shorter than 8 characters', async () => {
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    await fillForm(result, { owner_password: 'short' })
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.owner_password?.message).toBe(SUPER_ADMIN_LABELS.VALIDATION_PASSWORD_MIN)
  })

  it('navigates to the orgs list on a successful submit', async () => {
    server.use(http.post(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(ORG_RESPONSE, { status: 201 })))
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    await fillForm(result)
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(ROUTES.SUPER_ADMIN_ORGS))
  })

  it('shows the submitting label while the mutation is pending', async () => {
    server.use(
      http.post(API_ENDPOINTS.ADMIN_ORGS, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json(ORG_RESPONSE, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    expect(result.current.submitLabel).toBe(SUPER_ADMIN_LABELS.SUBMIT_CREATE_ORG)

    await fillForm(result)
    act(() => {
      void result.current.handleSubmit(result.current.onSubmit)()
    })

    await waitFor(() => expect(result.current.submitLabel).toBe(SUPER_ADMIN_LABELS.SUBMITTING))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(ROUTES.SUPER_ADMIN_ORGS))
  })

  it('navigates back to the orgs list when onBack is called', () => {
    const { result } = renderHook(() => useCreateOrgForm(), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onBack()
    })

    expect(pushMock).toHaveBeenCalledWith(ROUTES.SUPER_ADMIN_ORGS)
  })
})
