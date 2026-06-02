'use client'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useComposeEmail } from '../../queries/useSendEmail'
import { useEmojiInsert } from '@/shared/hooks/useEmojiInsert'
import { SEND_EMAIL_LABELS } from '../../constants/sendEmailLabels'
import type { Recipient } from '../../types'
import type { UseEmojiInsertReturn } from '@/shared/hooks/useEmojiInsert'

const composeSchema = z.object({
  subject: z.string().min(1, SEND_EMAIL_LABELS.VALIDATION_SUBJECT),
  body: z.string().min(1, SEND_EMAIL_LABELS.VALIDATION_BODY),
})

type ComposeFormValues = z.infer<typeof composeSchema>

export interface UseSendEmailPageReturn extends UseEmojiInsertReturn {
  recipients: Recipient[]
  onAddRecipient: (r: Recipient) => void
  onRemoveRecipient: (key: string) => void
  register: ReturnType<typeof useForm<ComposeFormValues>>['register']
  errors: ReturnType<typeof useForm<ComposeFormValues>>['formState']['errors']
  handleSubmit: ReturnType<typeof useForm<ComposeFormValues>>['handleSubmit']
  recipientsError: string | undefined
  onSubmit: (values: ComposeFormValues) => void
  isPending: boolean
}

export const useSendEmailPage = (): UseSendEmailPageReturn => {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientsError, setRecipientsError] = useState<string | undefined>()

  const compose = useComposeEmail()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<ComposeFormValues>({ resolver: zodResolver(composeSchema) })

  const emojiInsert = useEmojiInsert('body', getValues, setValue)

  const onAddRecipient = useCallback((r: Recipient) => {
    setRecipients((prev) => [...prev, r])
    setRecipientsError(undefined)
  }, [])

  const onRemoveRecipient = useCallback((key: string) => {
    setRecipients((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const onSubmit = (values: ComposeFormValues): void => {
    if (recipients.length === 0) {
      setRecipientsError(SEND_EMAIL_LABELS.VALIDATION_RECIPIENTS)
      return
    }
    const customer_ids = recipients
      .filter((r) => r.customer_id !== undefined)
      .map((r) => r.customer_id!)
    const manual_emails = recipients
      .filter((r) => r.customer_id === undefined)
      .map((r) => r.email)

    compose.mutate(
      { customer_ids, manual_emails, subject: values.subject, body: values.body },
      {
        onSuccess: () => {
          reset()
          setRecipients([])
          setRecipientsError(undefined)
          emojiInsert.closePicker()
        },
      },
    )
  }

  return {
    recipients,
    onAddRecipient,
    onRemoveRecipient,
    register,
    errors,
    handleSubmit,
    recipientsError,
    onSubmit,
    isPending: compose.isPending,
    ...emojiInsert,
  }
}
