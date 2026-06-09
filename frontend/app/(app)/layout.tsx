import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Providers } from '../providers'
import { Sidebar } from '@/shared/components/Layout/Sidebar/Sidebar'
import { Header } from '@/shared/components/Layout/Header/Header'
import { MobileDrawer } from '@/shared/components/Layout/MobileDrawer/MobileDrawer'
import { AuthGuard } from '@/shared/components/AuthGuard/AuthGuard'
import { BrandThemeApplier } from '@/shared/components/BrandThemeApplier/BrandThemeApplier'
import { AppContentWrapper } from './AppContentWrapper'
import styles from './AppLayout.module.scss'
import { DEFAULT_BRAND_COLORS, fetchBranding, resolveLogoUrl } from '@/shared/utils/branding'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const slug = headersList.get('x-org-slug')
  const branding = slug ? await fetchBranding(slug) : null
  const logoUrl = resolveLogoUrl(branding?.logo_path ?? null)
  return logoUrl ? { icons: { icon: logoUrl } } : {}
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const slug = headersList.get('x-org-slug')
  const branding = slug ? await fetchBranding(slug) : null

  const colors = branding?.brand_colors ?? DEFAULT_BRAND_COLORS
  const logoUrl = resolveLogoUrl(branding?.logo_path ?? null)
  const logoAlt = branding?.name

  return (
    <Providers>
      <AuthGuard>
        <BrandThemeApplier initialColors={colors} />
        <div className={styles.root}>
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
