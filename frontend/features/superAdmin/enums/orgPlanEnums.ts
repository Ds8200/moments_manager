export const ORG_PLAN = {
  TRIAL: 'trial',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const

export type OrgPlanValue = (typeof ORG_PLAN)[keyof typeof ORG_PLAN]
