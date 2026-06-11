export const ORG_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type OrgRoleValue = (typeof ORG_ROLE)[keyof typeof ORG_ROLE]
