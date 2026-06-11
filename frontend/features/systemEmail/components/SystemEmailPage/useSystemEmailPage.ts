'use client'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useComposeAdminEmail } from '../../queries/useOrgOwners'
import { useNotify } from '@/shared/hooks/useNotify'
import { SYSTEM_EMAIL_LABELS } from '../../constants/systemEmailLabels'
import type { OrgOwnerEmail, OrgOwnerRecipient } from '../../types'

const schema = z.object({
  subject: z.string().min(1, SYSTEM_EMAIL_LABELS.VALIDATION_SUBJECT),
  body: z.string().min(1, SYSTEM_EMAIL_LABELS.VALIDATION_BODY),
})

type FormValues = z.infer<typeof schema>

const ownerToRecipient = (o: OrgOwnerEmail): OrgOwnerRecipient => ({
  key: `owner-${o.user_id}`,
  label: `${o.full_name} (${o.email})`,
  email: o.email,
  user_id: o.user_id,
})

export interface UseSystemEmailPageReturn {
  pageTitle: string
  recipients: OrgOwnerRecipient[]
  recipientsError: string | undefined
  onToggleRecipient: (owner: OrgOwnerEmail) => void
  onSelectAllRecipients: (owners: OrgOwnerEmail[]) => void
  onClearAllRecipients: () => void
  onAddManualRecipient: (email: string) => void
  onRemoveRecipient: (key: string) => void
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
  handleSubmit: ReturnType<typeof useForm<FormValues>>['handleSubmit']
  onSubmit: (values: FormValues) => Promise<void>
  isPending: boolean
  subjectLabel: string
  subjectPlaceholder: string
  bodyLabel: string
  bodyPlaceholder: string
  sendLabel: string
  sendingLabel: string
}

export const useSystemEmailPage = (): UseSystemEmailPageReturn => {
  const [recipients, setRecipients] = useState<OrgOwnerRecipient[]>([])
  const [recipientsError, setRecipientsError] = useState<string | undefined>()

  const compose = useComposeAdminEmail()
  const notify = useNotify()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onToggleRecipient = useCallback((owner: OrgOwnerEmail) => {
    setRecipients((prev) => {
      const exists = prev.some((r) => r.user_id === owner.user_id)
      if (exists) return prev.filter((r) => r.user_id !== owner.user_id)
      return [...prev, ownerToRecipient(owner)]
    })
    setRecipientsError(undefined)
  }, [])

  const onSelectAllRecipients = useCallback((owners: OrgOwnerEmail[]) => {
    setRecipients((prev) => [
      ...prev.filter((r) => r.user_id === undefined),
      ...owners.map(ownerToRecipient),
    ])
    setRecipientsError(undefined)
  }, [])

  const onClearAllRecipients = useCallback(() => {
    setRecipients((prev) => prev.filter((r) => r.user_id === undefined))
  }, [])

  const onAddManualRecipient = useCallback((email: string) => {
    const key = `manual-${email}`
    setRecipients((prev) => {
      if (prev.some((r) => r.key === key)) return prev
      return [...prev, { key, label: email, email }]
    })
    setRecipientsError(undefined)
  }, [])

  const onRemoveRecipient = useCallback((key: string) => {
    setRecipients((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const onSubmit = async (values: FormValues): Promise<void> => {
    if (recipients.length === 0) {
      setRecipientsError(SYSTEM_EMAIL_LABELS.VALIDATION_RECIPIENTS)
      return
    }
    const org_owner_ids = recipients
      .filter((r) => r.user_id !== undefined)
      .map((r) => r.user_id!)
    const manual_emails = recipients
      .filter((r) => r.user_id === undefined)
      .map((r) => r.email)

    try {
      await compose.mutateAsync({ org_owner_ids, manual_emails, subject: values.subject, body: values.body })
      reset()
      setRecipients([])
      setRecipientsError(undefined)
      notify.success(SYSTEM_EMAIL_LABELS.SEND_SUCCESS)
    } catch {
      notify.error(SYSTEM_EMAIL_LABELS.SEND_ERROR)
    }
  }

  return {
    pageTitle: SYSTEM_EMAIL_LABELS.PAGE_TITLE,
    recipients,
    recipientsError,
    onToggleRecipient,
    onSelectAllRecipients,
    onClearAllRecipients,
    onAddManualRecipient,
    onRemoveRecipient,
    register,
    errors,
    handleSubmit,
    onSubmit,
    isPending: compose.isPending,
    subjectLabel: SYSTEM_EMAIL_LABELS.SUBJECT_LABEL,
    subjectPlaceholder: SYSTEM_EMAIL_LABELS.SUBJECT_PLACEHOLDER,
    bodyLabel: SYSTEM_EMAIL_LABELS.BODY_LABEL,
    bodyPlaceholder: SYSTEM_EMAIL_LABELS.BODY_PLACEHOLDER,
    sendLabel: SYSTEM_EMAIL_LABELS.SEND,
    sendingLabel: SYSTEM_EMAIL_LABELS.SENDING,
  }
}
