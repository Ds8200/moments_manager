'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isCustomerFormOpenAtom } from '../../store/customersAtoms'
import { useCreateCustomer } from '../../queries/useCustomers'
import type { CustomerFormValues } from '../../types'

import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

const schema = z.object({
  name:  z.string().min(1, CUSTOMERS_LABELS.VALIDATION_NAME_REQUIRED),
  phone: z.string(),
  email: z.string().email(CUSTOMERS_LABELS.VALIDATION_EMAIL_INVALID).or(z.literal('')),
  notes: z.string(),
})

const DEFAULT_VALUES: CustomerFormValues = {
  name:  '',
  phone: '',
  email: '',
  notes: '',
}

// Creates new customers only — editing an existing customer happens inline on its detail page.
export interface UseCustomerFormReturn {
  isOpen: boolean
  register: ReturnType<typeof useForm<CustomerFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<CustomerFormValues>>['handleSubmit']
  onSubmit: (values: CustomerFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<CustomerFormValues>>['formState']['errors']
  isSubmitting: boolean
  onClose: () => void
  closeSymbol: string
}

export const useCustomerForm = (): UseCustomerFormReturn => {
  const [isOpen, setOpen] = useAtom(isCustomerFormOpenAtom)
  const createCustomer    = useCreateCustomer()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES)
  }, [isOpen, reset])

  const onClose = (): void => setOpen(false)

  const onSubmit = async (values: CustomerFormValues): Promise<void> => {
    await createCustomer.mutateAsync(values)
    onClose()
  }

  return {
    isOpen,
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    onClose,
    closeSymbol: UI_SYMBOLS.CLOSE,
  }
}
