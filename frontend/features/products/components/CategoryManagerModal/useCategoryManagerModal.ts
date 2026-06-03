'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProductCategories, useCreateProductCategory, useDeleteProductCategory } from '@/features/productCategories'
import { ApiError } from '@/shared/utils/apiClient'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import type { ProductCategory } from '../../types'

const addSchema = z.object({ name: z.string().min(1) })
type AddFormValues = z.infer<typeof addSchema>

export interface CategoryManagerModalProps {
  onClose: () => void
}

export interface UseCategoryManagerModalReturn {
  categories: ProductCategory[]
  isLoading: boolean
  addRegister: ReturnType<typeof useForm<AddFormValues>>['register']
  addHandleSubmit: ReturnType<typeof useForm<AddFormValues>>['handleSubmit']
  onAdd: (values: AddFormValues) => Promise<void>
  isAdding: boolean
  onDelete: (id: string) => Promise<void>
  deleteErrors: Record<string, string>
  onClose: () => void
}

export const useCategoryManagerModal = (
  props: CategoryManagerModalProps,
): UseCategoryManagerModalReturn => {
  const { onClose } = props
  const { data: categories = [], isLoading } = useProductCategories()
  const createCategory = useCreateProductCategory()
  const deleteCategory = useDeleteProductCategory()
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})

  const {
    register: addRegister,
    handleSubmit: addHandleSubmit,
    reset: resetAdd,
  } = useForm<AddFormValues>({ resolver: zodResolver(addSchema) })

  const onAdd = async (values: AddFormValues): Promise<void> => {
    await createCategory.mutateAsync(values.name)
    resetAdd()
  }

  const onDelete = async (id: string): Promise<void> => {
    setDeleteErrors((prev) => ({ ...prev, [id]: '' }))
    try {
      await deleteCategory.mutateAsync(id)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CATEGORY_IN_USE') {
        setDeleteErrors((prev) => ({ ...prev, [id]: PRODUCTS_LABELS.CATEGORY_IN_USE_ERROR }))
      }
    }
  }

  return {
    categories,
    isLoading,
    addRegister,
    addHandleSubmit,
    onAdd,
    isAdding: createCategory.isPending,
    onDelete,
    deleteErrors,
    onClose,
  }
}
