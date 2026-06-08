import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setModuleToken } from '@/shared/utils/apiClient'
import { useAuthGuard } from '../useAuthGuard'
import { ROUTES } from '@/shared/constants/routes'

const replaceMock = vi.fn()
let currentPathname = '/home'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => currentPathname,
}))

function makeToken(payload: Record<string, unknown>): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600
  return `header.${btoa(JSON.stringify({ exp: futureExp, ...payload }))}.signature`
}

describe('useAuthGuard', () => {
  beforeEach(() => {
    setModuleToken(null)
    document.cookie = 'access_token=; max-age=0'
    replaceMock.mockClear()
    currentPathname = '/home'
  })

  afterEach(() => {
    setModuleToken(null)
    document.cookie = 'access_token=; max-age=0'
  })

  it('marks checked=true after init and reports unauthenticated when no token', async () => {
    const { result } = renderHook(() => useAuthGuard())

    await waitFor(() => {
      expect(result.current.checked).toBe(true)
    })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('reports isAuthenticated=true when valid token exists in cookie', async () => {
    const token = makeToken({ sub: 'u1', role: 'user', sys_admin: false })
    document.cookie = `access_token=${encodeURIComponent(token)}`
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
    const token = makeToken({ sub: 'u1', role: 'user', sys_admin: false })
    document.cookie = `access_token=${encodeURIComponent(token)}`
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
  })
})
