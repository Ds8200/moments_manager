'use client'
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isOrderFormOpenAtom, editingOrderIdAtom } from '../../store/ordersAtoms'
import { useOrder, useCreateOrder, useUpdateOrder } from '../../queries/useOrder'
import { useCustomers } from '@/features/customers/queries/useCustomers'
import type { Customer } from '@/features/customers/types'
import type { OrderFormValues } from '../../types'

const itemSchema = z.object({
  product_id:   z.string().nullable(),
  product_name: z.string().min(1, 'נדרש שם מוצר'),
  quantity:     z.number().min(1, 'כמות מינימלית 1'),
  unit_price:   z.string().min(1, 'נדרש מחיר'),
  unit_cost:    z.string(),
  design_notes: z.string(),
})

const schema = z.object({
  customer_id:        z.string().min(1, 'נדרש לקוח'),
  date:               z.string().min(1, 'נדרש תאריך'),
  target_description: z.string(),
  notes:              z.string(),
  items:              z.array(itemSchema).min(1, 'נדרש לפחות פריט אחד'),
})

const DEFAULT_ITEM: OrderFormValues['items'][number] = {
  product_id:   null,
  product_name: '',
  quantity:     1,
  unit_price:   '',
  unit_cost:    '0',
  design_notes: '',
}

const DEFAULT_VALUES: OrderFormValues = {
  customer_id:        '',
  date:               new Date().toISOString().split('T')[0],
  target_description: '',
  notes:              '',
  items:              [DEFAULT_ITEM],
}

export interface UseOrderFormReturn {
  isOpen: boolean
  isEditing: boolean
  register: ReturnType<typeof useForm<OrderFormValues>>['register']
  control: ReturnType<typeof useForm<OrderFormValues>>['control']
  handleSubmit: ReturnType<typeof useForm<OrderFormValues>>['handleSubmit']
  onSubmit: (values: OrderFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<OrderFormValues>>['formState']['errors']
  isSubmitting: boolean
  fields: ReturnType<typeof useFieldArray<OrderFormValues, 'items'>>['fields']
  appendItem: () => void
  removeItem: (index: number) => void
  onClose: () => void
  customers: Customer[]
}

export const useOrderForm = (): UseOrderFormReturn => {
  const [isOpen, setOpen] = useAtom(isOrderFormOpenAtom)
  const [editingId, setEditingId] = useAtom(editingOrderIdAtom)
  const { data: existingOrder } = useOrder(editingId)
  const { data: customersData } = useCustomers(1, '', 100)
  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    // z.coerce.number() input type is unknown; cast to align with OrderFormValues
    resolver: zodResolver(schema) as Resolver<OrderFormValues>,
    defaultValues: DEFAULT_VALUES,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (isOpen && existingOrder) {
      reset({
        customer_id:        existingOrder.customer_id,
        date:               existingOrder.date,
        target_description: existingOrder.target_description ?? '',
        notes:              existingOrder.notes ?? '',
        items: existingOrder.items.map((it) => ({
          product_id:   it.product_id,
          product_name: it.product_name,
          quantity:     it.quantity,
          unit_price:   it.unit_price,
          unit_cost:    it.unit_cost,
          design_notes: it.design_notes ?? '',
        })),
      })
    } else if (isOpen && !editingId) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, existingOrder, editingId, reset])

  const onClose = (): void => {
    setOpen(false)
    setEditingId(null)
  }

  const onSubmit = async (values: OrderFormValues): Promise<void> => {
    if (editingId) {
      await updateOrder.mutateAsync({ id: editingId, payload: values })
    } else {
      await createOrder.mutateAsync(values)
    }
    onClose()
  }

  return {
    isOpen,
    isEditing: !!editingId,
    register,
    control,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    fields,
    appendItem: () => append(DEFAULT_ITEM),
    removeItem: remove,
    onClose,
    customers: customersData?.items ?? [],
  }
}
