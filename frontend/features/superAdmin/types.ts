import type { OrgPlanValue } from './enums/orgPlanEnums'

export interface OrgAdminResponse {
  id: string
  org_number: string
  slug: string
  name: string
  logo_path: string | null
  plan: OrgPlanValue
  trial_ends_at: string | null
  is_active: boolean
  max_users: number
  owner_id: string
  owner_email: string
  member_count: number
  created_at: string
  updated_at: string
}

export interface OrgOwnerAdminResponse {
  id: string
  email: string
  full_name: string
  phone: string | null
  org_count: number
  created_at: string
}

export interface UserSearchResult {
  id: string
  email: string
  full_name: string
  phone: string | null
}

export interface OrgListFilters {
  search: string
  plan: string
  is_active: string
  page: number
  page_size: number
}

export interface UserListFilters {
  search: string
  page: number
  page_size: number
}

export interface OrgUpdatePayload {
  name?: string
  slug?: string
}

export interface OrgCreatePayload {
  business_name: string
  plan: OrgPlanValue
  slug?: string
  existing_user_id?: string
  owner_email?: string
  owner_full_name?: string
  owner_password?: string
  owner_phone?: string
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
