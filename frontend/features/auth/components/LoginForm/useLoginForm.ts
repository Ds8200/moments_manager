'use client'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSetAtom } from 'jotai'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../../api'
import { setTokensAtom } from '../../store/authAtoms'
import { ROUTES } from '@/shared/constants/routes'
import { AUTH_LABELS } from '../../constants/authLabels'
import type { LoginFormValues } from '../../types'

const schema = z.object({
  email: z.string().min(1, AUTH_LABELS.EMAIL_REQUIRED).email(AUTH_LABELS.EMAIL_INVALID),
  password: z.string().min(1, AUTH_LABELS.PASSWORD_REQUIRED),
})

export interface UseLoginFormReturn {
  register: ReturnType<typeof useForm<LoginFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<LoginFormValues>>['handleSubmit']
  onSubmit: (values: LoginFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<LoginFormValues>>['formState']['errors']
  submitError: string | null
  isSubmitting: boolean
  isMagicLoggingIn: boolean
}

export const useLoginForm = (): UseLoginFormReturn => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const magicToken = searchParams.get('token')
  const prefillEmail = searchParams.get('email') ?? ''
  const setTokens = useSetAtom(setTokensAtom)

  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState<boolean>(magicToken !== null)
  const hasAttemptedMagic = useRef<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail, password: '' },
  })

  useEffect(() => {
    if (!magicToken || hasAttemptedMagic.current) return
    hasAttemptedMagic.current = true

    const runMagicLogin = async (): Promise<void> => {
      try {
        const tokens = await authApi.magicLogin(magicToken)
        setTokens({ access: tokens.access_token, refresh: tokens.refresh_token })
        router.push(ROUTES.DASHBOARD)
      } catch {
        setError('root', { message: AUTH_LABELS.MAGIC_LOGIN_FAILED })
        setIsMagicLoggingIn(false)
      }
    }

    void runMagicLogin()
  }, [magicToken, setTokens, router, setError])

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      const tokens = await authApi.login(values.email, values.password)
      setTokens({ access: tokens.access_token, refresh: tokens.refresh_token })
      router.push(ROUTES.DASHBOARD)
    } catch {
      setError('root', { message: AUTH_LABELS.LOGIN_FAILED })
    }
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    submitError: errors.root?.message ?? null,
    isSubmitting,
    isMagicLoggingIn,
  }
}
