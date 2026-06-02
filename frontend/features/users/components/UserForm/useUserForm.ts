'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { isUserFormOpenAtom } from '../../store/usersAtoms'
import { useCreateUser } from '../../queries/useUsers'
import { USERS_LABELS, USER_ROLE_VALUES } from '../../constants/usersLabels'
import type { UserFormValues } from '../../types'

const schema = z.object({
  email: z.string().min(1, USERS_LABELS.FORM_EMAIL_REQUIRED).email(USERS_LABELS.FORM_EMAIL_INVALID),
  full_name: z.string().min(1, USERS_LABELS.FORM_NAME_REQUIRED),
  role: z.enum([USER_ROLE_VALUES.USER, USER_ROLE_VALUES.ADMIN]),
})

const DEFAULT_VALUES: UserFormValues = {
  email: '',
  full_name: '',
  role: USER_ROLE_VALUES.USER,
}

export interface UseUserFormReturn {
  isOpen: boolean
  register: ReturnType<typeof useForm<UserFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<UserFormValues>>['handleSubmit']
  onSubmit: (values: UserFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<UserFormValues>>['formState']['errors']
  isSubmitting: boolean
  onClose: () => void
}

export const useUserForm = (): UseUserFormReturn => {
  const [isOpen, setOpen] = useAtom(isUserFormOpenAtom)
  const createUser = useCreateUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (isOpen) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, reset])

  const onClose = (): void => {
    setOpen(false)
  }

  const onSubmit = async (values: UserFormValues): Promise<void> => {
    try {
      await createUser.mutateAsync(values)
      onClose()
    } catch {
      // The failure is surfaced as a global error toast by the QueryClient error
      // handler; swallow it here so the form simply stays open for a retry.
    }
  }

  return {
    isOpen,
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    onClose,
  }
}
