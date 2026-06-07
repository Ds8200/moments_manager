import { headers } from 'next/headers'
import type { CSSProperties } from 'react'
import { Providers } from '../providers'
import { Sidebar } from '@/shared/components/Layout/Sidebar/Sidebar'
import { Header } from '@/shared/components/Layout/Header/Header'
import { MobileDrawer } from '@/shared/components/Layout/MobileDrawer/MobileDrawer'
import { AuthGuard } from '@/shared/components/AuthGuard/AuthGuard'
import { AppContentWrapper } from './AppContentWrapper'
import styles from './AppLayout.module.scss'
import type { OrgBrandingResponse } from '@/features/organizations/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchBranding(slug: string): Promise<OrgBrandingResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/orgs/branding/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as OrgBrandingResponse
  } catch {
    return null
  }
}

function resolveLogoUrl(logoPath: string | null): string | null {
  if (!logoPath) return null
  // logo_path is the backend storage path (e.g. "./uploads/logos/{org}/{file}");
  // stripping the leading "." turns it into the URL path proxied by the /uploads rewrite.
  return logoPath.startsWith('.') ? logoPath.slice(1) : logoPath
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const slug = headersList.get('x-org-slug')
  const branding = slug ? await fetchBranding(slug) : null

  const cssVars: CSSProperties = branding?.brand_colors
    ? ({
        '--color-primary': branding.brand_colors.primary,
        '--color-secondary': branding.brand_colors.secondary,
        '--color-accent': branding.brand_colors.accent,
        '--color-bg': branding.brand_colors.background,
        '--color-text': branding.brand_colors.text,
      } as CSSProperties)
    : {}

  const logoUrl = resolveLogoUrl(branding?.logo_path ?? null)
  const logoAlt = branding?.name

  return (
    <Providers>
      <AuthGuard>
        <div className={styles.root} style={cssVars}>
          <Sidebar logoUrl={logoUrl} logoAlt={logoAlt} />
          <MobileDrawer logoUrl={logoUrl} logoAlt={logoAlt} />
          <AppContentWrapper>
            <Header />
            <main className={styles.main}>{children}</main>
          </AppContentWrapper>
        </div>
      </AuthGuard>
    </Providers>
  )
}
