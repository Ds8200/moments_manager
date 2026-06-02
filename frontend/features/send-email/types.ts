export interface ComposeEmailPayload {
  customer_ids: string[]
  manual_emails: string[]
  subject: string
  body: string
}

export interface ComposeEmailResponse {
  message: string
  sent_to: number
}

export interface Recipient {
  key: string
  label: string
  email: string
  customer_id?: string
}
