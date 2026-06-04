'use client'
import { useState, useCallback } from 'react'
import { useWatch } from 'react-hook-form'
import type { Control, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form'
import { useProducts } from '@/features/products/queries/useProducts'
import type { Product } from '@/features/products/types'
import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'
import type { OrderFormValues } from '../../../types'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

export interface OrderItemRowProps {
  index: number
  control: Control<OrderFormValues>
  register: UseFormRegister<OrderFormValues>
  setValue: UseFormSetValue<OrderFormValues>
  errors: FieldErrors<OrderFormValues>
  isOnly: boolean
  onRemove: () => void
}

export interface UseOrderItemRowReturn {
  productOptions: AutocompleteOption<Product>[]
  isProductsLoading: boolean
  currentProductId: string | null
  currentProductName: string
  onProductSearch: (query: string) => void
  onProductSelect: (value: string | null, option: AutocompleteOption<Product> | null) => void
  closeSymbol: string
  currencySymbol: string
}

export const useOrderItemRow = (props: OrderItemRowProps): UseOrderItemRowReturn => {
  const { index, control, setValue } = props
  const [productSearch, setProductSearch] = useState('')

  const { data: productsData, isPending: isProductsLoading } = useProducts(1, productSearch)

  const currentProductId = useWatch({
    control,
    name: `items.${index}.product_id`,
  }) as string | null

  const currentProductName = useWatch({
    control,
    name: `items.${index}.product_name`,
  }) as string

  const productOptions: AutocompleteOption<Product>[] = (productsData?.items ?? [])
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: p.name, data: p }))

  const onProductSearch = useCallback((query: string) => {
    setProductSearch(query)
  }, [])

  const onProductSelect = useCallback(
    (value: string | null, option: AutocompleteOption<Product> | null) => {
      if (!option?.data) {
        setValue(`items.${index}.product_id`, null)
        setValue(`items.${index}.product_name`, '')
        setValue(`items.${index}.unit_price`, '')
        setValue(`items.${index}.unit_cost`, '0')
        return
      }
      setValue(`items.${index}.product_id`, value)
      setValue(`items.${index}.product_name`, option.data.name)
      setValue(`items.${index}.unit_price`, option.data.base_price)
      setValue(`items.${index}.unit_cost`, option.data.base_cost)
    },
    [index, setValue]
  )

  return {
    productOptions,
    isProductsLoading,
    currentProductId,
    currentProductName,
    onProductSearch,
    onProductSelect,
    closeSymbol: UI_SYMBOLS.CLOSE,
    currencySymbol: UI_SYMBOLS.CURRENCY,
  }
}
