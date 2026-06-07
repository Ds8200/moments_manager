import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useOrgSettings } from '../useOrgSettings'
import { ORG_SETTINGS_LABELS } from '../../../constants/orgSettingsLabels'

describe('useOrgSettings', () => {
  it('exposes the page title label', () => {
    const { result } = renderHook(() => useOrgSettings())

    expect(result.current.pageTitle).toBe(ORG_SETTINGS_LABELS.PAGE_TITLE)
  })
})
