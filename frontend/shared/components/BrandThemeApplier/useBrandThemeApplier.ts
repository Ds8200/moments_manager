'use client'
import { useEffect } from 'react'
import { useMyOrg } from '@/features/organizations/queries/useOrganizations'
import { DEFAULT_BRAND_COLORS } from '@/shared/utils/branding'
import type { BrandColors } from '@/features/organizations/types'

export interface BrandThemeApplierProps {
  initialColors: BrandColors
}

export interface UseBrandThemeApplierReturn {
  colors: BrandColors
}

const applyBrandColors = (colors: BrandColors): void => {
  const root = document.documentElement.style
  root.setProperty('--color-primary', colors.primary)
  root.setProperty('--color-secondary', colors.secondary)
  root.setProperty('--color-accent', colors.accent)
  root.setProperty('--color-bg', colors.background)
  root.setProperty('--color-text', colors.text)
}

export const useBrandThemeApplier = ({ initialColors }: BrandThemeApplierProps): UseBrandThemeApplierReturn => {
  const { data: org } = useMyOrg()
  const colors = org?.brand_colors ?? initialColors ?? DEFAULT_BRAND_COLORS

  useEffect(() => {
    applyBrandColors(colors)
  }, [colors])

  return { colors }
}
