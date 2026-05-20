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

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
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

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED)
    }
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
