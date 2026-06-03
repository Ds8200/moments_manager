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

function makeMockEvent() {
  const el = document.createElement('tr')
  return { currentTarget: el } as unknown as React.MouseEvent<Element>
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

  it('onRowClick opens menu with user name as title', () => {
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.menuState.isOpen).toBe(false)

    act(() => {
      result.current.onRowClick(USER_ROW, makeMockEvent())
    })

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('דניאל')
  })

  it('delete menu item opens confirm dialog with user name', () => {
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(USER_ROW, makeMockEvent())
    })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: `${USERS_LABELS.CONFIRM_DELETE} דניאל?`,
        isDangerous: true,
      }),
    )
  })

  it('delete menu item calls mutate when onConfirm is invoked', () => {
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(USER_ROW, makeMockEvent())
    })
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalled()
  })

  it('onRowClick does nothing when user is the current user', () => {
    const token = 'x.' + btoa(JSON.stringify({ sub: 'u1', role: 'admin' })) + '.y'
    store.set(accessTokenAtom, token)

    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onRowClick(USER_ROW, makeMockEvent())
    })

    expect(result.current.menuState.isOpen).toBe(false)
  })

  it('onPageChange updates usersPageAtom', () => {
    const { result } = renderHook(() => useUsersTable(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onPageChange(3)
    })

    expect(store.get(usersPageAtom)).toBe(3)
  })
})
