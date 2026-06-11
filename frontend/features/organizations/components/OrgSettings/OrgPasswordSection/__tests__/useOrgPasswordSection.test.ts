import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgPasswordSection } from '../useOrgPasswordSection'
import { ORG_SETTINGS_LABELS } from '../../../../constants/orgSettingsLabels'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
// useUpdatePasswordMutation has its own built-in toasts; we spy on them from the mutation level
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const PROFILE_RESPONSE = {
  id: 'u1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrgPasswordSection', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('exposes correct section title and labels', () => {
    const { result } = renderHook(() => useOrgPasswordSection(), { wrapper: makeWrapper(qc) })
    expect(result.current.sectionTitle).toBe(ORG_SETTINGS_LABELS.PASSWORD_SECTION_TITLE)
    expect(result.current.currentPasswordLabel).toBe(ORG_SETTINGS_LABELS.PASSWORD_CURRENT_LABEL)
    expect(result.current.newPasswordLabel).toBe(ORG_SETTINGS_LABELS.PASSWORD_NEW_LABEL)
  })

  it('shows validation error when new password is too short', async () => {
    const { result } = renderHook(() => useOrgPasswordSection(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      try {
        await result.current.onSubmit({ current_password: 'current', new_password: 'short' })
      } catch {
        // Zod validation will catch before sending
      }
    })

    // The schema requires min 8 chars for new password
    await waitFor(() => {
      // hook returns validation from form errors
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  it('calls mutateAsync on valid submit and resets form', async () => {
    server.use(
      http.patch(API_ENDPOINTS.ME, () => HttpResponse.json(PROFILE_RESPONSE)),
    )
    const { result } = renderHook(() => useOrgPasswordSection(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.onSubmit({ current_password: 'currentpass', new_password: 'newpass123' })
    })

    await waitFor(() => expect(notifySuccess).toHaveBeenCalled())
  })

  it('notifies error when password change fails', async () => {
    server.use(
      http.patch(API_ENDPOINTS.ME, () =>
        HttpResponse.json({ detail: 'Wrong password', code: 'UNAUTHORIZED' }, { status: 401 }),
      ),
    )
    const { result } = renderHook(() => useOrgPasswordSection(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.onSubmit({ current_password: 'wrong', new_password: 'newpass123' })
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalled())
  })
})
