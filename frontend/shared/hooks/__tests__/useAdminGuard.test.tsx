import React from 'react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useAdminGuard } from '../useAdminGuard'
import { accessTokenAtom } from '@/features/auth/store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

function makeToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useAdminGuard', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    replaceMock.mockClear()
  })

  it('does not redirect when the user is an admin', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', sys_admin: true }))

    renderHook(() => useAdminGuard(), { wrapper: makeWrapper(store) })

    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('redirects to home when a logged-in user is not an admin', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u2', sys_admin: false }))

    renderHook(() => useAdminGuard(), { wrapper: makeWrapper(store) })

    expect(replaceMock).toHaveBeenCalledWith(ROUTES.HOME)
  })

  it('does not redirect before the token is initialised', () => {
    renderHook(() => useAdminGuard(), { wrapper: makeWrapper(store) })

    expect(replaceMock).not.toHaveBeenCalled()
  })
})
