'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { ComposeEmailPayload, ComposeEmailResponse } from './types'

export const sendEmailApi = {
  compose: (payload: ComposeEmailPayload): Promise<ComposeEmailResponse> =>
    apiClient<ComposeEmailResponse>(API_ENDPOINTS.COMPOSE_EMAIL, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
