import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgMembersSection } from '../useOrgMembersSection'
import { ORG_SETTINGS_LABELS } from '../../../../constants/orgSettingsLabels'
import { ORG_ROLE } from '../../../../enums/orgRoleEnums'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const MEMBERS = [
  {
    id: 'm1',
    user_id: 'u1',
    organization_id: 'org1',
    role: ORG_ROLE.OWNER,
    is_active: true,
    joined_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'm2',
    user_id: 'u2',
    organization_id: 'org1',
    role: ORG_ROLE.MEMBER,
    is_active: false,
    joined_at: null,
    created_at: '2026-02-01T00:00:00Z',
  },
]

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrgMembersSection', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
    confirmFn.mockClear()
  })

  it('maps members to rows with role and status labels', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME_MEMBERS, () => HttpResponse.json(MEMBERS)))
    const { result } = renderHook(() => useOrgMembersSection(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.members).toHaveLength(2))
    expect(result.current.members[0]).toEqual({
      id: 'm1',
      userId: 'u1',
      roleLabel: ORG_SETTINGS_LABELS.ROLE_OWNER,
      statusLabel: ORG_SETTINGS_LABELS.STATUS_ACTIVE,
      joinedAt: '2026-01-01T00:00:00Z',
    })
    expect(result.current.members[1]).toEqual({
      id: 'm2',
      userId: 'u2',
      roleLabel: ORG_SETTINGS_LABELS.ROLE_MEMBER,
      statusLabel: ORG_SETTINGS_LABELS.STATUS_INACTIVE,
      joinedAt: null,
    })
  })

  it('returns an empty list when there are no members', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME_MEMBERS, () => HttpResponse.json([])))
    const { result } = renderHook(() => useOrgMembersSection(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.members).toEqual([])
  })

  it('opens a confirmation dialog before removing a member', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME_MEMBERS, () => HttpResponse.json(MEMBERS)))
    const { result } = renderHook(() => useOrgMembersSection(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.members).toHaveLength(2))

    act(() => {
      result.current.onRemove('u2')
    })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: ORG_SETTINGS_LABELS.CONFIRM_REMOVE_MEMBER,
        isDangerous: true,
      }),
    )
  })

  it('removes the member and notifies success when the dialog is confirmed', async () => {
    server.use(
      http.get(API_ENDPOINTS.ORGS_ME_MEMBERS, () => HttpResponse.json(MEMBERS)),
      http.delete(API_ENDPOINTS.ORGS_ME_MEMBER('u2'), () => new HttpResponse(null, { status: 204 })),
    )
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useOrgMembersSection(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.members).toHaveLength(2))

    act(() => {
      result.current.onRemove('u2')
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(ORG_SETTINGS_LABELS.MEMBER_REMOVED_SUCCESS))
  })

  it('notifies an error when removing a member fails', async () => {
    server.use(
      http.get(API_ENDPOINTS.ORGS_ME_MEMBERS, () => HttpResponse.json(MEMBERS)),
      http.delete(API_ENDPOINTS.ORGS_ME_MEMBER('u2'), () => HttpResponse.json({ detail: 'bad', code: 'X' }, { status: 409 })),
    )
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useOrgMembersSection(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.members).toHaveLength(2))

    act(() => {
      result.current.onRemove('u2')
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(ORG_SETTINGS_LABELS.MEMBER_REMOVE_ERROR))
  })
})
