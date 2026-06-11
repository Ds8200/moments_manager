'use client'
import { useState, useMemo, useEffect } from 'react'
import { useForm, type UseFormRegister, type Control, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { superAdminApi } from '../../api'
import { useCreateOrg, useUpdateOrg } from '../../queries/useSuperAdminOrgs'
import { useUserSearch } from '../../queries/useSuperAdminUsers'
import {
  editingOrgIdAtom,
  isOrgFormOpenAtom,
  isUserFormModalOpenAtom,
  pendingNewUserAtom,
} from '../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { ORG_PLAN } from '../../enums/orgPlanEnums'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'
import type { OrgPlanValue } from '../../enums/orgPlanEnums'

const createSchema = z
  .object({
    business_name: z.string().min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED),
    plan: z.enum([ORG_PLAN.TRIAL, ORG_PLAN.BASIC, ORG_PLAN.PROFESSIONAL, ORG_PLAN.ENTERPRISE]),
    slug: z.string().optional(),
    existing_user_id: z.string().optional(),
    owner_email: z.string().optional(),
    owner_full_name: z.string().optional(),
    owner_password: z.string().optional(),
    owner_phone: z.string().optional(),
  })
  .refine(
    (d) => !!d.existing_user_id || (!!d.owner_email && !!d.owner_full_name && !!d.owner_password),
    { message: SUPER_ADMIN_LABELS.VALIDATION_OWNER_REQUIRED, path: ['existing_user_id'] },
  )

const editSchema = z.object({
  name: z.string().min(1, SUPER_ADMIN_LABELS.VALIDATION_REQUIRED),
  slug: z.string().optional(),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

const PLAN_OPTIONS: Array<{ value: OrgPlanValue; label: string }> = [
  { value: ORG_PLAN.TRIAL, label: SUPER_ADMIN_LABELS.PLAN_TRIAL },
  { value: ORG_PLAN.BASIC, label: SUPER_ADMIN_LABELS.PLAN_BASIC },
  { value: ORG_PLAN.PROFESSIONAL, label: SUPER_ADMIN_LABELS.PLAN_PROFESSIONAL },
  { value: ORG_PLAN.ENTERPRISE, label: SUPER_ADMIN_LABELS.PLAN_ENTERPRISE },
]

export interface UseOrgFormModalReturn {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  closeSymbol: string
  planOptions: typeof PLAN_OPTIONS

  createRegister: UseFormRegister<CreateValues>
  createErrors: FieldErrors<CreateValues>
  createControl: Control<CreateValues>
  isCreateSubmitting: boolean
  onCreateSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  selectedUserId: string | undefined
  ownerOptions: AutocompleteOption[]
  ownerSearch: string
  setOwnerSearch: (q: string) => void
  ownerLoading: boolean
  onOwnerChange: (value: string | null, option: AutocompleteOption | null) => void
  openUserFormModal: () => void

  editRegister: UseFormRegister<EditValues>
  editErrors: FieldErrors<EditValues>
  isEditSubmitting: boolean
  onEditSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
}

export const useOrgFormModal = (): UseOrgFormModalReturn => {
  const [isOpen, setIsOpen] = useAtom(isOrgFormOpenAtom)
  const [editingOrgId, setEditingOrgId] = useAtom(editingOrgIdAtom)
  const setIsUserFormOpen = useSetAtom(isUserFormModalOpenAtom)
  const [pendingNewUser, setPendingNewUser] = useAtom(pendingNewUserAtom)

  const isEditMode = !!editingOrgId

  const { data: orgForEdit } = useQuery({
    queryKey: ['admin', 'org', editingOrgId],
    queryFn: () => superAdminApi.getOrg(editingOrgId!),
    enabled: isEditMode && isOpen,
  })

  const [ownerSearch, setOwnerSearch] = useState('')
  const { data: searchResults, isLoading: ownerLoading } = useUserSearch(ownerSearch)

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { plan: ORG_PLAN.TRIAL },
  })

  const editForm = useForm<EditValues>({ resolver: zodResolver(editSchema) })

  useEffect(() => {
    if (!orgForEdit) return
    editForm.setValue('name', orgForEdit.name)
    editForm.setValue('slug', orgForEdit.slug)
  }, [orgForEdit, editForm])

  useEffect(() => {
    if (!pendingNewUser) return
    createForm.setValue('owner_email', pendingNewUser.email)
    createForm.setValue('owner_full_name', pendingNewUser.full_name)
    createForm.setValue('owner_password', pendingNewUser.password)
    createForm.setValue('owner_phone', pendingNewUser.phone ?? '')
    createForm.setValue('existing_user_id', undefined)
    setPendingNewUser(null)
  }, [pendingNewUser, createForm, setPendingNewUser])

  const selectedUserId = createForm.watch('existing_user_id')

  const ownerOptions = useMemo<AutocompleteOption[]>(() => {
    const base: AutocompleteOption[] = (searchResults ?? []).map((u) => ({
      value: u.id,
      label: `${u.email} — ${u.full_name}`,
    }))
    if (ownerSearch.length > 0 && base.length === 0 && !ownerLoading) {
      base.push({ value: '__create__', label: SUPER_ADMIN_LABELS.CREATE_NEW_USER_OPTION })
    }
    return base
  }, [searchResults, ownerSearch, ownerLoading])

  const createOrg = useCreateOrg()
  const updateOrg = useUpdateOrg()

  const onClose = (): void => {
    setIsOpen(false)
    setEditingOrgId(null)
    createForm.reset()
    editForm.reset()
    setOwnerSearch('')
  }

  const onOwnerChange = (value: string | null): void => {
    if (value === '__create__') {
      setIsUserFormOpen(true)
      return
    }
    createForm.setValue('existing_user_id', value ?? undefined)
    if (!value) {
      createForm.setValue('owner_email', undefined)
      createForm.setValue('owner_full_name', undefined)
      createForm.setValue('owner_password', undefined)
    }
  }

  const onCreateSubmit = createForm.handleSubmit((values) => {
    createOrg.mutate(
      {
        business_name: values.business_name,
        plan: values.plan as OrgPlanValue,
        slug: values.slug || undefined,
        existing_user_id: values.existing_user_id || undefined,
        owner_email: values.owner_email || undefined,
        owner_full_name: values.owner_full_name || undefined,
        owner_password: values.owner_password || undefined,
        owner_phone: values.owner_phone || undefined,
      },
      { onSuccess: onClose },
    )
  })

  const onEditSubmit = editForm.handleSubmit((values) => {
    if (!editingOrgId) return
    updateOrg.mutate({ id: editingOrgId, payload: values }, { onSuccess: onClose })
  })

  return {
    isOpen,
    isEditMode,
    onClose,
    closeSymbol: UI_SYMBOLS.CLOSE,
    planOptions: PLAN_OPTIONS,

    createRegister: createForm.register,
    createErrors: createForm.formState.errors,
    createControl: createForm.control,
    isCreateSubmitting: createForm.formState.isSubmitting || createOrg.isPending,
    onCreateSubmit,
    selectedUserId,
    ownerOptions,
    ownerSearch,
    setOwnerSearch,
    ownerLoading,
    onOwnerChange,
    openUserFormModal: () => setIsUserFormOpen(true),

    editRegister: editForm.register,
    editErrors: editForm.formState.errors,
    isEditSubmitting: editForm.formState.isSubmitting || updateOrg.isPending,
    onEditSubmit,
  }
}
