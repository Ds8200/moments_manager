'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isProductFormOpenAtom } from '../../store/productsAtoms'
import { useCreateProduct } from '../../queries/useProducts'
import {
  useProductCategories,
  useCreateProductCategory,
  useDeleteProductCategory,
} from '@/features/productCategories'
import type { UseCategoryManagerModalOptions } from '@/shared/components/CategoryManagerModal/useCategoryManagerModal'
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

// Creates new products only — editing an existing product happens inline on its detail page.
export interface UseProductFormReturn {
  isOpen: boolean
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
  categoryManagerOptions: UseCategoryManagerModalOptions
  closeSymbol: string
  currencySymbol: string
}

export const useProductForm = (): UseProductFormReturn => {
  const [isOpen, setOpen]           = useAtom(isProductFormOpenAtom)
  const createProduct               = useCreateProduct()
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories()
  const createCategory              = useCreateProductCategory()
  const deleteCategory              = useDeleteProductCategory()
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
    if (isOpen) reset(DEFAULT_VALUES)
  }, [isOpen, reset])

  const onClose = (): void => {
    setOpen(false)
    setCategoryManagerOpen(false)
  }

  const onSubmit = async (values: ProductFormValues): Promise<void> => {
    const payload = { ...values, category_id: values.category_id || undefined }
    await createProduct.mutateAsync(payload as ProductFormValues)
    onClose()
  }

  const categoryManagerOptions: UseCategoryManagerModalOptions = {
    categories,
    isLoading: categoriesLoading,
    onCreate: (name) => createCategory.mutateAsync(name),
    onDelete: (id) => deleteCategory.mutateAsync(id),
    isCreating: createCategory.isPending,
    inUseErrorCode: 'CATEGORY_IN_USE',
    inUseErrorMessage: PRODUCTS_LABELS.CATEGORY_IN_USE_ERROR,
    onClose: () => setCategoryManagerOpen(false),
    labels: {
      title:          PRODUCTS_LABELS.CATEGORY_MANAGER_TITLE,
      addPlaceholder: PRODUCTS_LABELS.CATEGORY_ADD_PLACEHOLDER,
      addBtn:         PRODUCTS_LABELS.CATEGORY_ADD_BTN,
      empty:          PRODUCTS_LABELS.CATEGORY_EMPTY,
      deleteTitle:    PRODUCTS_LABELS.CATEGORY_DELETE_TITLE,
    },
  }

  return {
    isOpen,
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
    categoryManagerOptions,
    closeSymbol: UI_SYMBOLS.CLOSE,
    currencySymbol: UI_SYMBOLS.CURRENCY,
  }
}
