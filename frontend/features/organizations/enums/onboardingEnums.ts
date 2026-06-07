export const ONBOARDING_STEP = {
  LOGO:         0,
  INVITE:       1,
  INTEGRATIONS: 2,
  DONE:         3,
} as const

export type OnboardingStep = (typeof ONBOARDING_STEP)[keyof typeof ONBOARDING_STEP]

export const ONBOARDING_STEP_COUNT = Object.keys(ONBOARDING_STEP).length
