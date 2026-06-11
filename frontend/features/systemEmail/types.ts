import { z } from 'zod'

export const OrgOwnerEmailSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  full_name: z.string(),
  org_name: z.string(),
  org_id: z.string(),
})

export type OrgOwnerEmail = z.infer<typeof OrgOwnerEmailSchema>

export interface AdminComposePayload {
  org_owner_ids: string[]
  manual_emails: string[]
  subject: string
  body: string
}

export interface AdminComposeResponse {
  message: string
  sent_to: number
}

export interface OrgOwnerRecipient {
  key: string
  label: string
  email: string
  user_id?: string
}
