'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { User, UsersResponse, UserFormValues } from './types'

export const usersApi = {
  list: (page = 1, page_size = 20): Promise<UsersResponse> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(page_size) })
    return apiClient<UsersResponse>(`${API_ENDPOINTS.USERS}?${params}`)
  },

  create: (payload: UserFormValues): Promise<User> =>
    apiClient<User>(API_ENDPOINTS.USERS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.USER(id), { method: 'DELETE' }),
}
