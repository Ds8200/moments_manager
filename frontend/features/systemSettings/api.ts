'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { SystemSettingsSchema } from './types'
import type {
  MessageResponse,
  SystemOpenAIPayload,
  SystemSettings,
  SystemSmtpPayload,
  SysAdminPasswordPayload,
} from './types'

export const systemSettingsApi = {
  getSettings: (): Promise<SystemSettings> =>
    apiClient<unknown>(API_ENDPOINTS.ADMIN_SETTINGS).then((r) =>
      SystemSettingsSchema.parse(r),
    ),

  updateSmtp: (payload: SystemSmtpPayload): Promise<SystemSettings> =>
    apiClient<unknown>(API_ENDPOINTS.ADMIN_SETTINGS_SMTP, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then((r) => SystemSettingsSchema.parse(r)),

  updateOpenai: (payload: SystemOpenAIPayload): Promise<SystemSettings> =>
    apiClient<unknown>(API_ENDPOINTS.ADMIN_SETTINGS_OPENAI, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then((r) => SystemSettingsSchema.parse(r)),

  changePassword: (payload: SysAdminPasswordPayload): Promise<MessageResponse> =>
    apiClient<MessageResponse>(API_ENDPOINTS.ADMIN_SETTINGS_PASSWORD, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}
