'use client'
import type { ReactElement } from 'react'
import { useUserDetailPage } from './useUserDetailPage'
import type { UserDetailPageProps } from './useUserDetailPage'
import { DetailLayout } from '@/shared/components/DetailLayout/DetailLayout'

export const UserDetailPage = (props: UserDetailPageProps): ReactElement => {
  const hookReturn = useUserDetailPage(props)
  return <DetailLayout {...hookReturn} />
}
