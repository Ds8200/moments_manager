import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ERROR_MESSAGES } from '@/shared/constants/errorMessages'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function clearLocalTokens(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    clearLocalTokens()
    return null
  }

  try {
    const res = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      clearLocalTokens()
      return null
    }

    const data = (await res.json()) as { access_token: string; refresh_token: string }
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    return data.access_token
  } catch {
    clearLocalTokens()
    return null
  }
}

async function retryRequest<T>(
  url: string,
  options: RequestInit,
  token: string
): Promise<T> {
  const retryHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  }
  const res = await fetch(url, { ...options, headers: retryHeaders })
  if (!res.ok) throw new ApiError(res.status, ERROR_MESSAGES.GENERIC)
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export async function apiClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login')
    if (isAuthEndpoint) {
      throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
    }

    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) return reject(new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED))
          retryRequest<T>(url, options, newToken).then(resolve).catch(reject)
        })
      })
    }

    isRefreshing = true
    const newToken = await attemptTokenRefresh()
    isRefreshing = false

    const pending = refreshQueue
    refreshQueue = []
    pending.forEach((cb) => cb(newToken))

    if (!newToken) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
    return retryRequest<T>(url, options, newToken)
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(404, ERROR_MESSAGES.NOT_FOUND)
    }
    let detail = ERROR_MESSAGES.GENERIC
    try {
      const body = await response.json()
      detail = body.detail ?? detail
    } catch {}
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const headers = getAuthHeader()
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (response.status === 401) {
    clearLocalTokens()
    throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
  }

  if (!response.ok) {
    let detail = ERROR_MESSAGES.GENERIC
    try {
      const body = await response.json()
      detail = body.detail ?? detail
    } catch {}
    throw new ApiError(response.status, detail)
  }

  return response.json() as Promise<T>
}
