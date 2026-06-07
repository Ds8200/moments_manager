export interface RegistrationFormValues {
  business_name: string
  slug: string
  owner_email: string
  password: string
}

export interface RegistrationResponse {
  org_id: string
  org_slug: string
  user_id: string
  message: string
}
