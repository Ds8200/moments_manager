'use client'
import { atom } from 'jotai'
import { ONBOARDING_STEP, type OnboardingStep } from '../enums/onboardingEnums'

export const onboardingStepAtom = atom<OnboardingStep>(ONBOARDING_STEP.LOGO)
