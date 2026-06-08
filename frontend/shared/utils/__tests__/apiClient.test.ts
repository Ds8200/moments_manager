import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { apiClient, apiUpload, apiDownload, ApiError, setModuleToken, getModuleToken } from '../apiClient'
import { ERROR_MESSAGES } from '@/shared/constants/errorMessages'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedToken(accessToken = 'access-token'): void {
  setModuleToken(accessToken)
}

function mockRefreshSuccess(newAccess = 'new-access'): void {
  server.use(
    http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
      HttpResponse.json({ access_token: newAccess })
    )
  )
}

function mockRefreshFailure(): void {
  server.use(
    http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
      HttpResponse.json({ detail: 'invalid refresh token' }, { status: 401 })
    )
  )
}

// ---------------------------------------------------------------------------
// apiClient — happy path
// ---------------------------------------------------------------------------

describe('apiClient', () => {
  beforeEach(() => {
    setModuleToken(null)
  })

  it('returns parsed JSON on a 200 response', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      )
    )

    const data = await apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS)
    expect(data.total).toBe(0)
  })

  it('returns undefined for a 204 response', async () => {
    server.use(
      http.delete(API_ENDPOINTS.CUSTOMER('x'), () => new HttpResponse(null, { status: 204 }))
    )

    const result = await apiClient(API_ENDPOINTS.CUSTOMER('x'), { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ApiError with NOT_FOUND message on a 404', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMER('missing'), () =>
        HttpResponse.json({ detail: 'not found' }, { status: 404 })
      )
    )

    await expect(apiClient(API_ENDPOINTS.CUSTOMER('missing'))).rejects.toMatchObject({
      status: 404,
      message: ERROR_MESSAGES.NOT_FOUND,
    })
  })

  it('parses backend detail message on non-404 errors', async () => {
    server.use(
      http.post(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ detail: 'invalid name' }, { status: 422 })
      )
    )

    await expect(
      apiClient(API_ENDPOINTS.CUSTOMERS, { method: 'POST', body: JSON.stringify({}) })
    ).rejects.toMatchObject({ status: 422, message: 'invalid name' })
  })

  it('throws UNAUTHORIZED ApiError on 401 from auth endpoint (no retry)', async () => {
    server.use(
      http.post(API_ENDPOINTS.AUTH_LOGIN, () =>
        HttpResponse.json({ detail: 'bad credentials' }, { status: 401 })
      )
    )

    await expect(
      apiClient(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email: 'a', password: 'b' }),
      })
    ).rejects.toBeInstanceOf(ApiError)
  })
})

// ---------------------------------------------------------------------------
// apiClient — token refresh
// ---------------------------------------------------------------------------

describe('apiClient — token refresh', () => {
  beforeEach(() => {
    setModuleToken('expired-token')
  })

  it('refreshes on 401 and retries with the new token', async () => {
    let callCount = 0
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, ({ request }) => {
        callCount++
        if (request.headers.get('authorization') === 'Bearer expired-token') {
          return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        }
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      })
    )
    mockRefreshSuccess('new-access')

    const data = await apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS)
    expect(data.total).toBe(0)
    expect(callCount).toBe(2)
    expect(getModuleToken()).toBe('new-access')
  })

  it('throws UNAUTHORIZED and clears module token when refresh fails', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ detail: 'expired' }, { status: 401 })
      )
    )
    mockRefreshFailure()

    await expect(apiClient(API_ENDPOINTS.CUSTOMERS)).rejects.toMatchObject({ status: 401 })
    expect(getModuleToken()).toBeNull()
  })

  it('queues concurrent callers and resolves them all after one refresh', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer expired-token') {
          return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        }
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20, pages: 0 })
      })
    )
    mockRefreshSuccess('new-access')

    const [r1, r2, r3] = await Promise.all([
      apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS),
      apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS),
      apiClient<{ total: number }>(API_ENDPOINTS.CUSTOMERS),
    ])

    expect(r1.total).toBe(0)
    expect(r2.total).toBe(0)
    expect(r3.total).toBe(0)
    expect(getModuleToken()).toBe('new-access')
  })

  it('throws UNAUTHORIZED when refresh endpoint returns 401', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ detail: 'expired' }, { status: 401 })
      )
    )
    mockRefreshFailure()

    await expect(apiClient(API_ENDPOINTS.CUSTOMERS)).rejects.toMatchObject({ status: 401 })
  })
})

