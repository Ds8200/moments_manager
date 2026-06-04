import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
      for await (const _ of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        // nothing
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
      for await (const _ of apiStream(API_ENDPOINTS.AI_CHAT, {})) {
        // nothing
      }
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeInstanceOf(ApiError)
    expect((caughtError as ApiError).status).toBe(503)
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
