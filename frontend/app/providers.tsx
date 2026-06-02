'use client'

import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog/ConfirmDialog'

export const Providers = ({ children }: { children: React.ReactNode }): ReactElement => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        {children}
        <ConfirmDialog />
      </Provider>
    </QueryClientProvider>
  )
}
