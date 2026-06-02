"""
Create a new user in the database.

Usage (from backend/ directory):
    uv run python scripts/create_user.py <email> <password> <full_name> [--role admin|user]

Usage (exec from host via Docker):
    docker compose exec -e PYTHONPATH=/app backend uv run python scripts/create_user.py <email> <password> <full_name> [--role admin]
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.core.security import hash_password
from src.database import AsyncSessionLocal
from src.users.enums import UserRole
from src.users.models import User


async def main(email: str, password: str, full_name: str, role: str) -> None:
    async with AsyncSessionLocal() as db:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
        )
        db.add(user)
        try:
            await db.commit()
            print(f"User created: {user.email} (role={user.role})")
        except Exception as e:
            await db.rollback()
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new user in the database.")
    parser.add_argument("email")
    parser.add_argument("password")
    parser.add_argument("full_name")
    parser.add_argument(
        "--role",
        choices=[UserRole.admin.value, UserRole.user.value],
        default=UserRole.user.value,
    )
    args = parser.parse_args()
    asyncio.run(main(args.email, args.password, args.full_name, args.role))
