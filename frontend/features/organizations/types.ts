export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface OrgResponse {
  id: string
  slug: string
  name: string
  logo_path: string | null
  brand_colors: BrandColors | null
  plan: string
  trial_ends_at: string | null
  is_active: boolean
  max_users: number
  owner_id: string
  created_at: string
  updated_at: string
  // Integration status — sensitive values never returned raw
  has_openai_key: boolean
  openai_key_preview: string | null
  has_smtp_config: boolean
  smtp_host: string | null
  smtp_port: number | null
  smtp_username: string | null
  smtp_from_email: string | null
  smtp_from_name: string | null
}

export interface OrgBrandingResponse {
  slug: string
  name: string
  logo_path: string | null
  brand_colors: BrandColors | null
}

export interface OrgBrandingUploadResponse {
  logo_path: string
  brand_colors: BrandColors
  message: string
}

export interface OrgUpdatePayload {
  name?: string
  openai_api_key?: string | null
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_username?: string | null
  smtp_password?: string | null
  smtp_from_email?: string | null
  smtp_from_name?: string | null
}

export interface Member {
  id: string
  user_id: string
  organization_id: string
  role: string
  is_active: boolean
  joined_at: string | null
  created_at: string
}

export interface InvitePayload {
  email: string
  role: 'admin' | 'member'
}

export interface InviteResponse {
  id: string
  organization_id: string
  email: string
  role: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}
