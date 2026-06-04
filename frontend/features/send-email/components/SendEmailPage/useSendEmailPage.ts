'use client'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ChangeEvent, DragEvent, RefCallback } from 'react'
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
  mergedBodyRef: RefCallback<HTMLTextAreaElement>
  bodyRest: Omit<ReturnType<ReturnType<typeof useForm<ComposeFormValues>>['register']>, 'ref'>
  files: File[]
  addFiles: (dropped: File[]) => void
  removeFile: (index: number) => void
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  isDragOver: boolean
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
}

export const useSendEmailPage = (): UseSendEmailPageReturn => {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientsError, setRecipientsError] = useState<string | undefined>()
  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const compose = useComposeEmail()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<ComposeFormValues>({ resolver: zodResolver(composeSchema) })

  const emojiInsert = useEmojiInsert('subject', 'body', getValues, setValue)

  // Merge react-hook-form's body ref with our textareaRef in the hook so the
  // component doesn't need to contain any ref-merging logic.
  // RHF v7 always returns a callback ref (RefCallBack), so no object-ref branch needed.
  const { ref: rhfBodyRef, ...bodyRest } = register('body')
  const mergedBodyRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      emojiInsert.textareaCallbackRef(el)
      rhfBodyRef(el)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rhfBodyRef identity is stable per react-hook-form
    [emojiInsert.textareaCallbackRef, rhfBodyRef],
  )

  const onAddRecipient = useCallback((r: Recipient) => {
    setRecipients((prev) => [...prev, r])
    setRecipientsError(undefined)
  }, [])

  const onRemoveRecipient = useCallback((key: string) => {
    setRecipients((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const addFiles = useCallback((dropped: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const next = dropped.filter((f) => !existing.has(`${f.name}-${f.size}`))
      return [...prev, ...next]
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? [])
      if (picked.length > 0) addFiles(picked)
      e.target.value = '' // allow re-selecting the same file
    },
    [addFiles],
  )

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Only clear when leaving the card itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragOver(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const dropped = Array.from(e.dataTransfer.files)
      if (dropped.length > 0) addFiles(dropped)
    },
    [addFiles],
  )

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
          setFiles([])
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
    mergedBodyRef,
    bodyRest,
    files,
    addFiles,
    removeFile,
    onFileInputChange,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    ...emojiInsert,
  }
}
