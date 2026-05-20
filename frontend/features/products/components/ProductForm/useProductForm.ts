'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { useProduct, useCreateProduct, useUpdateProduct } from '../../queries/useProducts'
import type { ProductFormValues } from '../../types'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'

const schema = z.object({
  name:     z.string().min(1, PRODUCTS_LABELS.VALIDATION_NAME_REQUIRED),
  category: z.string(),
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
  category:            '',
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
}

export const useProductForm = (): UseProductFormReturn => {
  const [isOpen, setOpen]           = useAtom(isProductFormOpenAtom)
  const [editingId, setEditingId]   = useAtom(editingProductIdAtom)
  const { data: existingProduct }   = useProduct(editingId)
  const createProduct               = useCreateProduct()
  const updateProduct               = useUpdateProduct()

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
        category:            existingProduct.category ?? '',
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
  }

  const onSubmit = async (values: ProductFormValues): Promise<void> => {
    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, payload: values })
    } else {
      await createProduct.mutateAsync(values)
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
  }
}
