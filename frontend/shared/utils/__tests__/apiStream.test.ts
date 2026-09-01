import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { ApiError } from '@/shared/utils/apiClient'
import { apiStream } from '@/shared/utils/apiStream'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'

function makeSSEBody(...events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
}

describe('apiStream', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'test-token')
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('yields parsed events from SSE response', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => {
        const body = makeSSEBody(
          { type: 'token', content: 'שלום' },
          { type: 'done' }
        )
        return new HttpResponse(body, {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      })
    )

    const events: unknown[] = []
    for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, { messages: [] })) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
    expect((events[0] as { type: string; content: string }).type).toBe('token')
    expect((events[0] as { type: string; content: string }).content).toBe('שלום')
    expect((events[1] as { type: string }).type).toBe('done')
  })

  it('throws ApiError on non-200 response', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => {
        return HttpResponse.json({ detail: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
      })
    )

    let caughtError: unknown
    try {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event // draining the stream is the point — it should throw before yielding anything
      }
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeInstanceOf(ApiError)
    expect((caughtError as ApiError).status).toBe(404)
  })

  it('throws ApiError with 503 on service unavailable', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => {
        return HttpResponse.json(
          { detail: 'AI not configured' },
          { status: 503 }
        )
      })
    )

    let caughtError: unknown
    try {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event // draining the stream is the point — it should throw before yielding anything
      }
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeInstanceOf(ApiError)
    expect((caughtError as ApiError).status).toBe(503)
  })

  it('refreshes the token and retries once on a 401, then streams normally', async () => {
    localStorage.setItem('refresh_token', 'valid-refresh-token')
    let firstAttempt = true

    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, ({ request }) => {
        if (firstAttempt) {
          firstAttempt = false
          return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        }
        expect(request.headers.get('Authorization')).toBe('Bearer fresh-token')
        return new HttpResponse(makeSSEBody({ type: 'done' }), {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      }),
      http.post(API_ENDPOINTS.AUTH_REFRESH, () =>
        HttpResponse.json({ access_token: 'fresh-token', refresh_token: 'new-refresh-token' }),
      ),
    )

    const events: unknown[] = []
    for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(localStorage.getItem('access_token')).toBe('fresh-token')
  })

  it('throws UNAUTHORIZED on a 401 when the refresh endpoint itself rejects the refresh token', async () => {
    localStorage.setItem('refresh_token', 'expired-refresh-token')
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post(API_ENDPOINTS.AUTH_REFRESH, () => HttpResponse.json({ detail: 'invalid' }, { status: 401 })),
    )

    await expect(async () => {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event
      }
    }).rejects.toMatchObject({ status: 401 })
  })

  it('throws UNAUTHORIZED on a 401 when the refresh request itself throws a network error', async () => {
    localStorage.setItem('refresh_token', 'valid-refresh-token')
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post(API_ENDPOINTS.AUTH_REFRESH, () => HttpResponse.error()),
    )

    await expect(async () => {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event
      }
    }).rejects.toMatchObject({ status: 401 })
  })

  it('throws UNAUTHORIZED on a 401 with no stored refresh token to retry with', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
    )

    let caughtError: unknown
    try {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event
      }
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeInstanceOf(ApiError)
    expect((caughtError as ApiError).status).toBe(401)
  })

  it('throws a generic ApiError when the error response body is not valid JSON', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => new HttpResponse('not json', { status: 500 })),
    )

    await expect(async () => {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event
      }
    }).rejects.toBeInstanceOf(ApiError)
  })

  it('silently skips a malformed SSE data line and continues yielding valid ones', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => {
        const body = [
          'data: {not valid json}\n\n',
          'data: {"type":"done"}\n\n',
        ].join('')
        return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } })
      }),
    )

    const events: unknown[] = []
    for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect((events[0] as { type: string }).type).toBe('done')
  })

  it('throws a generic ApiError when the response has no body to stream', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(async () => {
      for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        void event
      }
    }).rejects.toMatchObject({ status: 500 })
  })

  it('skips blank and comment lines', async () => {
    server.use(
      http.post(API_ENDPOINTS.AI_CHAT, () => {
        const body = [
          ': keep-alive\n',
          '\n',
          'data: {"type":"token","content":"hi"}\n\n',
          '\n',
          'data: {"type":"done"}\n\n',
        ].join('')
        return new HttpResponse(body, {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      })
    )

    const events: unknown[] = []
    for await (const event of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
  })
})
