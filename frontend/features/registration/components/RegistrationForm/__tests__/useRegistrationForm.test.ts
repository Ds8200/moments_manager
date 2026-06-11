import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { ROUTES } from '@/shared/constants/routes'
import { useRegistrationForm, type UseRegistrationFormReturn } from '../useRegistrationForm'
import { REGISTRATION_LABELS } from '../../../constants/registrationLabels'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

type FieldName = 'business_name' | 'slug' | 'owner_email' | 'password'

const changeField = async (
  result: { current: UseRegistrationFormReturn },
  name: FieldName,
  value: string,
): Promise<void> => {
  await act(async () => {
    await result.current.register(name).onChange({ target: { name, value } })
  })
}

describe('useRegistrationForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('auto-generates a slug preview from the business name', async () => {
    const { result } = renderHook(() => useRegistrationForm())

    await changeField(result, 'business_name', 'Cohen Print Shop')

    await waitFor(() => {
      expect(result.current.slugPreview).toContain('cohen-print-shop')
    })
  })

  it('stops auto-generating the slug once the user edits it manually', async () => {
    const { result } = renderHook(() => useRegistrationForm())

    await changeField(result, 'business_name', 'Cohen Print')
    await waitFor(() => expect(result.current.slugPreview).toContain('cohen-print'))

    await changeField(result, 'slug', 'my-custom-slug')
    await changeField(result, 'business_name', 'Cohen Print Shop')

    await waitFor(() => {
      expect(result.current.slugPreview).toContain('my-custom-slug')
    })
    expect(result.current.slugPreview).not.toContain('cohen-print-shop')
  })

  it('registers the org and redirects to login on success', async () => {
    server.use(
      http.post(API_ENDPOINTS.REGISTER, () =>
        HttpResponse.json({
          org_id: 'org-1',
          org_slug: 'cohen-print',
          user_id: 'user-1',
          message: 'created',
        }),
      ),
    )

    const { result } = renderHook(() => useRegistrationForm())

    await act(async () => {
      await result.current.onSubmit({
        business_name: 'Cohen Print',
        slug: 'cohen-print',
        owner_email: 'owner@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        `${ROUTES.LOGIN}?email=owner%40example.com&org=cohen-print`,
      )
    })
  })

  it('sets submitError to REGISTRATION_FAILED when registration fails', async () => {
    server.use(
      http.post(API_ENDPOINTS.REGISTER, () =>
        HttpResponse.json({ detail: 'slug already taken', code: 'CONFLICT' }, { status: 409 }),
      ),
    )

    const { result } = renderHook(() => useRegistrationForm())

    await act(async () => {
      await result.current.onSubmit({
        business_name: 'Cohen Print',
        slug: 'cohen-print',
        owner_email: 'owner@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(result.current.submitError).toBe(REGISTRATION_LABELS.REGISTRATION_FAILED)
    })
    expect(pushMock).not.toHaveBeenCalled()
  })
})
