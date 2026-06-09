import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgsTab } from '../useOrgsTab'
import { orgFiltersAtom, isOrgFormOpenAtom, editingOrgIdAtom } from '../../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

const pushFn = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushFn }) }))

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

const ORG_ROW = {
  id: 'org-1',
  org_number: 'ORG-2026-0001',
  slug: 'test-org',
  name: 'Test Org',
  logo_path: null,
  plan: 'trial' as const,
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'user-1',
  owner_email: 'owner@test.com',
  member_count: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const PAGINATED = { items: [ORG_ROW], total: 1, page: 1, page_size: 20, pages: 1 }

function makeMockEvent() {
  const el = document.createElement('tr')
  return { currentTarget: el } as unknown as React.MouseEvent<Element>
}

describe('useOrgsTab', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    confirmFn.mockClear()
    pushFn.mockClear()
  })

  it('returns empty rows by default', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.rows).toEqual([])
  })

  it('transforms org API response into OrgRow objects', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_ORGS, () => HttpResponse.json(PAGINATED))
    )
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.rows).toHaveLength(1))

    const row = result.current.rows[0]
    expect(row.orgNumber).toBe('ORG-2026-0001')
    expect(row.name).toBe('Test Org')
    expect(row.ownerEmail).toBe('owner@test.com')
    expect(row.isActive).toBe(true)
  })

  it('onRowMenuClick opens dropdown menu with org name as title', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    const row = { ...result.current.rows[0], id: 'org-1', name: 'Test Org', orgNumber: 'ORG-1',
      slug: 'x', ownerEmail: 'e@e.com', planLabel: 'trial', statusLabel: 'פעיל',
      memberCount: 1, createdAt: '01/01/2026', isActive: true }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.title).toBe('Test Org')
  })

  it('edit menu item sets editingOrgId and opens form modal', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    const row = { id: 'org-abc', name: 'Org ABC', orgNumber: 'ORG-1',
      slug: 'x', ownerEmail: 'e@e.com', planLabel: 'trial', statusLabel: 'פעיל',
      memberCount: 1, createdAt: '01/01/2026', isActive: true }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))
    const editItem = result.current.menuState.items.find((i) => i.label === SUPER_ADMIN_LABELS.MENU_EDIT)
    act(() => editItem!.onClick())

    expect(store.get(editingOrgIdAtom)).toBe('org-abc')
    expect(store.get(isOrgFormOpenAtom)).toBe(true)
  })

  it('delete menu item opens confirm dialog', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    const row = { id: 'org-abc', name: 'Org ABC', orgNumber: 'ORG-1',
      slug: 'x', ownerEmail: 'e@e.com', planLabel: 'trial', statusLabel: 'פעיל',
      memberCount: 1, createdAt: '01/01/2026', isActive: true }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))
    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => deleteItem!.onClick())

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({ isDangerous: true })
    )
  })

  it('closeMenu closes the dropdown', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    const row = { id: 'org-1', name: 'O', orgNumber: 'ORG-1',
      slug: 'x', ownerEmail: 'e@e.com', planLabel: 'trial', statusLabel: 'פעיל',
      memberCount: 1, createdAt: '01/01/2026', isActive: true }

    act(() => result.current.onRowMenuClick(row, makeMockEvent()))
    expect(result.current.menuState.isOpen).toBe(true)
    act(() => result.current.closeMenu())
    expect(result.current.menuState.isOpen).toBe(false)
  })

  it('onPageChange updates orgFiltersAtom.page', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    act(() => result.current.onPageChange(3))
    expect(store.get(orgFiltersAtom).page).toBe(3)
  })

  it('filtersBarProps.onSearchChange resets page and updates search', () => {
    const { result } = renderHook(() => useOrgsTab(), { wrapper: makeWrapper(store, qc) })
    store.set(orgFiltersAtom, (f) => ({ ...f, page: 5 }))

    act(() => result.current.filtersBarProps.onSearchChange('foo'))

    const filters = store.get(orgFiltersAtom)
    expect(filters.search).toBe('foo')
    expect(filters.page).toBe(1)
  })
})
