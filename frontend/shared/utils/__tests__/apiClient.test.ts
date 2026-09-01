import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/shared/mocks/server'
import { apiClient, apiDownload, apiUpload, ApiError } from '../apiClient'
import { ERROR_MESSAGES } from '@/shared/constants/errorMessages'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns parsed JSON on a 200 response', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 }),
      ),
    )

    const data = await apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS)
    expect(data.total).toBe(0)
  })

  it('returns undefined for a 204 response', async () => {
    server.use(
      http.delete(API_ENDPOINTS.CUSTOMER('x'), () => new HttpResponse(null, { status: 204 })),
    )

    const result = await apiClient(API_ENDPOINTS.CUSTOMER('x'), { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ApiError with NOT_FOUND message on a 404', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMER('missing'), () =>
        HttpResponse.json({ detail: 'not found' }, { status: 404 }),
      ),
    )

    await expect(apiClient(API_ENDPOINTS.CUSTOMER('missing'))).rejects.toMatchObject({
      status: 404,
      message: ERROR_MESSAGES.NOT_FOUND,
    })
  })

  it('parses backend detail message on non-404 errors', async () => {
    server.use(
      http.post(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ detail: 'invalid name' }, { status: 422 }),
      ),
    )

    await expect(
      apiClient(API_ENDPOINTS.CUSTOMERS, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: 'invalid name',
    })
  })

  it('throws UNAUTHORIZED ApiError on 401 from auth endpoint', async () => {
    server.use(
      http.post(API_ENDPOINTS.AUTH_LOGIN, () =>
        HttpResponse.json({ detail: 'bad' }, { status: 401 }),
      ),
    )

    await expect(
      apiClient(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email: 'a', password: 'b' }),
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  describe('401 on a non-auth endpoint — refresh and retry', () => {
    it('refreshes the token and retries the original request on success', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')
      let firstAttempt = true

      server.use(
        http.get(API_ENDPOINTS.CUSTOMERS, ({ request }) => {
          const auth = request.headers.get('Authorization')
          if (firstAttempt) {
            firstAttempt = false
            return HttpResponse.json({ detail: 'expired' }, { status: 401 })
          }
          // the retried request must carry the freshly refreshed token
          expect(auth).toBe('Bearer fresh-token')
          return HttpResponse.json({ total: 3 })
        }),
        http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
          HttpResponse.json({ access_token: 'fresh-token', refresh_token: 'new-refresh-token' }),
        ),
      )

      const data = await apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS)

      expect(data.total).toBe(3)
      expect(localStorage.getItem('access_token')).toBe('fresh-token')
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token')
    })

    it('clears tokens and throws UNAUTHORIZED when there is no stored refresh token', async () => {
      localStorage.setItem('access_token', 'stale-token')

      server.use(
        http.get(API_ENDPOINTS.CUSTOMERS, () =>
          HttpResponse.json({ detail: 'expired' }, { status: 401 }),
        ),
      )

      await expect(apiClient(API_ENDPOINTS.CUSTOMERS)).rejects.toMatchObject({
        status: 401,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      })
      expect(localStorage.getItem('access_token')).toBeNull()
    })

    it('clears tokens and throws UNAUTHORIZED when the refresh request itself throws a network error', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')

      server.use(
        http.get(API_ENDPOINTS.CUSTOMERS, () =>
          HttpResponse.json({ detail: 'expired' }, { status: 401 }),
        ),
        http.post(API_ENDPOINTS.AUTH_REFRESH, () => HttpResponse.error()),
      )

      await expect(apiClient(API_ENDPOINTS.CUSTOMERS)).rejects.toMatchObject({ status: 401 })
      expect(localStorage.getItem('access_token')).toBeNull()
    })

    it('clears tokens and throws UNAUTHORIZED when the refresh call itself fails', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'expired-refresh-token')

      server.use(
        http.get(API_ENDPOINTS.CUSTOMERS, () =>
          HttpResponse.json({ detail: 'expired' }, { status: 401 }),
        ),
        http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
          HttpResponse.json({ detail: 'invalid refresh token' }, { status: 401 }),
        ),
      )

      await expect(apiClient(API_ENDPOINTS.CUSTOMERS)).rejects.toMatchObject({ status: 401 })
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('queues a second concurrent request behind one in-flight refresh', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')
      let refreshCalls = 0

      server.use(
        http.get(API_ENDPOINTS.CUSTOMERS, ({ request }) => {
          const auth = request.headers.get('Authorization')
          if (auth === 'Bearer stale-token') {
            return HttpResponse.json({ detail: 'expired' }, { status: 401 })
          }
          return HttpResponse.json({ total: 1 })
        }),
        http.get(API_ENDPOINTS.PRODUCTS, ({ request }) => {
          const auth = request.headers.get('Authorization')
          if (auth === 'Bearer stale-token') {
            return HttpResponse.json({ detail: 'expired' }, { status: 401 })
          }
          return HttpResponse.json({ total: 2 })
        }),
        http.post(API_ENDPOINTS.AUTH_REFRESH, async () => {
          refreshCalls += 1
          await delay(30) // hold the window open so the second request queues, not re-triggers
          return HttpResponse.json({ access_token: 'fresh-token', refresh_token: 'new-refresh-token' })
        }),
      )

      const [a, b] = await Promise.all([
        apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS),
        apiClient<{ total: number }>(API_ENDPOINTS.PRODUCTS),
      ])

      expect(refreshCalls).toBe(1)
      expect(a.total).toBe(1)
      expect(b.total).toBe(2)
    })
  })

  describe('apiDownload', () => {
    it('returns a Blob on success', async () => {
      server.use(
        http.get(API_ENDPOINTS.REPORTS_EXPORT_EXCEL, () =>
          new HttpResponse(new Blob(['file-bytes']), { status: 200 }),
        ),
      )

      const blob = await apiDownload(API_ENDPOINTS.REPORTS_EXPORT_EXCEL)
      expect(blob).toBeInstanceOf(Blob)
    })

    it('throws a generic ApiError on a non-401 error response', async () => {
      server.use(
        http.get(API_ENDPOINTS.REPORTS_EXPORT_EXCEL, () => new HttpResponse(null, { status: 500 })),
      )

      await expect(apiDownload(API_ENDPOINTS.REPORTS_EXPORT_EXCEL)).rejects.toMatchObject({
        status: 500,
        message: ERROR_MESSAGES.GENERIC,
      })
    })

    it('clears tokens and throws on 401 with no refresh token available', async () => {
      localStorage.setItem('access_token', 'stale-token')
      server.use(
        http.get(API_ENDPOINTS.REPORTS_EXPORT_EXCEL, () => new HttpResponse(null, { status: 401 })),
      )

      await expect(apiDownload(API_ENDPOINTS.REPORTS_EXPORT_EXCEL)).rejects.toMatchObject({ status: 401 })
      expect(localStorage.getItem('access_token')).toBeNull()
    })

    it('refreshes the token and retries on 401, returning the retried Blob', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')
      let firstAttempt = true

      server.use(
        http.get(API_ENDPOINTS.REPORTS_EXPORT_EXCEL, ({ request }) => {
          const auth = request.headers.get('Authorization')
          if (firstAttempt) {
            firstAttempt = false
            return new HttpResponse(null, { status: 401 })
          }
          expect(auth).toBe('Bearer fresh-token')
          return new HttpResponse(new Blob(['file-bytes']), { status: 200 })
        }),
        http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
          HttpResponse.json({ access_token: 'fresh-token', refresh_token: 'new-refresh-token' }),
        ),
      )

      const blob = await apiDownload(API_ENDPOINTS.REPORTS_EXPORT_EXCEL)
      expect(blob).toBeInstanceOf(Blob)
    })

    it('queues a second concurrent download behind one in-flight refresh', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')
      let refreshCalls = 0

      server.use(
        http.get(API_ENDPOINTS.REPORTS_EXPORT_EXCEL, ({ request }) => {
          const auth = request.headers.get('Authorization')
          if (auth === 'Bearer stale-token') return new HttpResponse(null, { status: 401 })
          return new HttpResponse(new Blob(['excel-bytes']), { status: 200 })
        }),
        http.get(API_ENDPOINTS.REPORTS_EXPORT_PDF, ({ request }) => {
          const auth = request.headers.get('Authorization')
          if (auth === 'Bearer stale-token') return new HttpResponse(null, { status: 401 })
          return new HttpResponse(new Blob(['pdf-bytes']), { status: 200 })
        }),
        http.post(API_ENDPOINTS.AUTH_REFRESH, async () => {
          refreshCalls += 1
          await delay(30)
          return HttpResponse.json({ access_token: 'fresh-token', refresh_token: 'new-refresh-token' })
        }),
      )

      const [a, b] = await Promise.all([
        apiDownload(API_ENDPOINTS.REPORTS_EXPORT_EXCEL),
        apiDownload(API_ENDPOINTS.REPORTS_EXPORT_PDF),
      ])

      expect(refreshCalls).toBe(1)
      expect(a).toBeInstanceOf(Blob)
      expect(b).toBeInstanceOf(Blob)
    })
  })

  describe('apiUpload', () => {
    it('returns parsed JSON on success', async () => {
      server.use(
        http.post(API_ENDPOINTS.ORDER_FILES('order-1'), () => HttpResponse.json({ id: 'file-1' })),
      )

      const result = await apiUpload<{ id: string }>(API_ENDPOINTS.ORDER_FILES('order-1'), new FormData())
      expect(result.id).toBe('file-1')
    })

    it('clears tokens and throws UNAUTHORIZED on 401 — no refresh attempted', async () => {
      localStorage.setItem('access_token', 'stale-token')
      localStorage.setItem('refresh_token', 'valid-refresh-token')
      let refreshCalls = 0
      server.use(
        http.post(API_ENDPOINTS.ORDER_FILES('order-1'), () => new HttpResponse(null, { status: 401 })),
        http.post(API_ENDPOINTS.AUTH_REFRESH, () => {
          refreshCalls += 1
          return HttpResponse.json({ access_token: 'x', refresh_token: 'y' })
        }),
      )

      await expect(
        apiUpload(API_ENDPOINTS.ORDER_FILES('order-1'), new FormData()),
      ).rejects.toMatchObject({ status: 401, message: ERROR_MESSAGES.UNAUTHORIZED })
      expect(refreshCalls).toBe(0)
      expect(localStorage.getItem('access_token')).toBeNull()
    })

    it('parses the backend detail/code on a non-401 error', async () => {
      server.use(
        http.post(API_ENDPOINTS.ORDER_FILES('order-1'), () =>
          HttpResponse.json({ detail: 'file too large', code: 'FILE_TOO_LARGE' }, { status: 413 }),
        ),
      )

      await expect(
        apiUpload(API_ENDPOINTS.ORDER_FILES('order-1'), new FormData()),
      ).rejects.toMatchObject({ status: 413, message: 'file too large', code: 'FILE_TOO_LARGE' })
    })
  })
})
