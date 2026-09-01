import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { accessTokenAtom, userRoleAtom } from '@/features/auth/store/authAtoms'
import { useUserDetailPage } from '../useUserDetailPage'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

const USER = {
  id: 'u1', email: 'a@b.com', full_name: 'דניאל', role: 'user', is_active: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function adminToken(sub: string): string {
  return 'x.' + btoa(JSON.stringify({ sub, role: 'admin' })) + '.y'
}

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

describe('useUserDetailPage', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
    server.use(http.get(API_ENDPOINTS.USER(':id'), () => HttpResponse.json(USER)))
  })

  it('loads the user', async () => {
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    expect(result.current.user?.full_name).toBe('דניאל')
  })

  it('isOwnRow is true when viewing your own record', async () => {
    store.set(accessTokenAtom, adminToken('u1'))
    store.set(userRoleAtom, 'admin')
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    expect(result.current.isOwnRow).toBe(true)
  })

  it('isOwnRow is false for another user, and the delete menu item is present', async () => {
    store.set(accessTokenAtom, adminToken('someone-else'))
    store.set(userRoleAtom, 'admin')
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    expect(result.current.isOwnRow).toBe(false)
    expect(result.current.menuItems).toHaveLength(1)
  })

  it('menu is empty on your own row — no self-delete', async () => {
    store.set(accessTokenAtom, adminToken('u1'))
    store.set(userRoleAtom, 'admin')
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    expect(result.current.menuItems).toHaveLength(0)
  })

  it('isAdmin reflects the current user role', async () => {
    store.set(accessTokenAtom, adminToken('someone-else'))
    store.set(userRoleAtom, 'admin')
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    expect(result.current.isAdmin).toBe(true)
  })

  it('delete menu item opens a confirm dialog and navigates to the list on success', async () => {
    store.set(accessTokenAtom, adminToken('admin-1'))
    server.use(http.delete(API_ENDPOINTS.USER(':id'), () => new HttpResponse(null, { status: 204 })))
    confirmFn.mockImplementationOnce(({ onConfirm }: ConfirmDialogOptions) => onConfirm())
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    const deleteItem = result.current.menuItems.find((i) => i.variant === 'danger')
    await act(async () => { deleteItem!.onClick() })

    await vi.waitFor(() => expect(pushFn).toHaveBeenCalledWith(ROUTES.USERS))
  })

  it('onRoleChange does not throw when updating the role', async () => {
    server.use(http.patch(API_ENDPOINTS.USER_ROLE(':id'), () => HttpResponse.json({ ...USER, role: 'admin' })))
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    await expect(act(async () => { result.current.onRoleChange('admin') })).resolves.not.toThrow()
  })

  it('onSaveName does not throw when saving your own name', async () => {
    store.set(accessTokenAtom, adminToken('u1'))
    server.use(http.patch(API_ENDPOINTS.ME, () => HttpResponse.json({ ...USER, full_name: 'שם חדש' })))
    const { result } = renderHook(() => useUserDetailPage({ userId: 'u1' }), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.user).toBeDefined())

    await expect(act(async () => { result.current.onSaveName('שם חדש') })).resolves.not.toThrow()
  })
})
