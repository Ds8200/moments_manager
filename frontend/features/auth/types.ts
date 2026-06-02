export interface LoginFormValues {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export type UserRole = 'admin' | 'user'

export interface TokenPayload {
  sub: string
  role: UserRole
  exp: number
}

export interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  role: UserRole | null
}
