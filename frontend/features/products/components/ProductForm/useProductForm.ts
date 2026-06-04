'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { useProduct, useCreateProduct, useUpdateProduct } from '../../queries/useProducts'
import { useProductCategories } from '@/features/productCategories'
import type { ProductCategory, ProductFormValues } from '../../types'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

const schema = z.object({
  name:     z.string().min(1, PRODUCTS_LABELS.VALIDATION_NAME_REQUIRED),
  category_id: z.string(),
  base_price: z.string().min(1, PRODUCTS_LABELS.VALIDATION_PRICE),
  base_cost:  z.string().min(1, PRODUCTS_LABELS.VALIDATION_COST),
  avg_production_days: z.preprocess(
    (val) =>
      val === '' || val === null || (typeof val === 'number' && isNaN(val as number))
        ? null
        : Number(val),
    z.number().nullable(),
  ),
  is_active: z.boolean(),
})

const DEFAULT_VALUES: ProductFormValues = {
  name:                '',
  category_id:         '',
  base_price:          '',
  base_cost:           '',
  avg_production_days: null,
  is_active:           true,
}

export interface UseProductFormReturn {
  isOpen: boolean
  isEditing: boolean
  register: ReturnType<typeof useForm<ProductFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<ProductFormValues>>['handleSubmit']
  onSubmit: (values: ProductFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<ProductFormValues>>['formState']['errors']
  isSubmitting: boolean
  onClose: () => void
  categories: ProductCategory[]
  isCategoryManagerOpen: boolean
  openCategoryManager: () => void
  closeCategoryManager: () => void
  closeSymbol: string
  currencySymbol: string
}

export const useProductForm = (): UseProductFormReturn => {
  const [isOpen, setOpen]           = useAtom(isProductFormOpenAtom)
  const [editingId, setEditingId]   = useAtom(editingProductIdAtom)
  const { data: existingProduct }   = useProduct(editingId)
  const createProduct               = useCreateProduct()
  const updateProduct               = useUpdateProduct()
  const { data: categories = [] }   = useProductCategories()
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    // z.preprocess has unknown input; cast to align with ProductFormValues
    resolver: zodResolver(schema) as Resolver<ProductFormValues>,
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (isOpen && existingProduct) {
      reset({
        name:                existingProduct.name,
        category_id:         existingProduct.category_id ?? '',
        base_price:          existingProduct.base_price,
        base_cost:           existingProduct.base_cost,
        avg_production_days: existingProduct.avg_production_days,
        is_active:           existingProduct.is_active,
      })
    } else if (isOpen && !editingId) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, existingProduct, editingId, reset])

  const onClose = (): void => {
    setOpen(false)
    setEditingId(null)
    setCategoryManagerOpen(false)
  }

  const onSubmit = async (values: ProductFormValues): Promise<void> => {
    const payload = { ...values, category_id: values.category_id || undefined }
    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, payload })
    } else {
      await createProduct.mutateAsync(payload as ProductFormValues)
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
    categories,
    isCategoryManagerOpen,
    openCategoryManager: () => setCategoryManagerOpen(true),
    closeCategoryManager: () => setCategoryManagerOpen(false),
    closeSymbol: UI_SYMBOLS.CLOSE,
    currencySymbol: UI_SYMBOLS.CURRENCY,
  }
}
