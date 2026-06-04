'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '@/shared/utils/apiClient'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

const addSchema = z.object({ name: z.string().min(1) })
type AddFormValues = z.infer<typeof addSchema>

export interface CategoryManagerItem {
  id: string
  name: string
}

export interface CategoryManagerLabels {
  title: string
  addPlaceholder: string
  addBtn: string
  empty: string
  deleteTitle: string
}

export interface UseCategoryManagerModalOptions {
  categories: CategoryManagerItem[]
  isLoading: boolean
  onCreate: (name: string) => Promise<unknown>
  onDelete: (id: string) => Promise<void>
  isCreating: boolean
  inUseErrorCode: string
  inUseErrorMessage: string
  onClose: () => void
  labels: CategoryManagerLabels
}

export interface UseCategoryManagerModalReturn {
  categories: CategoryManagerItem[]
  isLoading: boolean
  addRegister: ReturnType<typeof useForm<AddFormValues>>['register']
  addHandleSubmit: ReturnType<typeof useForm<AddFormValues>>['handleSubmit']
  onAdd: (values: AddFormValues) => Promise<void>
  isAdding: boolean
  onDelete: (id: string) => Promise<void>
  deleteErrors: Record<string, string>
  onClose: () => void
  closeSymbol: string
  labels: CategoryManagerLabels
}

export const useCategoryManagerModal = (
  options: UseCategoryManagerModalOptions,
): UseCategoryManagerModalReturn => {
  const {
    categories, isLoading, onCreate, onDelete: deleteFn,
    isCreating, inUseErrorCode, inUseErrorMessage, onClose, labels,
  } = options
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})

  const {
    register: addRegister,
    handleSubmit: addHandleSubmit,
    reset: resetAdd,
  } = useForm<AddFormValues>({ resolver: zodResolver(addSchema) })

  const onAdd = async (values: AddFormValues): Promise<void> => {
    await onCreate(values.name)
    resetAdd()
  }

  const onDelete = async (id: string): Promise<void> => {
    setDeleteErrors((prev) => ({ ...prev, [id]: '' }))
    try {
      await deleteFn(id)
    } catch (err) {
      if (err instanceof ApiError && err.code === inUseErrorCode) {
        setDeleteErrors((prev) => ({ ...prev, [id]: inUseErrorMessage }))
      }
    }
  }

  return {
    categories,
    isLoading,
    addRegister,
    addHandleSubmit,
    onAdd,
    isAdding: isCreating,
    onDelete,
    deleteErrors,
    onClose,
    closeSymbol: UI_SYMBOLS.CLOSE,
    labels,
  }
}
