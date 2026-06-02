import type { Metadata } from 'next'
import { SendEmailPage } from '@/features/send-email/components/SendEmailPage/SendEmailPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.SEND_EMAIL_TITLE }

export default function Page() {
  return <SendEmailPage />
}
