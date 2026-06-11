import type { BrandColors, OrgBrandingResponse } from '@/features/organizations/types'

// Must stay in sync with the fallback hex values in shared/styles/_variables.scss
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary:    '#3B5BDB',
  secondary:  '#7048E8',
  accent:     '#F03E3E',
  background: '#FFFFFF',
  text:       '#212529',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function fetchBranding(slug: string): Promise<OrgBrandingResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/orgs/branding/${slug}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as OrgBrandingResponse
  } catch {
    return null
  }
}

export function resolveLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null
  // logo_path from backend uses a leading dot (e.g. ./uploads/…);
  // strip it so the path becomes a valid URL via the /uploads rewrite.
  return logoPath.startsWith('.') ? logoPath.slice(1) : logoPath
}
