'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../store/customersAtoms'
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../../queries/useCustomers'
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

export interface UseCustomerFormReturn {
  isOpen: boolean
  isEditing: boolean
  register: ReturnType<typeof useForm<CustomerFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<CustomerFormValues>>['handleSubmit']
  onSubmit: (values: CustomerFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<CustomerFormValues>>['formState']['errors']
  isSubmitting: boolean
  onClose: () => void
  closeSymbol: string
}

export const useCustomerForm = (): UseCustomerFormReturn => {
  const [isOpen, setOpen]           = useAtom(isCustomerFormOpenAtom)
  const [editingId, setEditingId]   = useAtom(editingCustomerIdAtom)
  const { data: existingCustomer }  = useCustomer(editingId)
  const createCustomer              = useCreateCustomer()
  const updateCustomer              = useUpdateCustomer()

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
    if (isOpen && existingCustomer) {
      reset({
        name:  existingCustomer.name,
        phone: existingCustomer.phone ?? '',
        email: existingCustomer.email ?? '',
        notes: existingCustomer.notes ?? '',
      })
    } else if (isOpen && !editingId) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, existingCustomer, editingId, reset])

  const onClose = (): void => {
    setOpen(false)
    setEditingId(null)
  }

  const onSubmit = async (values: CustomerFormValues): Promise<void> => {
    if (editingId) {
      await updateCustomer.mutateAsync({ id: editingId, payload: values })
    } else {
      await createCustomer.mutateAsync(values)
    }
    onClose()
  }

  return {
    isOpen,
    isEditing: !!editingId,
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    onClose,
    closeSymbol: UI_SYMBOLS.CLOSE,
  }
}
