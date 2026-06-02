'use client'

import type { ReactElement } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'
import { createStore } from 'jotai'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { ToastContainer } from '@/shared/components/ToastContainer/ToastContainer'
import { createAppQueryClient } from '@/shared/utils/createQueryClient'

export const Providers = ({ children }: { children: React.ReactNode }): ReactElement => {
  const [store] = useState(() => createStore())
  const [queryClient] = useState(() => createAppQueryClient(store))

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        {children}
        <ConfirmDialog />
        <ToastContainer />
      </Provider>
    </QueryClientProvider>
  )
}
