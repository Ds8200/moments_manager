export interface LoginFormValues {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export type UserRole = 'system_admin' | 'user'
export type OrgRole = 'owner' | 'admin' | 'member'

export interface TokenPayload {
  sub: string
  role: UserRole
  org_id: string | null
  org_role: OrgRole | null
  sys_admin: boolean
  exp: number
}

export interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  role: UserRole | null
}
