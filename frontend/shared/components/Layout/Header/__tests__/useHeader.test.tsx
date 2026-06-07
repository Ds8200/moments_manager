import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHeader } from '../useHeader'
import { accessTokenAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))
vi.mock('@/features/profile/queries/useProfileQuery', () => ({ useProfileQuery: () => ({ data: null }) }))
vi.mock('@/shared/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }))

function makeToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function makeMockEvent(): React.MouseEvent<HTMLButtonElement> {
  const el = document.createElement('button')
  return { currentTarget: el } as unknown as React.MouseEvent<HTMLButtonElement>
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

describe('useHeader', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    pushMock.mockClear()
  })

  it('includes the org-settings item when the user is an org owner', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', org_role: 'owner' }))
    const { result } = renderHook(() => useHeader(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onProfileClick(makeMockEvent())
    })

    const labels = result.current.profileMenu.menuState.items.map((i) => i.label)
    expect(labels).toContain(UI_LABELS.ORG_SETTINGS_MENU)
  })

  it('includes the org-settings item when the user is an org admin', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', org_role: 'admin' }))
    const { result } = renderHook(() => useHeader(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onProfileClick(makeMockEvent())
    })

    const labels = result.current.profileMenu.menuState.items.map((i) => i.label)
    expect(labels).toContain(UI_LABELS.ORG_SETTINGS_MENU)
  })

  it('excludes the org-settings item for a plain member', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', org_role: 'member' }))
    const { result } = renderHook(() => useHeader(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onProfileClick(makeMockEvent())
    })

    const labels = result.current.profileMenu.menuState.items.map((i) => i.label)
    expect(labels).not.toContain(UI_LABELS.ORG_SETTINGS_MENU)
  })

  it('navigates to ROUTES.SETTINGS when the org-settings item is clicked', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', org_role: 'owner' }))
    const { result } = renderHook(() => useHeader(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onProfileClick(makeMockEvent())
    })

    const orgItem = result.current.profileMenu.menuState.items.find(
      (i) => i.label === UI_LABELS.ORG_SETTINGS_MENU,
    )
    act(() => {
      orgItem!.onClick()
    })

    expect(pushMock).toHaveBeenCalledWith(ROUTES.SETTINGS)
  })

  it('navigates to ROUTES.SUPER_ADMIN_PROFILE for a sys_admin profile click', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'admin1', sys_admin: true, org_id: null, org_role: null }))
    const { result } = renderHook(() => useHeader(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onProfileClick(makeMockEvent())
    })

    const profileItem = result.current.profileMenu.menuState.items.find(
      (i) => i.label === UI_LABELS.EDIT_PROFILE,
    )
    act(() => {
      profileItem!.onClick()
    })

    expect(pushMock).toHaveBeenCalledWith(ROUTES.SUPER_ADMIN_PROFILE)
  })

  it('excludes the org-settings item for a sys_admin even with an org_role on the token', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'admin1', sys_admin: true, org_role: 'owner' }))
    const { result } = renderHook(() => useHeader(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onProfileClick(makeMockEvent())
    })

    const labels = result.current.profileMenu.menuState.items.map((i) => i.label)
    expect(labels).not.toContain(UI_LABELS.ORG_SETTINGS_MENU)
  })
})
