import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useLoginForm } from '../useLoginForm'
import { AUTH_LABELS } from '../../../constants/authLabels'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('useLoginForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    localStorage.clear()
  })

  it('stores tokens and navigates to dashboard on successful login', async () => {
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
      expect(pushMock).toHaveBeenCalledWith(ROUTES.DASHBOARD)
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
})
