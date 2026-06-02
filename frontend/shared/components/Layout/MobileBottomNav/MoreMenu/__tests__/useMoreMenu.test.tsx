import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useMoreMenu } from '../useMoreMenu'
import { ROUTES } from '@/shared/constants/routes'
import type { NavItem } from '@/shared/constants/routes'

const logoutMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/shared/hooks/useLogout', () => ({
  useLogout: () => ({ logout: logoutMock }),
}))

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

const OVERFLOW: NavItem[] = [
  { href: ROUTES.REPORTS, label: 'דוחות', icon: '📊' },
  { href: ROUTES.USERS, label: 'משתמשים', icon: '👤', adminOnly: true },
]

describe('useMoreMenu', () => {
  let store: ReturnType<typeof createStore>
  const onClose = vi.fn()

  beforeEach(() => {
    store = createStore()
    logoutMock.mockClear()
    onClose.mockClear()
  })

  it('returns the overflow items as the menu items', () => {
    const { result } = renderHook(
      () => useMoreMenu({ overflowItems: OVERFLOW, pathname: ROUTES.REPORTS, onClose }),
      { wrapper: makeWrapper(store) },
    )
    expect(result.current.items).toEqual(OVERFLOW)
  })

  it('onLogout closes the menu and triggers logout', async () => {
    const { result } = renderHook(
      () => useMoreMenu({ overflowItems: OVERFLOW, pathname: ROUTES.REPORTS, onClose }),
      { wrapper: makeWrapper(store) },
    )

    await act(async () => {
      await result.current.onLogout()
    })

    expect(onClose).toHaveBeenCalled()
    expect(logoutMock).toHaveBeenCalled()
  })
})
