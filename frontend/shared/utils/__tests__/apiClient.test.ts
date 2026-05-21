import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { apiClient, ApiError } from '../apiClient'
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
})
