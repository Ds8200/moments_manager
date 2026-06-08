import type { Metadata } from 'next'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm'
import { META_LABELS, UI_LABELS } from '@/shared/constants/uiLabels'
import { fetchBranding, resolveLogoUrl } from '@/shared/utils/branding'

export const metadata: Metadata = { title: META_LABELS.LOGIN_TITLE }

export default async function LoginPage() {
  const headersList = await headers()
  const slug = headersList.get('x-org-slug')
  const branding = slug ? await fetchBranding(slug) : null

  const logoSrc = resolveLogoUrl(branding?.logo_path ?? null) ?? UI_LABELS.GENERIC_LOGO_SRC
  const logoAlt = branding?.name ?? UI_LABELS.APP_NAME

  return (
    <Suspense>
      <LoginForm logoSrc={logoSrc} logoAlt={logoAlt} />
    </Suspense>
  )
}
