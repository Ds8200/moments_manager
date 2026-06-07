from enum import Enum


class OrgRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class OrgPlan(str, Enum):
    trial = "trial"
    basic = "basic"
    professional = "professional"
    enterprise = "enterprise"
