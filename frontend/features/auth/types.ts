export interface LoginFormValues {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
}
