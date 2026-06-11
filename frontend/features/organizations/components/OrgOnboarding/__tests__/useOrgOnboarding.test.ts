import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useOrgOnboarding } from '../useOrgOnboarding'
import { onboardingStepAtom } from '../../../store/organizationsAtoms'
import { ONBOARDING_STEP } from '../../../enums/onboardingEnums'
import { ONBOARDING_STEP_LABELS } from '../../../constants/onboardingLabels'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useOrgOnboarding', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('starts at the logo step and exposes the step labels', () => {
    const { result } = renderHook(() => useOrgOnboarding(), { wrapper: makeWrapper(store) })
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.LOGO)
    expect(result.current.stepLabels).toEqual(ONBOARDING_STEP_LABELS)
  })

  it('advances to the next step', () => {
    const { result } = renderHook(() => useOrgOnboarding(), { wrapper: makeWrapper(store) })

    act(() => result.current.goToNextStep())
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.INVITE)

    act(() => result.current.goToNextStep())
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.INTEGRATIONS)

    act(() => result.current.goToNextStep())
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.DONE)
  })

  it('does not advance past the done step', () => {
    store.set(onboardingStepAtom, ONBOARDING_STEP.DONE)
    const { result } = renderHook(() => useOrgOnboarding(), { wrapper: makeWrapper(store) })

    act(() => result.current.goToNextStep())
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.DONE)
  })

  it('moves back to the previous step', () => {
    store.set(onboardingStepAtom, ONBOARDING_STEP.DONE)
    const { result } = renderHook(() => useOrgOnboarding(), { wrapper: makeWrapper(store) })

    act(() => result.current.goToPreviousStep())
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.INTEGRATIONS)
  })

  it('does not move before the logo step', () => {
    const { result } = renderHook(() => useOrgOnboarding(), { wrapper: makeWrapper(store) })

    act(() => result.current.goToPreviousStep())
    expect(result.current.currentStep).toBe(ONBOARDING_STEP.LOGO)
  })
})