// ---------------------------------------------------------------------------
// apiUpload — token refresh
// ---------------------------------------------------------------------------

describe('apiUpload — token refresh', () => {
  beforeEach(() => {
    setModuleToken('expired-token')
  })

  it('returns parsed JSON on a successful upload', async () => {
    seedToken('valid-token')
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_LOGO, () =>
        HttpResponse.json({ logo_path: '/uploads/logo.png', brand_colors: null })
      )
    )

    const formData = new FormData()
    formData.append('file', new Blob(['img'], { type: 'image/png' }), 'logo.png')

    const result = await apiUpload<{ logo_path: string }>(API_ENDPOINTS.ORGS_ME_LOGO, formData)
    expect(result.logo_path).toBe('/uploads/logo.png')
  })

  it('refreshes on 401 and retries the upload with the new token', async () => {
    let callCount = 0
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_LOGO, ({ request }) => {
        callCount++
        if (request.headers.get('authorization') === 'Bearer expired-token') {
          return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        }
        return HttpResponse.json({ logo_path: '/uploads/logo.png', brand_colors: null })
      })
    )
    mockRefreshSuccess('new-access')

    const formData = new FormData()
    formData.append('file', new Blob(['img'], { type: 'image/png' }), 'logo.png')

    const result = await apiUpload<{ logo_path: string }>(API_ENDPOINTS.ORGS_ME_LOGO, formData)
    expect(result.logo_path).toBe('/uploads/logo.png')
    expect(callCount).toBe(2)
    expect(getModuleToken()).toBe('new-access')
  })

  it('throws UNAUTHORIZED and clears module token when refresh fails', async () => {
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_LOGO, () =>
        HttpResponse.json({ detail: 'expired' }, { status: 401 })
      )
    )
    mockRefreshFailure()

    const formData = new FormData()
    await expect(apiUpload(API_ENDPOINTS.ORGS_ME_LOGO, formData)).rejects.toMatchObject({
      status: 401,
    })
    expect(getModuleToken()).toBeNull()
  })

  it('throws ApiError with server detail on non-401 errors', async () => {
    seedToken('valid-token')
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_LOGO, () =>
        HttpResponse.json({ detail: 'file too large' }, { status: 413 })
      )
    )

    const formData = new FormData()
    await expect(apiUpload(API_ENDPOINTS.ORGS_ME_LOGO, formData)).rejects.toMatchObject({
      status: 413,
      message: 'file too large',
    })
  })
})

// ---------------------------------------------------------------------------
// apiDownload — token refresh
// ---------------------------------------------------------------------------

describe('apiDownload — token refresh', () => {
  beforeEach(() => {
    setModuleToken('expired-token')
  })

  it('returns a Blob on a successful download', async () => {
    seedToken('valid-token')
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        new HttpResponse(new Blob(['data'], { type: 'text/csv' }), {
          headers: { 'Content-Type': 'text/csv' },
        })
      )
    )

    const blob = await apiDownload(API_ENDPOINTS.CUSTOMERS)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('refreshes on 401 and retries the download with the new token', async () => {
    let callCount = 0
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, ({ request }) => {
        callCount++
        if (request.headers.get('authorization') === 'Bearer expired-token') {
          return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        }
        return new HttpResponse(new Blob(['data'], { type: 'text/csv' }), {
          headers: { 'Content-Type': 'text/csv' },
        })
      })
    )
    mockRefreshSuccess('new-access')

    const blob = await apiDownload(API_ENDPOINTS.CUSTOMERS)
    expect(blob).toBeInstanceOf(Blob)
    expect(callCount).toBe(2)
    expect(getModuleToken()).toBe('new-access')
  })

  it('throws UNAUTHORIZED and clears module token when refresh fails', async () => {
    server.use(
      http.get(API_ENDPOINTS.CUSTOMERS, () =>
        HttpResponse.json({ detail: 'expired' }, { status: 401 })
      )
    )
    mockRefreshFailure()

    await expect(apiDownload(API_ENDPOINTS.CUSTOMERS)).rejects.toMatchObject({ status: 401 })
    expect(getModuleToken()).toBeNull()
  })
})
