import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ERROR_MESSAGES } from '@/shared/constants/errorMessages'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let _moduleToken: string | null = null

export const setModuleToken = (t: string | null): void => {
  _moduleToken = t
}

export const getModuleToken = (): string | null => _moduleToken

function clearModuleToken(): void {
  _moduleToken = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired'))
  }
}

async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const res = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: 'POST',
      credentials: 'include',
    })

    if (!res.ok) {
      clearModuleToken()
      return null
    }

    const data = (await res.json()) as { access_token: string }
    setModuleToken(data.access_token)
    return data.access_token
  } catch {
    clearModuleToken()
    return null
  }
}

// Shared across apiClient and apiStream — only one HTTP refresh request is ever
// in flight at a time. Any concurrent 401 (from either caller) awaits this same
// promise rather than firing its own /auth/refresh call, which would race with
// token rotation and cause the second caller to get a 401 on an already-revoked token.
let refreshPromise: Promise<string | null> | null = null

export function getOrRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = attemptTokenRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

/**
 * Wraps a fetch call with automatic access-token refresh on 401.
 *
 * `makeRequest` receives the current token (or null) and returns a raw Response.
 * On 401, the refresh dance executes once; all concurrent callers (including
 * those in apiStream) share the same in-flight promise via getOrRefreshToken.
 * Auth endpoints bypass the retry.
 * Throws ApiError(401) when authentication cannot be recovered.
 */
async function fetchWithRefresh(
  url: string,
  makeRequest: (token: string | null) => Promise<Response>
): Promise<Response> {
  const response = await makeRequest(getModuleToken())

  if (response.status !== 401) return response

  if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
    throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
  }

  const newToken = await getOrRefreshToken()
  if (!newToken) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
  return makeRequest(newToken)
}

export async function apiClient<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithRefresh(url, (token) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    return fetch(url, { ...options, headers, credentials: options.credentials ?? 'same-origin' })
  })

  if (!response.ok) {
    const isNotFound = response.status === 404
    let detail = isNotFound ? ERROR_MESSAGES.NOT_FOUND : ERROR_MESSAGES.GENERIC
    let code: string | undefined
    try {
      const body = await response.json()
      if (!isNotFound) detail = body.detail ?? detail
      code = body.code ?? undefined
    } catch {}
    throw new ApiError(response.status, detail, code)
  }

  if (response.status === 204) return undefined as unknown as T
  return response.json() as Promise<T>
}

export async function apiDownload(url: string): Promise<Blob> {
  const response = await fetchWithRefresh(url, (token) =>
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  )

  if (!response.ok) throw new ApiError(response.status, ERROR_MESSAGES.GENERIC)
  return response.blob()
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetchWithRefresh(url, (token) =>
    fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  )

  if (!response.ok) {
    let detail = ERROR_MESSAGES.GENERIC
    let code: string | undefined
    try {
      const body = await response.json()
      detail = body.detail ?? detail
      code = body.code ?? undefined
    } catch {}
    throw new ApiError(response.status, detail, code)
  }

  return response.json() as Promise<T>
}
