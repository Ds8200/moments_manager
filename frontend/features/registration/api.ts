'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { RegistrationFormValues, RegistrationResponse } from './types'

export const registrationApi = {
  register: (payload: RegistrationFormValues): Promise<RegistrationResponse> =>
    apiClient<RegistrationResponse>(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
