from enum import Enum


class UserRole(str, Enum):
    system_admin = "system_admin"
    user = "user"
