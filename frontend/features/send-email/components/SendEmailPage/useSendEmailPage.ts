'use client'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ChangeEvent, DragEvent, RefCallback } from 'react'
import { useComposeEmail } from '../../queries/useSendEmail'
import { useEmojiInsert } from '@/shared/hooks/useEmojiInsert'
import { SEND_EMAIL_LABELS } from '../../constants/sendEmailLabels'
import type { EmailAttachment, Recipient } from '../../types'
import type { UseEmojiInsertReturn } from '@/shared/hooks/useEmojiInsert'

const composeSchema = z.object({
  subject: z.string().min(1, SEND_EMAIL_LABELS.VALIDATION_SUBJECT),
  body: z.string().min(1, SEND_EMAIL_LABELS.VALIDATION_BODY),
})

type ComposeFormValues = z.infer<typeof composeSchema>

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export interface UseSendEmailPageReturn extends UseEmojiInsertReturn {
  recipients: Recipient[]
  onAddRecipient: (r: Recipient) => void
  onRemoveRecipient: (key: string) => void
  register: ReturnType<typeof useForm<ComposeFormValues>>['register']
  errors: ReturnType<typeof useForm<ComposeFormValues>>['formState']['errors']
  handleSubmit: ReturnType<typeof useForm<ComposeFormValues>>['handleSubmit']
  recipientsError: string | undefined
  onSubmit: (values: ComposeFormValues) => Promise<void>
  isPending: boolean
  mergedSubjectRef: RefCallback<HTMLInputElement>
  subjectRest: Omit<ReturnType<ReturnType<typeof useForm<ComposeFormValues>>['register']>, 'ref'>
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

  // Merge RHF refs with our internal refs so the component passes a single ref.
  // RHF v7 always returns a callback ref (RefCallBack), so no object-ref branch needed.
  const { ref: rhfSubjectRef, ...subjectRest } = register('subject')
  const mergedSubjectRef = useCallback(
    (el: HTMLInputElement | null) => {
      emojiInsert.subjectCallbackRef(el)
      rhfSubjectRef(el)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rhfSubjectRef identity is stable per react-hook-form
    [emojiInsert.subjectCallbackRef, rhfSubjectRef],
  )

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

  const onSubmit = async (values: ComposeFormValues): Promise<void> => {
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

    const attachments: EmailAttachment[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await fileToBase64(file),
      })),
    )

    compose.mutate(
      { customer_ids, manual_emails, subject: values.subject, body: values.body, attachments },
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
    mergedSubjectRef,
    subjectRest,
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
