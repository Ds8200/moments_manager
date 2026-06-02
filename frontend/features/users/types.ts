export interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UsersResponse {
  items: User[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface UserFormValues {
  email: string
  full_name: string
}
