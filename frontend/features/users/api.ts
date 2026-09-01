'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { User, UsersResponse, UserFormValues } from './types'

export const usersApi = {
  list: (page = 1, page_size = 20): Promise<UsersResponse> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(page_size) })
    return apiClient<UsersResponse>(`${API_ENDPOINTS.USERS}?${params}`)
  },

  get: (id: string): Promise<User> =>
    apiClient<User>(API_ENDPOINTS.USER(id)),

  create: (payload: UserFormValues): Promise<User> =>
    apiClient<User>(API_ENDPOINTS.USERS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRole: (id: string, role: UserFormValues['role']): Promise<User> =>
    apiClient<User>(API_ENDPOINTS.USER_ROLE(id), {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.USER(id), { method: 'DELETE' }),
}
