"""
Create a new user in the database.

Usage (inside Docker container):
    uv run python scripts/create_user.py

Usage (exec from host):
    docker compose exec -e PYTHONPATH=/app backend uv run python scripts/create_user.py
"""

import asyncio
import sys

from src.core.security import hash_password
from src.database import AsyncSessionLocal
from src.users.models import User

EMAIL = "admin@example.com"
PASSWORD = "changeme123"
FULL_NAME = "Admin"


async def main() -> None:
    async with AsyncSessionLocal() as db:
        user = User(
            email=EMAIL,
            hashed_password=hash_password(PASSWORD),
            full_name=FULL_NAME,
        )
        db.add(user)
        try:
            await db.commit()
            print(f"User created: {user.email}")
        except Exception as e:
            await db.rollback()
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)


asyncio.run(main())
