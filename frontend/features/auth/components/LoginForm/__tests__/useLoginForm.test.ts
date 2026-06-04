import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useLoginForm } from '../useLoginForm'
import { AUTH_LABELS } from '../../../constants/authLabels'

const pushMock = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}))

describe('useLoginForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    localStorage.clear()
    mockSearchParams = new URLSearchParams()
  })

  it('stores tokens and navigates to home on successful login', async () => {
    server.use(
      http.post(API_ENDPOINTS.AUTH_LOGIN, () =>
        HttpResponse.json({ access_token: 'a-token', refresh_token: 'r-token' }),
      ),
    )

    const { result } = renderHook(() => useLoginForm())

    await act(async () => {
      await result.current.onSubmit({ email: 'a@b.com', password: 'pw' })
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(ROUTES.HOME)
    })
    expect(localStorage.getItem('access_token')).toBe('a-token')
  })

  it('sets submitError to LOGIN_FAILED on auth failure', async () => {
    server.use(
      http.post(API_ENDPOINTS.AUTH_LOGIN, () =>
        HttpResponse.json({ detail: 'bad credentials' }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useLoginForm())

    await act(async () => {
      await result.current.onSubmit({ email: 'a@b.com', password: 'wrong' })
    })

    await waitFor(() => {
      expect(result.current.submitError).toBe(AUTH_LABELS.LOGIN_FAILED)
    })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('auto-logs-in with a magic token in the URL and navigates to home', async () => {
    mockSearchParams = new URLSearchParams({ token: 'magic-123' })
    server.use(
      http.post(API_ENDPOINTS.AUTH_MAGIC_LOGIN, () =>
        HttpResponse.json({ access_token: 'm-access', refresh_token: 'm-refresh' }),
      ),
    )

    const { result } = renderHook(() => useLoginForm())

    expect(result.current.isMagicLoggingIn).toBe(true)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(ROUTES.HOME)
    })
    expect(localStorage.getItem('access_token')).toBe('m-access')
  })

  it('shows MAGIC_LOGIN_FAILED and reveals the form when the magic token is invalid', async () => {
    mockSearchParams = new URLSearchParams({ token: 'bad-token' })
    server.use(
      http.post(API_ENDPOINTS.AUTH_MAGIC_LOGIN, () =>
        HttpResponse.json({ detail: 'invalid' }, { status: 401 }),
      ),
    )

    const { result } = renderHook(() => useLoginForm())

    await waitFor(() => {
      expect(result.current.submitError).toBe(AUTH_LABELS.MAGIC_LOGIN_FAILED)
    })
    expect(result.current.isMagicLoggingIn).toBe(false)
    expect(pushMock).not.toHaveBeenCalled()
  })
})
