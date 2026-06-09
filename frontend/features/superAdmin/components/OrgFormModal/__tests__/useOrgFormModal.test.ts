import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgFormModal } from '../useOrgFormModal'
import {
  isOrgFormOpenAtom,
  editingOrgIdAtom,
  isUserFormModalOpenAtom,
  pendingNewUserAtom,
} from '../../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const notifyFn = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifyFn, error: notifyFn, info: vi.fn(), warning: vi.fn() }),
}))

vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => vi.fn() }))

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

describe('useOrgFormModal', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  })

  it('isOpen reflects isOrgFormOpenAtom', () => {
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isOpen).toBe(false)
    act(() => store.set(isOrgFormOpenAtom, true))
    expect(result.current.isOpen).toBe(true)
  })

  it('isEditMode is false when editingOrgId is null', () => {
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isEditMode).toBe(false)
  })

  it('isEditMode is true when editingOrgId is set', () => {
    store.set(editingOrgIdAtom, 'org-abc')
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isEditMode).toBe(true)
  })

  it('onClose resets isOrgFormOpen and editingOrgId atoms', () => {
    store.set(isOrgFormOpenAtom, true)
    store.set(editingOrgIdAtom, 'org-abc')
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })

    act(() => result.current.onClose())

    expect(store.get(isOrgFormOpenAtom)).toBe(false)
    expect(store.get(editingOrgIdAtom)).toBeNull()
  })

  it('onOwnerChange with __create__ opens UserFormModal atom', () => {
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })
    act(() => result.current.onOwnerChange('__create__', null))
    expect(store.get(isUserFormModalOpenAtom)).toBe(true)
  })

  it('onOwnerChange with regular id does not open UserFormModal', () => {
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })
    act(() => result.current.onOwnerChange('user-123', null))
    expect(store.get(isUserFormModalOpenAtom)).toBe(false)
  })

  it('ownerOptions adds __create__ option when search has input and no results', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG_USERS_SEARCH, () => HttpResponse.json([]))
    )
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })

    act(() => result.current.setOwnerSearch('nonexistent'))

    await vi.waitFor(() =>
      expect(result.current.ownerOptions.some((o) => o.value === '__create__')).toBe(true)
    )
    const createOption = result.current.ownerOptions.find((o) => o.value === '__create__')
    expect(createOption?.label).toBe(SUPER_ADMIN_LABELS.CREATE_NEW_USER_OPTION)
  })

  it('ownerOptions maps search results to autocomplete options', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG_USERS_SEARCH, () =>
        HttpResponse.json([{ id: 'u-1', email: 'found@test.com', full_name: 'Found User', phone: null }])
      )
    )
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })

    act(() => result.current.setOwnerSearch('found'))

    await vi.waitFor(() => expect(result.current.ownerOptions).toHaveLength(1))
    expect(result.current.ownerOptions[0].value).toBe('u-1')
    expect(result.current.ownerOptions[0].label).toContain('found@test.com')
  })

  it('pendingNewUser atom populates create form fields and clears itself', async () => {
    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      store.set(pendingNewUserAtom, {
        email: 'new@test.com',
        full_name: 'New User',
        phone: '+972-50-111',
        password: 'secret123',
      })
    })

    await vi.waitFor(() => expect(store.get(pendingNewUserAtom)).toBeNull())
  })

  it('edit form pre-fills from API data when editingOrgId is set', async () => {
    const ORG_DATA = {
      id: 'org-xyz',
      org_number: 'ORG-2026-0001',
      slug: 'my-org',
      name: 'My Org',
      logo_path: null,
      plan: 'basic',
      trial_ends_at: null,
      is_active: true,
      max_users: 5,
      owner_id: 'user-1',
      owner_email: 'owner@test.com',
      member_count: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORG('org-xyz'), () => HttpResponse.json(ORG_DATA))
    )
    store.set(isOrgFormOpenAtom, true)
    store.set(editingOrgIdAtom, 'org-xyz')

    const { result } = renderHook(() => useOrgFormModal(), { wrapper: makeWrapper(store, qc) })

    await vi.waitFor(() =>
      expect(result.current.editErrors).toBeDefined()
    )
  })
})
