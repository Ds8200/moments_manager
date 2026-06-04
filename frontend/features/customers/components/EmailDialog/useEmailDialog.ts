'use client'
import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ChangeEvent, DragEvent, RefCallback } from 'react'
import { emailingCustomerIdAtom } from '../../store/customersAtoms'
import { useCustomer } from '../../queries/useCustomers'
import { useSendCustomerEmail } from '../../queries/useCustomers'
import { useEmojiInsert } from '@/shared/hooks/useEmojiInsert'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { CustomerSendEmailPayload, EmailAttachment } from '../../types'
import type { UseEmojiInsertReturn } from '@/shared/hooks/useEmojiInsert'

const emailSchema = z.object({
  subject: z.string().min(1, CUSTOMERS_LABELS.VALIDATION_SUBJECT_REQUIRED),
  body: z.string().min(1, CUSTOMERS_LABELS.VALIDATION_BODY_REQUIRED),
})

type EmailFormValues = z.infer<typeof emailSchema>

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

export interface UseEmailDialogReturn extends UseEmojiInsertReturn {
  isOpen: boolean
  customerNameSuffix: string
  emojiPickerSymbol: string
  register: ReturnType<typeof useForm<EmailFormValues>>['register']
  errors: ReturnType<typeof useForm<EmailFormValues>>['formState']['errors']
  handleSubmit: ReturnType<typeof useForm<EmailFormValues>>['handleSubmit']
  onSubmit: (values: EmailFormValues) => Promise<void>
  onClose: () => void
  isPending: boolean
  mergedSubjectRef: RefCallback<HTMLInputElement>
  subjectInputProps: Omit<ReturnType<ReturnType<typeof useForm<EmailFormValues>>['register']>, 'ref'>
  mergedBodyRef: RefCallback<HTMLTextAreaElement>
  bodyInputProps: Omit<ReturnType<ReturnType<typeof useForm<EmailFormValues>>['register']>, 'ref'>
  files: File[]
  addFiles: (dropped: File[]) => void
  removeFile: (index: number) => void
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  isDragOver: boolean
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  fileError: string | undefined
}

export const useEmailDialog = (): UseEmailDialogReturn => {
  const [emailingCustomerId, setEmailingCustomerId] = useAtom(emailingCustomerIdAtom)
  const isOpen = emailingCustomerId !== null
  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | undefined>()

  const { data: customer } = useCustomer(emailingCustomerId)
  const sendEmail = useSendCustomerEmail()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) })

  const emojiInsert = useEmojiInsert('subject', 'body', getValues, setValue)
  const { closePicker } = emojiInsert

  const onClose = useCallback((): void => {
    setEmailingCustomerId(null)
    reset()
    setFiles([])
    setFileError(undefined)
    closePicker()
  }, [setEmailingCustomerId, reset, closePicker])

  // RHF v7 always returns a callback ref — no object-ref branch needed.
  const { ref: rhfSubjectRef, ...subjectInputProps } = register('subject')
  const mergedSubjectRef = useCallback(
    (el: HTMLInputElement | null): void => {
      emojiInsert.subjectCallbackRef(el)
      rhfSubjectRef(el)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rhfSubjectRef identity is stable per react-hook-form
    [emojiInsert.subjectCallbackRef, rhfSubjectRef],
  )

  const { ref: rhfBodyRef, ...bodyInputProps } = register('body')
  const mergedBodyRef = useCallback(
    (el: HTMLTextAreaElement | null): void => {
      emojiInsert.textareaCallbackRef(el)
      rhfBodyRef(el)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rhfBodyRef identity is stable per react-hook-form
    [emojiInsert.textareaCallbackRef, rhfBodyRef],
  )

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
      e.target.value = ''
    },
    [addFiles],
  )

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
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

  const onSubmit = async (values: EmailFormValues): Promise<void> => {
    if (!emailingCustomerId) return
    if (files.reduce((sum, f) => sum + f.size, 0) > MAX_ATTACHMENT_BYTES) {
      setFileError(UI_LABELS.FILE_TOO_LARGE)
      return
    }
    setFileError(undefined)

    const attachments: EmailAttachment[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await fileToBase64(file),
      })),
    )

    const payload: CustomerSendEmailPayload = {
      subject: values.subject,
      body: values.body,
      attachments,
    }
    sendEmail.mutate(
      { id: emailingCustomerId, payload },
      { onSuccess: onClose },
    )
  }

  const customerNameSuffix = customer?.name
    ? `${UI_SYMBOLS.EM_DASH} ${customer.name}`
    : ''

  return {
    isOpen,
    customerNameSuffix,
    emojiPickerSymbol: UI_SYMBOLS.EMOJI_PICKER,
    register,
    errors,
    handleSubmit,
    onSubmit,
    onClose,
    isPending: sendEmail.isPending,
    mergedSubjectRef,
    subjectInputProps,
    mergedBodyRef,
    bodyInputProps,
    files,
    addFiles,
    removeFile,
    onFileInputChange,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    fileError,
    ...emojiInsert,
  }
}
