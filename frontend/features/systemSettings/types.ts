import { z } from 'zod'

export const SystemSettingsSchema = z.object({
  has_smtp_config: z.boolean(),
  smtp_host: z.string().nullable(),
  smtp_port: z.number().nullable(),
  smtp_username: z.string().nullable(),
  smtp_from_email: z.string().nullable(),
  smtp_from_name: z.string().nullable(),
  has_openai_key: z.boolean(),
  openai_key_preview: z.string().nullable(),
  updated_at: z.string(),
})

export type SystemSettings = z.infer<typeof SystemSettingsSchema>

export interface SystemSmtpPayload {
  platform_smtp_host?: string | null
  platform_smtp_port?: number | null
  platform_smtp_username?: string | null
  platform_smtp_password?: string | null
  platform_smtp_from_email?: string | null
  platform_smtp_from_name?: string | null
}

export interface SystemOpenAIPayload {
  platform_openai_api_key?: string | null
}

export interface SysAdminPasswordPayload {
  current_password: string
  new_password: string
}

export interface MessageResponse {
  message: string
}
