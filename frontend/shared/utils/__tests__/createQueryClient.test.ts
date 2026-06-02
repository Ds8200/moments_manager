import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai'
import { createAppQueryClient } from '../createQueryClient'
import { ApiError } from '../apiClient'
import { toastsAtom } from '@/shared/store/globalAtoms'
import { NOTIFICATION_TYPE } from '@/shared/enums/notificationEnums'
import { ERROR_CODE_MESSAGES } from '@/shared/constants/errorMessages'
import { ERROR_CODES } from '@/shared/constants/errorCodes'

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0))

describe('createAppQueryClient global error handler', () => {
  it('adds an error toast when a mutation fails', async () => {
    const store = createStore()
    const qc = createAppQueryClient(store)

    await qc
      .getMutationCache()
      .build(qc, {
        mutationFn: () =>
          Promise.reject(new ApiError(409, 'exists', ERROR_CODES.USER_EMAIL_EXISTS)),
      })
      .execute(undefined)
      .catch(() => {})
    await flush()

    const toasts = store.get(toastsAtom)
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe(NOTIFICATION_TYPE.ERROR)
    expect(toasts[0].message).toBe(ERROR_CODE_MESSAGES[ERROR_CODES.USER_EMAIL_EXISTS])
  })

  it('does not add a toast when meta.skipGlobalError is set', async () => {
    const store = createStore()
    const qc = createAppQueryClient(store)

    await qc
      .getMutationCache()
      .build(qc, {
        mutationFn: () => Promise.reject(new ApiError(500, 'boom')),
        meta: { skipGlobalError: true },
      })
      .execute(undefined)
      .catch(() => {})
    await flush()

    expect(store.get(toastsAtom)).toHaveLength(0)
  })
})
