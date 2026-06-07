import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from src.config import settings

ALGORITHM = "HS256"
MAGIC_LOGIN_PURPOSE = "magic_login"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(
    user_id: str,
    *,
    org_id: str | None,
    org_role: str | None,
    sys_admin: bool = False,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict = {"sub": user_id, "sys_admin": sys_admin, "exp": expire}
    if org_id:
        payload["org_id"] = org_id
    if org_role:
        payload["org_role"] = org_role
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_magic_login_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.MAGIC_LOGIN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": user_id, "purpose": MAGIC_LOGIN_PURPOSE, "exp": expire},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
