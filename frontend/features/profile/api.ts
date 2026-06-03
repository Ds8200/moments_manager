'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { UserProfile, UpdateNamePayload, UpdatePasswordPayload } from './types'

export const profileApi = {
  getMe: (): Promise<UserProfile> => apiClient<UserProfile>(API_ENDPOINTS.ME),

  updateName: (payload: UpdateNamePayload): Promise<UserProfile> =>
    apiClient<UserProfile>(API_ENDPOINTS.ME, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updatePassword: (payload: UpdatePasswordPayload): Promise<UserProfile> =>
    apiClient<UserProfile>(API_ENDPOINTS.ME, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}
