'use client'

import { ERROR_MESSAGES } from '@/shared/constants/errorMessages'
import { ApiError, getModuleToken, getOrRefreshToken } from '@/shared/utils/apiClient'

async function openStream(url: string, body: unknown, token: string | null): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

/**
 * SSE streaming client for POST endpoints that require auth.
 * Yields each parsed SSE event as T.
 * Automatically retries once on 401 after token refresh.
 */
export async function* apiStream<T>(url: string, body: unknown): AsyncGenerator<T> {
  let token = getModuleToken()
  let response = await openStream(url, body, token)

  if (response.status === 401) {
    token = await getOrRefreshToken()
    if (!token) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
    response = await openStream(url, body, token)
  }

  if (!response.ok) {
    let detail = ERROR_MESSAGES.GENERIC
    let code: string | undefined
    try {
      const errBody = await response.json()
      detail = errBody.detail ?? detail
      code = errBody.code ?? undefined
    } catch {}
    throw new ApiError(response.status, detail, code)
  }

  if (!response.body) {
    throw new ApiError(500, ERROR_MESSAGES.GENERIC)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6)
          try {
            const event = JSON.parse(jsonStr) as T
            yield event
          } catch {
            // Malformed SSE line — skip silently
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
