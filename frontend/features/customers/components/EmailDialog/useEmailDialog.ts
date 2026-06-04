'use client'
import { useAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { emailingCustomerIdAtom } from '../../store/customersAtoms'
import { useCustomer } from '../../queries/useCustomers'
import { useSendCustomerEmail } from '../../queries/useCustomers'
import { useEmojiInsert } from '@/shared/hooks/useEmojiInsert'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { CustomerSendEmailPayload } from '../../types'
import type { UseEmojiInsertReturn } from '@/shared/hooks/useEmojiInsert'

const emailSchema = z.object({
  subject: z.string().min(1, CUSTOMERS_LABELS.VALIDATION_SUBJECT_REQUIRED),
  body: z.string().min(1, CUSTOMERS_LABELS.VALIDATION_BODY_REQUIRED),
})

type EmailFormValues = z.infer<typeof emailSchema>

export interface UseEmailDialogReturn extends UseEmojiInsertReturn {
  isOpen: boolean
  customerNameSuffix: string
  emojiPickerSymbol: string
  register: ReturnType<typeof useForm<EmailFormValues>>['register']
  errors: ReturnType<typeof useForm<EmailFormValues>>['formState']['errors']
  handleSubmit: ReturnType<typeof useForm<EmailFormValues>>['handleSubmit']
  onSubmit: (values: EmailFormValues) => void
  onClose: () => void
  isPending: boolean
  mergedBodyRef: (el: HTMLTextAreaElement | null) => void
  bodyInputProps: Omit<ReturnType<ReturnType<typeof useForm<EmailFormValues>>['register']>, 'ref'>
}

export const useEmailDialog = (): UseEmailDialogReturn => {
  const [emailingCustomerId, setEmailingCustomerId] = useAtom(emailingCustomerIdAtom)
  const isOpen = emailingCustomerId !== null

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

  const emojiInsert = useEmojiInsert('body', getValues, setValue)

  useEffect(() => {
    if (!isOpen) {
      reset()
      emojiInsert.closePicker()
    }
  }, [isOpen, reset, emojiInsert.closePicker])

  const onClose = (): void => {
    setEmailingCustomerId(null)
  }

  const onSubmit = (values: EmailFormValues): void => {
    if (!emailingCustomerId) return
    const payload: CustomerSendEmailPayload = { subject: values.subject, body: values.body }
    sendEmail.mutate(
      { id: emailingCustomerId, payload },
      { onSuccess: onClose },
    )
  }

  const { ref: rhfBodyRef, ...bodyInputProps } = register('body')
  const mergedBodyRef = useCallback(
    (el: HTMLTextAreaElement | null): void => {
      emojiInsert.textareaRef.current = el
      if (typeof rhfBodyRef === 'function') {
        rhfBodyRef(el)
      } else if (rhfBodyRef) {
        (rhfBodyRef as MutableRefObject<HTMLTextAreaElement | null>).current = el
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rhfBodyRef],
  )

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
    mergedBodyRef,
    bodyInputProps,
    ...emojiInsert,
  }
}
