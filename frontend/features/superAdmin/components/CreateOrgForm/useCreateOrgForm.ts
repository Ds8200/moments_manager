'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateOrg } from '../../queries/useCreateOrg'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { ORG_PLAN, type OrgPlanValue } from '../../enums/orgPlanEnums'
import { ROUTES } from '@/shared/constants/routes'

const schema = z.object({
  business_name: z.string().min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED),
  slug: z
    .string()
    .min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED)
    .regex(/^[a-z0-9-]+$/, SUPER_ADMIN_LABELS.VALIDATION_SLUG),
  owner_email: z
    .string()
    .min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED)
    .email(SUPER_ADMIN_LABELS.VALIDATION_EMAIL),
  owner_full_name: z.string().min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED),
  owner_password: z.string().min(8, SUPER_ADMIN_LABELS.VALIDATION_PASSWORD_MIN),
  plan: z.enum([ORG_PLAN.TRIAL, ORG_PLAN.BASIC, ORG_PLAN.PROFESSIONAL, ORG_PLAN.ENTERPRISE]),
})

export interface CreateOrgFormValues {
  business_name: string
  slug: string
  owner_email: string
  owner_full_name: string
  owner_password: string
  plan: OrgPlanValue
}

export interface PlanOption {
  value: OrgPlanValue
  label: string
}

const DEFAULT_VALUES: CreateOrgFormValues = {
  business_name: '',
  slug: '',
  owner_email: '',
  owner_full_name: '',
  owner_password: '',
  plan: ORG_PLAN.TRIAL,
}

const PLAN_OPTIONS: PlanOption[] = [
  { value: ORG_PLAN.TRIAL, label: SUPER_ADMIN_LABELS.PLAN_TRIAL },
  { value: ORG_PLAN.BASIC, label: SUPER_ADMIN_LABELS.PLAN_BASIC },
  { value: ORG_PLAN.PROFESSIONAL, label: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL },
  { value: ORG_PLAN.ENTERPRISE, label: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE },
]

export interface UseCreateOrgFormReturn {
  register: ReturnType<typeof useForm<CreateOrgFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<CreateOrgFormValues>>['handleSubmit']
  onSubmit: (values: CreateOrgFormValues) => void
  errors: ReturnType<typeof useForm<CreateOrgFormValues>>['formState']['errors']
  isPending: boolean
  planOptions: PlanOption[]
  onBack: () => void
  title: string
  backLabel: string
  fieldBusinessName: string
  fieldSlug: string
  fieldSlugHint: string
  fieldOwnerFullName: string
  fieldOwnerEmail: string
  fieldOwnerPassword: string
  fieldPlan: string
  submitLabel: string
}

export const useCreateOrgForm = (): UseCreateOrgFormReturn => {
  const router = useRouter()
  const { mutate, isPending } = useCreateOrg()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrgFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = (values: CreateOrgFormValues): void => {
    mutate(values, {
      onSuccess: () => router.push(ROUTES.SUPER_ADMIN_ORGS),
    })
  }

  const onBack = (): void => router.push(ROUTES.SUPER_ADMIN_ORGS)

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isPending,
    planOptions: PLAN_OPTIONS,
    onBack,
    title: SUPER_ADMIN_LABELS.CREATE_ORG_TITLE,
    backLabel: SUPER_ADMIN_LABELS.BACK_TO_ORGS,
    fieldBusinessName: SUPER_ADMIN_LABELS.FIELD_BUSINESS_NAME,
    fieldSlug: SUPER_ADMIN_LABELS.FIELD_SLUG,
    fieldSlugHint: SUPER_ADMIN_LABELS.FIELD_SLUG_HINT,
    fieldOwnerFullName: SUPER_ADMIN_LABELS.FIELD_OWNER_FULL_NAME,
    fieldOwnerEmail: SUPER_ADMIN_LABELS.FIELD_OWNER_EMAIL,
    fieldOwnerPassword: SUPER_ADMIN_LABELS.FIELD_OWNER_PASSWORD,
    fieldPlan: SUPER_ADMIN_LABELS.FIELD_PLAN,
    submitLabel: isPending ? SUPER_ADMIN_LABELS.SUBMITTING : SUPER_ADMIN_LABELS.SUBMIT_CREATE_ORG,
  }
}
