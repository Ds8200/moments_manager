'use client'
import { useAtom } from 'jotai'
import { onboardingStepAtom } from '../../store/organizationsAtoms'
import { ONBOARDING_STEP, type OnboardingStep } from '../../enums/onboardingEnums'
import { ONBOARDING_STEP_LABELS } from '../../constants/onboardingLabels'

export interface UseOrgOnboardingReturn {
  currentStep: OnboardingStep
  stepLabels: readonly string[]
  goToNextStep: () => void
  goToPreviousStep: () => void
}

export const useOrgOnboarding = (): UseOrgOnboardingReturn => {
  const [currentStep, setCurrentStep] = useAtom(onboardingStepAtom)

  const goToNextStep = (): void => {
    setCurrentStep((step) => (step < ONBOARDING_STEP.DONE ? ((step + 1) as OnboardingStep) : step))
  }

  const goToPreviousStep = (): void => {
    setCurrentStep((step) => (step > ONBOARDING_STEP.LOGO ? ((step - 1) as OnboardingStep) : step))
  }

  return {
    currentStep,
    stepLabels: ONBOARDING_STEP_LABELS,
    goToNextStep,
    goToPreviousStep,
  }
}
