'use client'
import { useState } from 'react'
import { useUpdateOrder } from '../../../queries/useOrder'
import { useProducts } from '@/features/products/queries/useProducts'
import { formatCurrency } from '@/shared/utils/formatters'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'
import type { Product } from '@/features/products/types'
import type { OrderItem, OrderItemFormValues } from '../../../types'

export interface OrderDetailItemsProps {
  orderId: string
  items: OrderItem[]
}

const DRAFT_DEFAULTS: Omit<OrderItemFormValues, 'product_id' | 'product_name' | 'unit_price' | 'unit_cost'> = {
  quantity: 1,
  design_notes: '',
}

function toFormValues(item: OrderItem): OrderItemFormValues {
  return {
    product_id:   item.product_id,
    product_name: item.product_name,
    quantity:     item.quantity,
    unit_price:   item.unit_price,
    unit_cost:    item.unit_cost,
    design_notes: item.design_notes ?? '',
  }
}

export interface UseOrderDetailItemsReturn {
  items: OrderItem[]
  formatAmount: (v: string) => string
  sectionTitle: string
  colProduct: string
  colQty: string
  colUnitPrice: string
  colUnitCost: string
  colTotal: string
  colProfit: string
  colDesignNotes: string
  addItemLabel: string
  removeItemLabel: string
  productSearchPlaceholder: string
  isDraftOpen: boolean
  productOptions: AutocompleteOption<Product>[]
  isProductsLoading: boolean
  onProductSearch: (query: string) => void
  onDraftProductSelect: (value: string | null, option: AutocompleteOption<Product> | null) => void
  onSaveQuantity: (itemId: string, value: string) => void
  onSaveUnitPrice: (itemId: string, value: string) => void
  onSaveUnitCost: (itemId: string, value: string) => void
  onSaveDesignNotes: (itemId: string, value: string) => void
  onRemoveItem: (itemId: string) => void
  onStartAddItem: () => void
}

export const useOrderDetailItems = (props: OrderDetailItemsProps): UseOrderDetailItemsReturn => {
  const { orderId, items } = props
  const updateOrder = useUpdateOrder()
  const [isDraftOpen, setDraftOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const { data: productsData, isPending: isProductsLoading } = useProducts(1, productSearch)

  const saveItems = (nextItems: OrderItemFormValues[]): void => {
    updateOrder.mutate({ id: orderId, payload: { items: nextItems } })
  }

  const patchItem = (itemId: string, patch: Partial<OrderItemFormValues>): void => {
    const nextItems = items.map((it) =>
      it.id === itemId ? { ...toFormValues(it), ...patch } : toFormValues(it)
    )
    saveItems(nextItems)
  }

  const productOptions: AutocompleteOption<Product>[] = (productsData?.items ?? [])
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: p.name, data: p }))

  return {
    items,
    formatAmount: formatCurrency,
    sectionTitle:   ORDERS_LABELS.DETAIL_SECTION_ITEMS,
    colProduct:     ORDERS_LABELS.DETAIL_COL_PRODUCT,
    colQty:         ORDERS_LABELS.DETAIL_COL_QTY,
    colUnitPrice:   ORDERS_LABELS.DETAIL_COL_UNIT_PRICE,
    colUnitCost:    ORDERS_LABELS.DETAIL_COL_UNIT_COST,
    colTotal:       ORDERS_LABELS.DETAIL_COL_TOTAL,
    colProfit:      ORDERS_LABELS.DETAIL_COL_PROFIT,
    colDesignNotes: ORDERS_LABELS.DETAIL_COL_DESIGN_NOTES,
    addItemLabel:   ORDERS_LABELS.FORM_ADD_ITEM,
    removeItemLabel: ORDERS_LABELS.ITEM_REMOVE,
    productSearchPlaceholder: ORDERS_LABELS.ITEM_SEARCH_PRODUCT,

    isDraftOpen,
    productOptions,
    isProductsLoading,
    onProductSearch: setProductSearch,

    // A new row is a purely local draft — nothing is saved to the order until a
    // product is actually chosen, at which point it joins the real items in one PUT.
    onDraftProductSelect: (value, option) => {
      if (!option?.data) return
      const draft: OrderItemFormValues = {
        ...DRAFT_DEFAULTS,
        product_id:   value,
        product_name: option.data.name,
        unit_price:   option.data.base_price,
        unit_cost:    option.data.base_cost,
      }
      saveItems([...items.map(toFormValues), draft])
      setDraftOpen(false)
      setProductSearch('')
    },

    onSaveQuantity:    (itemId, value) => patchItem(itemId, { quantity: Number(value) || 1 }),
    onSaveUnitPrice:   (itemId, value) => patchItem(itemId, { unit_price: value }),
    onSaveUnitCost:    (itemId, value) => patchItem(itemId, { unit_cost: value }),
    onSaveDesignNotes: (itemId, value) => patchItem(itemId, { design_notes: value }),

    onRemoveItem: (itemId) => {
      const nextItems = items.filter((it) => it.id !== itemId).map(toFormValues)
      saveItems(nextItems)
    },

    onStartAddItem: () => setDraftOpen(true),
  }
}
