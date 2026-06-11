import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useInviteMemberForm } from '../useInviteMemberForm'
import { ORG_SETTINGS_LABELS } from '../../../../../constants/orgSettingsLabels'
import { ONBOARDING_LABELS } from '../../../../../constants/onboardingLabels'
import { ORG_ROLE } from '../../../../../enums/orgRoleEnums'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const INVITE_RESPONSE = {
  id: 'inv1',
  organization_id: 'org1',
  email: 'colleague@example.com',
  role: ORG_ROLE.MEMBER,
  expires_at: '2026-07-01T00:00:00Z',
  accepted_at: null,
  created_at: '2026-06-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

async function fillField(
  result: { current: ReturnType<typeof useInviteMemberForm> },
  field: 'email' | 'role',
  value: string,
): Promise<void> {
  await act(async () => {
    await result.current.register(field).onChange({ target: { name: field, value } })
  })
}

describe('useInviteMemberForm', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('rejects an empty email', async () => {
    const { result } = renderHook(() => useInviteMemberForm(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.email?.message).toBe(ORG_SETTINGS_LABELS.EMAIL_REQUIRED)
  })

  it('rejects an invalid email', async () => {
    const { result } = renderHook(() => useInviteMemberForm(), { wrapper: makeWrapper(qc) })

    await fillField(result, 'email', 'not-an-email')
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.email?.message).toBe(ORG_SETTINGS_LABELS.EMAIL_INVALID)
  })

  it('sends the invite and notifies success', async () => {
    server.use(http.post(API_ENDPOINTS.ORGS_ME_INVITE, () => HttpResponse.json(INVITE_RESPONSE)))
    const { result } = renderHook(() => useInviteMemberForm(), { wrapper: makeWrapper(qc) })

    await fillField(result, 'email', 'colleague@example.com')
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(ONBOARDING_LABELS.INVITE_SENT_SUCCESS))
  })

  it('notifies an error when the invite fails', async () => {
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_INVITE, () => HttpResponse.json({ detail: 'bad', code: 'X' }, { status: 409 })),
    )
    const { result } = renderHook(() => useInviteMemberForm(), { wrapper: makeWrapper(qc) })

    await fillField(result, 'email', 'colleague@example.com')
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(ONBOARDING_LABELS.INVITE_ERROR))
  })

  it('exposes the role options labels', () => {
    const { result } = renderHook(() => useInviteMemberForm(), { wrapper: makeWrapper(qc) })

    expect(result.current.adminRoleLabel).toBe(ORG_SETTINGS_LABELS.ROLE_ADMIN)
    expect(result.current.memberRoleLabel).toBe(ORG_SETTINGS_LABELS.ROLE_MEMBER)
  })
})
