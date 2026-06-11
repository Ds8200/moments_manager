'use client'
import { useLayoutEffect } from 'react'
import { useMyOrg } from '@/features/organizations/queries/useOrganizations'
import { DEFAULT_BRAND_COLORS } from '@/shared/utils/branding'
import type { BrandColors } from '@/features/organizations/types'

export interface BrandThemeApplierProps {
  initialColors: BrandColors
}

export interface UseBrandThemeApplierReturn {
  colors: BrandColors
}

const derivePrimaryLight = (hex: string): string => {
  if (!hex.startsWith('#') || hex.length !== 7) return '#EEEDFF'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number): number => Math.round(c + (255 - c) * 0.92)
  const h = (n: number): string => n.toString(16).padStart(2, '0')
  return `#${h(mix(r))}${h(mix(g))}${h(mix(b))}`
}

const applyBrandColors = (colors: BrandColors): void => {
  const root = document.documentElement.style
  root.setProperty('--color-primary', colors.primary)
  root.setProperty('--color-secondary', colors.secondary)
  root.setProperty('--color-accent', colors.accent)
  root.setProperty('--color-bg', colors.background)
  root.setProperty('--color-text', colors.text)
  root.setProperty('--color-primary-light', derivePrimaryLight(colors.primary))
}

export const useBrandThemeApplier = ({ initialColors }: BrandThemeApplierProps): UseBrandThemeApplierReturn => {
  const { data: org } = useMyOrg()
  const colors = org?.brand_colors ?? initialColors ?? DEFAULT_BRAND_COLORS

  // useLayoutEffect fires synchronously before paint — no flash of default colors.
  // Primitive string deps avoid false-negative reference comparisons on object identity.
  useLayoutEffect(() => {
    applyBrandColors(colors)
  }, [colors.primary, colors.secondary, colors.accent, colors.background, colors.text]) // eslint-disable-line react-hooks/exhaustive-deps

  return { colors }
}
