'use client'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { registrationApi } from '../../api'
import { ROUTES } from '@/shared/constants/routes'
import { REGISTRATION_LABELS } from '../../constants/registrationLabels'
import type { RegistrationFormValues } from '../../types'

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'

const schema = z.object({
  business_name: z.string().min(1, REGISTRATION_LABELS.BUSINESS_NAME_REQUIRED),
  slug: z
    .string()
    .min(1, REGISTRATION_LABELS.SLUG_REQUIRED)
    .regex(SLUG_PATTERN, REGISTRATION_LABELS.SLUG_INVALID),
  owner_email: z
    .string()
    .min(1, REGISTRATION_LABELS.EMAIL_REQUIRED)
    .email(REGISTRATION_LABELS.EMAIL_INVALID),
  password: z.string().min(8, REGISTRATION_LABELS.PASSWORD_TOO_SHORT),
})

const DEFAULT_VALUES: RegistrationFormValues = {
  business_name: '',
  slug: '',
  owner_email: '',
  password: '',
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export interface UseRegistrationFormReturn {
  register: ReturnType<typeof useForm<RegistrationFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<RegistrationFormValues>>['handleSubmit']
  onSubmit: (values: RegistrationFormValues) => Promise<void>
  errors: ReturnType<typeof useForm<RegistrationFormValues>>['formState']['errors']
  submitError: string | null
  slugPreview: string
  isSubmitting: boolean
}

export const useRegistrationForm = (): UseRegistrationFormReturn => {
  const router = useRouter()
  const lastAutoSlugRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const businessName = watch('business_name')
  const slug = watch('slug')

  useEffect(() => {
    const generated = slugify(businessName)
    if (slug === lastAutoSlugRef.current && generated !== slug) {
      setValue('slug', generated, { shouldValidate: false })
    }
    lastAutoSlugRef.current = generated
  }, [businessName, slug, setValue])

  const onSubmit = async (values: RegistrationFormValues): Promise<void> => {
    try {
      const response = await registrationApi.register(values)
      const params = new URLSearchParams({ email: values.owner_email, org: response.org_slug })
      router.push(`${ROUTES.LOGIN}?${params.toString()}`)
    } catch {
      setError('root', { message: REGISTRATION_LABELS.REGISTRATION_FAILED })
    }
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    submitError: errors.root?.message ?? null,
    slugPreview: `${REGISTRATION_LABELS.SLUG_HINT_PREFIX}${slug || REGISTRATION_LABELS.SLUG_PLACEHOLDER}.${APP_DOMAIN}`,
    isSubmitting,
  }
}
