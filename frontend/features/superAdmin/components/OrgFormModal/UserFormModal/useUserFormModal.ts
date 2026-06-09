'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom, useSetAtom } from 'jotai'
import { isUserFormModalOpenAtom, pendingNewUserAtom } from '../../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../../constants/superAdminLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

const schema = z.object({
  email: z.string().email(SUPER_ADMIN_LABELS.VALIDATION_EMAIL),
  full_name: z.string().min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED),
  phone: z.string().optional(),
  password: z.string().min(8, SUPER_ADMIN_LABELS.VALIDATION_PASSWORD_MIN),
})

type FormValues = z.infer<typeof schema>

export interface UseUserFormModalReturn {
  isOpen: boolean
  onClose: () => void
  closeSymbol: string
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  isSubmitting: boolean
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
}

export const useUserFormModal = (): UseUserFormModalReturn => {
  const [isOpen, setIsOpen] = useAtom(isUserFormModalOpenAtom)
  const setPendingNewUser = useSetAtom(pendingNewUserAtom)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onClose = (): void => {
    setIsOpen(false)
    reset()
  }

  const onSubmit = handleSubmit((values) => {
    setPendingNewUser({
      email: values.email,
      full_name: values.full_name,
      phone: values.phone || undefined,
      password: values.password,
    })
    setIsOpen(false)
    reset()
  })

  return { isOpen, onClose, closeSymbol: UI_SYMBOLS.CLOSE, register, errors, isSubmitting, onSubmit }
}
