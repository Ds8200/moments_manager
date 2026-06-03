export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UpdateNamePayload {
  full_name: string
}

export interface UpdatePasswordPayload {
  current_password: string
  new_password: string
}
