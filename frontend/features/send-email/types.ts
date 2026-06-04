export interface EmailAttachment {
  name: string
  content: string // base64-encoded file content
}

export interface ComposeEmailPayload {
  customer_ids: string[]
  manual_emails: string[]
  subject: string
  body: string
  attachments: EmailAttachment[]
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
