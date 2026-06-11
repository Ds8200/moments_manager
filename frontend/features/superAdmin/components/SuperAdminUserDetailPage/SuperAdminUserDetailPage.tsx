'use client'
import type { ReactElement } from 'react'
import { useSuperAdminUserDetailPage } from './useSuperAdminUserDetailPage'
import type { SuperAdminUserDetailPageProps } from './useSuperAdminUserDetailPage'
import { DetailLayout } from '@/shared/components/DetailLayout/DetailLayout'

export const SuperAdminUserDetailPage = (props: SuperAdminUserDetailPageProps): ReactElement => {
  const hookReturn = useSuperAdminUserDetailPage(props)
  return <DetailLayout {...hookReturn} />
}
