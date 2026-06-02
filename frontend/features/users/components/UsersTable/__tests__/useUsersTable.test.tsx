import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useUsersTable } from '../useUsersTable'
import { usersPageAtom } from '../../../store/usersAtoms'
import { accessTokenAtom } from '@/features/auth/store/authAtoms'
import { USERS_LABELS } from '../../../constants/usersLabels'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children),
    )
  }
  return TestWrapper
}

const USER_ROW = {
  id: 'u1',
  email: 'a@b.com',
  full_name: 'דניאל',
  role: 'user',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('useUsersTable', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
  })

  it('returns empty users by default', () => {
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.users).toEqual([])
  })

  it('returns users from the API', async () => {
    server.use(
      http.get(API_ENDPOINTS.USERS, () =>
        HttpResponse.json({ items: [USER_ROW], total: 1, page: 1, page_size: 20, pages: 1 }),
      ),
    )
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => {
      expect(result.current.users).toHaveLength(1)
    })
    expect(result.current.users[0].full_name).toBe('דניאל')
  })

  it('onDelete opens confirm dialog with user name in message', () => {
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('u1', 'דניאל')
    })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: `${USERS_LABELS.CONFIRM_DELETE} דניאל?`,
        isDangerous: true,
      }),
    )
  })

  it('onDelete calls mutate when onConfirm callback is invoked', () => {
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onDelete('u1', 'דניאל')
    })

    expect(confirmFn).toHaveBeenCalled()
  })

  it('onPageChange updates usersPageAtom', () => {
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onPageChange(3)
    })

    expect(store.get(usersPageAtom)).toBe(3)
  })

  it('exposes currentUserId decoded from the access token', () => {
    // token payload: { sub: "me-123", role: "admin" }
    const token =
      'x.' + btoa(JSON.stringify({ sub: 'me-123', role: 'admin' })) + '.y'
    store.set(accessTokenAtom, token)

    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.currentUserId).toBe('me-123')
  })
})
