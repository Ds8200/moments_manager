import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useMobileBottomNav } from '../useMobileBottomNav'
import { userRoleAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

vi.mock('next/navigation', () => ({
  usePathname: () => ROUTES.HOME,
}))

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useMobileBottomNav', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('shows exactly 4 primary items', () => {
    const { result } = renderHook(() => useMobileBottomNav(), { wrapper: makeWrapper(store) })
    expect(result.current.primaryItems).toHaveLength(4)
  })

  it('includes the admin-only Users item in overflow for an admin', () => {
    store.set(userRoleAtom, 'admin')
    const { result } = renderHook(() => useMobileBottomNav(), { wrapper: makeWrapper(store) })
    const hrefs = result.current.overflowItems.map((i) => i.href)
    expect(hrefs).toContain(ROUTES.USERS)
  })

  it('excludes the admin-only Users item for a non-admin', () => {
    store.set(userRoleAtom, 'user')
    const { result } = renderHook(() => useMobileBottomNav(), { wrapper: makeWrapper(store) })
    const allHrefs = [
      ...result.current.primaryItems,
      ...result.current.overflowItems,
    ].map((i) => i.href)
    expect(allHrefs).not.toContain(ROUTES.USERS)
  })

  it('opens and closes the more menu', () => {
    const { result } = renderHook(() => useMobileBottomNav(), { wrapper: makeWrapper(store) })
    expect(result.current.isMoreOpen).toBe(false)

    act(() => result.current.openMore())
    expect(result.current.isMoreOpen).toBe(true)

    act(() => result.current.closeMore())
    expect(result.current.isMoreOpen).toBe(false)
  })
})
