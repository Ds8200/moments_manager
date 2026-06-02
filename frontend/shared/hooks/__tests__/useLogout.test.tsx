import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useLogout } from '../useLogout'
import { accessTokenAtom } from '@/features/auth/store/authAtoms'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useLogout', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    replaceMock.mockClear()
    localStorage.clear()
  })

  it('clears tokens, calls the logout API and redirects to login', async () => {
    localStorage.setItem('access_token', 'a-token')
    localStorage.setItem('refresh_token', 'r-token')
    store.set(accessTokenAtom, 'a-token')

    let logoutCalled = false
    server.use(
      http.post(API_ENDPOINTS.AUTH_LOGOUT, () => {
        logoutCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(store) })

    await act(async () => {
      await result.current.logout()
    })

    expect(logoutCalled).toBe(true)
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(store.get(accessTokenAtom)).toBeNull()
    expect(replaceMock).toHaveBeenCalledWith(ROUTES.LOGIN)
  })

  it('still clears tokens and redirects when the logout API fails', async () => {
    localStorage.setItem('access_token', 'a-token')
    localStorage.setItem('refresh_token', 'r-token')
    store.set(accessTokenAtom, 'a-token')

    server.use(
      http.post(API_ENDPOINTS.AUTH_LOGOUT, () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(store) })

    await act(async () => {
      await result.current.logout()
    })

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(store.get(accessTokenAtom)).toBeNull()
    expect(replaceMock).toHaveBeenCalledWith(ROUTES.LOGIN)
  })

  it('skips the API call when there is no refresh token but still redirects', async () => {
    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(store) })

    await act(async () => {
      await result.current.logout()
    })

    expect(replaceMock).toHaveBeenCalledWith(ROUTES.LOGIN)
  })
})
