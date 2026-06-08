'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { TokenResponse } from './types'

export const authApi = {
  login: (email: string, password: string): Promise<TokenResponse> =>
    apiClient<TokenResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    }),

  refresh: (): Promise<TokenResponse> =>
    apiClient<TokenResponse>(API_ENDPOINTS.AUTH_REFRESH, {
      method: 'POST',
      credentials: 'include',
    }),

  magicLogin: (token: string): Promise<TokenResponse> =>
    apiClient<TokenResponse>(API_ENDPOINTS.AUTH_MAGIC_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ token }),
      credentials: 'include',
    }),

  logout: (): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.AUTH_LOGOUT, {
      method: 'POST',
      credentials: 'include',
    }),
}
