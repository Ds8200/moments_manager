import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import type { createStore } from 'jotai'
import { addToastAtom } from '@/shared/store/globalAtoms'
import { NOTIFICATION_TYPE } from '@/shared/enums/notificationEnums'
import { resolveErrorMessage } from './resolveErrorMessage'

type JotaiStore = ReturnType<typeof createStore>

// Set `meta: { skipGlobalError: true }` on a query/mutation to opt out of the
// automatic error toast (e.g. when the caller renders the error inline itself).
const shouldSkip = (meta: Record<string, unknown> | undefined): boolean =>
  meta?.skipGlobalError === true

// Builds a QueryClient that surfaces every failed query/mutation as an error toast,
// so error feedback is uniform across the app without per-call wiring.
export const createAppQueryClient = (store: JotaiStore): QueryClient => {
  const notifyError = (error: unknown): void => {
    store.set(addToastAtom, {
      type: NOTIFICATION_TYPE.ERROR,
      message: resolveErrorMessage(error),
    })
  }

  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1 },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (!shouldSkip(query.meta)) notifyError(error)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (!shouldSkip(mutation.meta)) notifyError(error)
      },
    }),
  })
}
