"""Seed the database with an initial admin user.

Run with:  python seed.py
"""
import asyncio
from sqlalchemy.future import select

from core.database import AsyncSessionLocal, engine, Base
from core.security import get_password_hash
from models.user import User
from models.enums import UserRole

ADMIN_EMAIL = "admin@parentlead.com"
ADMIN_PASSWORD = "Admin@123"


async def seed():
    from models import lead, activity, task  # noqa: ensure models are registered
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        if result.scalars().first():
            print(f"Admin user already exists: {ADMIN_EMAIL}")
            return

        admin = User(
            email=ADMIN_EMAIL,
            name="Admin",
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        await db.commit()
        print(f"Created admin user: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
