'use client'

import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { homeApi } from '../api'
import type { HomeKpi } from '../types'

export const useHomeKpi = (): UseQueryResult<HomeKpi> => {
  return useQuery<HomeKpi>({
    queryKey: ['home', 'kpi'],
    queryFn: homeApi.getKpi,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  })
}
