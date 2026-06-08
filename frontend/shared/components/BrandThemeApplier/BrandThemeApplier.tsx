'use client'
import { useBrandThemeApplier } from './useBrandThemeApplier'
import type { BrandThemeApplierProps } from './useBrandThemeApplier'

export const BrandThemeApplier = (props: BrandThemeApplierProps): null => {
  useBrandThemeApplier(props)
  return null
}
