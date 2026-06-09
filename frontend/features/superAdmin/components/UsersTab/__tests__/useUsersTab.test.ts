import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useUsersTab } from '../useUsersTab'
import { userFiltersAtom } from '../../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children)
    )
  }
  return TestWrapper
}

const USER_RECORD = {
  id: 'user-1',
  email: 'alice@test.com',
  full_name: 'Alice Smith',
  phone: '+972-50-1234567',
  org_count: 2,
  created_at: '2026-01-01T00:00:00Z',
}

const PAGINATED = { items: [USER_RECORD], total: 1, page: 1, page_size: 20, pages: 1 }

function makeMockEvent() {
  const el = document.createElement('tr')
  return { currentTarget: el } as unknown as React.MouseEvent<Element>
}

describe('useUsersTab', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    confirmFn.mockClear()
    notifyError.mockClear()
    notifySuccess.mockClear()
  })

  it('returns empty rows by default', () => {
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.rows).toEqual([])
  })

  it('transforms user API response into UserRow objects', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG_USERS, () => HttpResponse.json(PAGINATED))
    )
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.rows).toHaveLength(1))

    const row = result.current.rows[0]
    expect(row.fullName).toBe('Alice Smith')
    expect(row.email).toBe('alice@test.com')
    expect(row.phone).toBe('+972-50-1234567')
    expect(row.orgCount).toBe(2)
  })

  it('handleDelete with orgCount > 0 calls notify.error without confirm', () => {
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    const row = { id: 'user-1', fullName: 'Alice', email: 'alice@test.com',
      phone: null, orgCount: 1, createdAt: '01/01/2026' }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => deleteItem!.onClick())

    expect(notifyError).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.CANNOT_DELETE_USER_WITH_ORGS)
    expect(confirmFn).not.toHaveBeenCalled()
  })

  it('handleDelete with orgCount === 0 calls confirm with isDangerous', () => {
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    const row = { id: 'user-1', fullName: 'Bob', email: 'bob@test.com',
      phone: null, orgCount: 0, createdAt: '01/01/2026' }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => deleteItem!.onClick())

    expect(notifyError).not.toHaveBeenCalled()
    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({ isDangerous: true })
    )
  })

  it('onPageChange updates userFiltersAtom.page', () => {
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    act(() => result.current.onPageChange(4))
    expect(store.get(userFiltersAtom).page).toBe(4)
  })

  it('filtersBarProps.onSearchChange resets page and updates search', () => {
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    store.set(userFiltersAtom, (f) => ({ ...f, page: 3 }))

    act(() => result.current.filtersBarProps.onSearchChange('bob'))

    const filters = store.get(userFiltersAtom)
    expect(filters.search).toBe('bob')
    expect(filters.page).toBe(1)
  })

  it('filtersBarProps has no newButtonLabel (no add-user button in this tab)', () => {
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.filtersBarProps.newButtonLabel).toBeUndefined()
    expect(result.current.filtersBarProps.onNew).toBeUndefined()
  })

  it('delete mutation success invalidates query and notifies', async () => {
    server.use(
      http.delete(API_ENDPOINTS.ADMIN_ORG_USER(':id'), () => HttpResponse.json({ message: 'ok' }))
    )
    const { result } = renderHook(() => useUsersTab(), { wrapper: makeWrapper(store, qc) })
    const row = { id: 'user-del', fullName: 'Carol', email: 'carol@test.com',
      phone: null, orgCount: 0, createdAt: '01/01/2026' }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => deleteItem!.onClick())

    const call = confirmFn.mock.calls[0][0] as ConfirmDialogOptions
    await act(async () => call.onConfirm())

    await vi.waitFor(() => expect(notifySuccess).toHaveBeenCalledWith(SUPER_ADMIN_LABELS.USER_DELETED_SUCCESS))
  })
})
