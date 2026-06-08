import type { OrgPlanValue } from './enums/orgPlanEnums'

export interface OrgAdminResponse {
  id: string
  slug: string
  name: string
  logo_path: string | null
  plan: OrgPlanValue
  trial_ends_at: string | null
  is_active: boolean
  max_users: number
  owner_id: string
  member_count: number
  created_at: string
  updated_at: string
}

export interface OrgCreatePayload {
  business_name: string
  slug: string
  owner_email: string
  owner_full_name: string
  owner_password: string
  plan: OrgPlanValue
}

export interface OrgStatusUpdatePayload {
  is_active: boolean
}

export interface OrgPlanUpdatePayload {
  plan: OrgPlanValue
  max_users?: number
  trial_ends_at?: string | null
}

export interface OrgActionResponse {
  message: string
}
