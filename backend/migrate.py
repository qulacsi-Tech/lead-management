"""
Safe migration entry point.

The repository predates Alembic, so a developer's database may be in one of
three states. Running `alembic upgrade head` blindly is only correct in one of
them — this script detects which and does the right thing:

  1. Empty database            -> upgrade from zero, creating everything.
  2. Existing pre-Alembic data -> stamp 0001 (the baseline already matches what
                                  is on disk), then upgrade to head. Nothing is
                                  recreated, so no data is lost.
  3. Already under Alembic     -> plain upgrade to head.

Usage:
    cd backend
    py migrate.py            # bring the database to head
    py migrate.py --status   # report state and do nothing
"""

import asyncio
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import text

from core.database import engine

BASELINE_REVISION = "0001"
# Any of these existing means the database predates Alembic.
PRE_ALEMBIC_TABLES = ("users", "students", "mentors", "institutes")


async def inspect_database() -> dict:
    # Each call runs in its own asyncio.run() loop, and Alembic spins up yet
    # another for the migration itself. Pooled asyncpg connections are bound to
    # the loop that created them, so the engine is disposed before returning —
    # otherwise the second inspection reuses a connection whose loop is gone.
    try:
        return await _inspect()
    finally:
        await engine.dispose()


async def _inspect() -> dict:
    async with engine.connect() as conn:
        has_alembic = await conn.scalar(text("SELECT to_regclass('public.alembic_version')"))
        current = None
        if has_alembic:
            current = await conn.scalar(text("SELECT version_num FROM alembic_version LIMIT 1"))
        existing = []
        for table in PRE_ALEMBIC_TABLES:
            if await conn.scalar(text(f"SELECT to_regclass('public.{table}')")):
                existing.append(table)
        has_pages = await conn.scalar(text("SELECT to_regclass('public.pages')"))
    return {
        "under_alembic": bool(has_alembic),
        "current_revision": current,
        "pre_alembic_tables": existing,
        "has_phase2": bool(has_pages),
    }


def alembic_config() -> Config:
    return Config("alembic.ini")


def main() -> int:
    state = asyncio.run(inspect_database())

    print("Database state")
    print(f"  under alembic     : {state['under_alembic']}")
    print(f"  current revision  : {state['current_revision'] or '-'}")
    print(f"  pre-alembic tables: {', '.join(state['pre_alembic_tables']) or 'none (empty database)'}")
    print(f"  phase 2 tables    : {'present' if state['has_phase2'] else 'missing'}")

    if "--status" in sys.argv:
        return 0

    cfg = alembic_config()

    if not state["under_alembic"] and state["pre_alembic_tables"]:
        print(f"\nExisting pre-Alembic database detected — stamping {BASELINE_REVISION} "
              f"instead of recreating those tables.")
        command.stamp(cfg, BASELINE_REVISION)

    print("\nUpgrading to head...")
    command.upgrade(cfg, "head")
    print("Done.")

    after = asyncio.run(inspect_database())
    print(f"Now at revision: {after['current_revision']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
