'use client'
import { useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import type { Resolver, UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isOrderFormOpenAtom } from '../../store/ordersAtoms'
import { useCreateOrder } from '../../queries/useOrder'
import { useCustomers, useCreateCustomer } from '@/features/customers/queries/useCustomers'
import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'
import type { Customer } from '@/features/customers/types'
import type { OrderFormValues, OrderPayload } from '../../types'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

const itemSchema = z.object({
  product_id:   z.string().nullable(),
  product_name: z.string().min(1, ORDERS_LABELS.VALIDATION_PRODUCT_NAME),
  quantity:     z.number().min(1, ORDERS_LABELS.VALIDATION_QTY_MIN),
  unit_price:   z.string().min(1, ORDERS_LABELS.VALIDATION_PRICE),
  unit_cost:    z.string(),
  design_notes: z.string(),
})

const schema = z.object({
  customer_id:   z.string(),
  customer_name: z.string(),
  date:          z.string().min(1, ORDERS_LABELS.VALIDATION_DATE),
  due_datetime:  z.string(),
  notes:         z.string(),
  items:         z.array(itemSchema).min(1, ORDERS_LABELS.VALIDATION_ITEMS_MIN),
}).refine(
  (d) => d.customer_id.length > 0 || d.customer_name.trim().length > 0,
  { message: ORDERS_LABELS.VALIDATION_CUSTOMER, path: ['customer_id'] }
)

const DEFAULT_ITEM: OrderFormValues['items'][number] = {
  product_id:   null,
  product_name: '',
  quantity:     1,
  unit_price:   '',
  unit_cost:    '0',
  design_notes: '',
}

const DEFAULT_VALUES: OrderFormValues = {
  customer_id:   '',
  customer_name: '',
  date:          new Date().toISOString().split('T')[0],
  due_datetime:  '',
  notes:         '',
  items:         [DEFAULT_ITEM],
}

// Creates new orders only — editing an existing order happens inline on its detail page.
export interface UseOrderFormReturn {
  isOpen: boolean
  register: ReturnType<typeof useForm<OrderFormValues>>['register']
  control: ReturnType<typeof useForm<OrderFormValues>>['control']
  setValue: UseFormSetValue<OrderFormValues>
  handleSubmit: ReturnType<typeof useForm<OrderFormValues>>['handleSubmit']
  onSubmit: (values: OrderFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<OrderFormValues>>['formState']['errors']
  isSubmitting: boolean
  fields: ReturnType<typeof useFieldArray<OrderFormValues, 'items'>>['fields']
  appendItem: () => void
  removeItem: (index: number) => void
  onClose: () => void
  customerOptions: AutocompleteOption<Customer>[]
  customersLoading: boolean
  setCustomerSearch: (query: string) => void
  customerDefaultLabel: string
  onRawInput: (text: string) => void
  closeSymbol: string
}

export const useOrderForm = (): UseOrderFormReturn => {
  const [isOpen, setOpen] = useAtom(isOrderFormOpenAtom)
  const [customerSearch, setCustomerSearch] = useState('')
  const { data: customersData, isPending: customersLoading } = useCustomers(1, customerSearch, 20)
  const createOrder = useCreateOrder()
  const createCustomer = useCreateCustomer()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    // z.coerce.number() input type is unknown; cast to align with OrderFormValues
    resolver: zodResolver(schema) as Resolver<OrderFormValues>,
    defaultValues: DEFAULT_VALUES,
  })

  // Watch customer_name to use as defaultLabel so the Autocomplete keeps showing
  // the free-text value after blur (when no customer_id is selected).
  const watchedCustomerName = useWatch({ control, name: 'customer_name' })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES)
  }, [isOpen, reset])

  const onClose = (): void => setOpen(false)

  // Called on every keystroke (not debounced) so customer_name is always current
  // before the form submits — even if the user clicks Save immediately after typing.
  const onRawInput = (text: string): void => {
    setValue('customer_id', '')
    setValue('customer_name', text)
  }

  const onSubmit = async (values: OrderFormValues): Promise<void> => {
    let customerId = values.customer_id || null
    if (!customerId && values.customer_name.trim()) {
      const newCustomer = await createCustomer.mutateAsync({ name: values.customer_name.trim(), phone: '', email: '', notes: '' })
      customerId = newCustomer.id
    }
    const payload: OrderPayload = {
      customer_id:  customerId,
      due_datetime: values.due_datetime || null,
      date:         values.date,
      notes:        values.notes,
      items:        values.items,
    }
    await createOrder.mutateAsync(payload)
    onClose()
  }

  const customerOptions: AutocompleteOption<Customer>[] = (customersData?.items ?? []).map(
    (c) => ({ value: c.id, label: c.name, data: c })
  )

  return {
    isOpen,
    register,
    control,
    setValue,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    fields,
    appendItem: () => append(DEFAULT_ITEM),
    removeItem: remove,
    onClose,
    customerOptions,
    customersLoading,
    setCustomerSearch,
    // Free-text mode: show the typed name so the input stays populated after blur.
    customerDefaultLabel: watchedCustomerName,
    onRawInput,
    closeSymbol: UI_SYMBOLS.CLOSE,
  }
}
