import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useSysAdminPasswordSection } from '../useSysAdminPasswordSection'
import { SYSTEM_SETTINGS_LABELS } from '../../../../constants/systemSettingsLabels'

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

describe('useSysAdminPasswordSection', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('exposes correct labels', () => {
    const { result } = renderHook(() => useSysAdminPasswordSection(), { wrapper: makeWrapper(qc) })
    expect(result.current.sectionTitle).toBe(SYSTEM_SETTINGS_LABELS.PASSWORD_SECTION_TITLE)
    expect(result.current.currentPasswordLabel).toBe(SYSTEM_SETTINGS_LABELS.CURRENT_PASSWORD_LABEL)
    expect(result.current.newPasswordLabel).toBe(SYSTEM_SETTINGS_LABELS.NEW_PASSWORD_LABEL)
  })

  it('shows validation error when new password is too short', async () => {
    const { result } = renderHook(() => useSysAdminPasswordSection(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)({
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.FormEvent)
    })

    await waitFor(() => {
      expect(result.current.currentPasswordError).toBeDefined()
    })
  })

  it('notifies success after successful password change', async () => {
    server.use(
      http.patch(API_ENDPOINTS.ADMIN_SETTINGS_PASSWORD, () =>
        HttpResponse.json({ message: 'Password changed' }),
      ),
    )
    const { result } = renderHook(() => useSysAdminPasswordSection(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.onSubmit({ current_password: 'oldpass123', new_password: 'newpass123' })
    })

    expect(notifySuccess).toHaveBeenCalledWith(SYSTEM_SETTINGS_LABELS.PASSWORD_CHANGE_SUCCESS)
  })

  it('notifies error when password change fails', async () => {
    server.use(
      http.patch(API_ENDPOINTS.ADMIN_SETTINGS_PASSWORD, () =>
        HttpResponse.json({ detail: 'Wrong password', code: 'UNAUTHORIZED' }, { status: 401 }),
      ),
    )
    const { result } = renderHook(() => useSysAdminPasswordSection(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.onSubmit({ current_password: 'wrong', new_password: 'newpass123' })
    })

    expect(notifyError).toHaveBeenCalledWith(SYSTEM_SETTINGS_LABELS.PASSWORD_CHANGE_ERROR)
  })
})
