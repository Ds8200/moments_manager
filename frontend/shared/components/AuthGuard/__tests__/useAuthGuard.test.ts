import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAuthGuard } from '../useAuthGuard'
import { ROUTES } from '@/shared/constants/routes'

const replaceMock = vi.fn()
let currentPathname = '/home'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => currentPathname,
}))

describe('useAuthGuard', () => {
  beforeEach(() => {
    localStorage.clear()
    replaceMock.mockClear()
    currentPathname = '/home'
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('marks checked=true after init and reports unauthenticated when no token', async () => {
    const { result } = renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(result.current.checked).toBe(true)
    })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('reports isAuthenticated=true when token exists in storage', async () => {
    localStorage.setItem('access_token', 'token-abc')
    const { result } = renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(result.current.checked).toBe(true)
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('redirects to login when checked and no token and not on login page', async () => {
    currentPathname = '/home'
    renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(ROUTES.LOGIN)
    })
  })

  it('does not redirect when already on login page', async () => {
    currentPathname = ROUTES.LOGIN
    renderHook(() => useAuthGuard())

    await waitFor(() => {
      // give effects time to run
    })
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('clears token when auth:expired event fires', async () => {
    localStorage.setItem('access_token', 'token-abc')
    localStorage.setItem('refresh_token', 'r-abc')
    const { result } = renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    act(() => {
      window.dispatchEvent(new Event('auth:expired'))
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})
