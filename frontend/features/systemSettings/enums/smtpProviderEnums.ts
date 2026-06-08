import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'

export const SMTP_PROVIDER = {
  GMAIL:       'gmail',
  OUTLOOK:     'outlook',
  ZOHO:        'zoho',
  BREVO:       'brevo',
  SENDGRID:    'sendgrid',
  GODADDY:     'godaddy',
  AMAZON_SES:  'amazon_ses',
  MAILGUN:     'mailgun',
} as const

export type SmtpProvider = (typeof SMTP_PROVIDER)[keyof typeof SMTP_PROVIDER]

export interface SmtpProviderConfig {
  key: SmtpProvider
  label: string
  host: string
  port: number
}

export const SMTP_PROVIDERS: SmtpProviderConfig[] = [
  { key: SMTP_PROVIDER.GMAIL,      label: 'Gmail',              host: 'smtp.gmail.com',                     port: 587 },
  { key: SMTP_PROVIDER.OUTLOOK,    label: 'Outlook / Hotmail',  host: 'smtp-mail.outlook.com',              port: 587 },
  { key: SMTP_PROVIDER.ZOHO,       label: 'Zoho Mail',          host: 'smtp.zoho.com',                      port: 587 },
  { key: SMTP_PROVIDER.BREVO,      label: 'Brevo (SendinBlue)', host: 'smtp-relay.brevo.com',               port: 587 },
  { key: SMTP_PROVIDER.SENDGRID,   label: 'SendGrid',           host: 'smtp.sendgrid.net',                  port: 587 },
  { key: SMTP_PROVIDER.GODADDY,    label: 'GoDaddy',            host: 'smtpout.secureserver.net',           port: 465 },
  { key: SMTP_PROVIDER.AMAZON_SES, label: 'Amazon SES',         host: 'email-smtp.us-east-1.amazonaws.com', port: 587 },
  { key: SMTP_PROVIDER.MAILGUN,    label: 'Mailgun',            host: 'smtp.mailgun.org',                   port: 587 },
]

export const buildSmtpProviderOptions = (
  search: string,
): AutocompleteOption<SmtpProviderConfig>[] => {
  const q = search.toLowerCase()
  return SMTP_PROVIDERS
    .filter(p => !q || p.label.toLowerCase().includes(q) || p.host.includes(q))
    .map(p => ({ value: p.host, label: p.label, data: p }))
}
