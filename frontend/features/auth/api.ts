'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { TokenResponse } from './types'

export const authApi = {
  login: (email: string, password: string): Promise<TokenResponse> =>
    apiClient<TokenResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string): Promise<TokenResponse> =>
    apiClient<TokenResponse>(API_ENDPOINTS.AUTH_REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (refreshToken: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.AUTH_LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
}
