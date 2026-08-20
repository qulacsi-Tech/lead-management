"""
Alembic environment for Connectedus.

Two things here are deliberate and load-bearing:

1. The URL comes from `core.config.settings`, so migrations and the app can
   never disagree about which database they mean.

2. `include_object` skips a set of LEGACY tables that exist in the development
   database but have no ORM model — leftovers from features deleted in commit
   aa2e498 (leads, lead_activities, lead_tasks, papers, paper_questions,
   paper_attempts, job_postings, mentor_follows). Without this, every
   autogenerate would propose DROP TABLE for all of them and quietly destroy
   real data. They are left alone until someone makes an explicit decision
   about them.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from core.config import settings
from core.database import Base
import models  # noqa: F401  -- registers every model on Base.metadata

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Tables present in the database with no corresponding model. Never autogenerate
# changes for these — see module docstring.
LEGACY_UNMANAGED_TABLES = {
    "leads",
    "lead_activities",
    "lead_tasks",
    "papers",
    "paper_questions",
    "paper_attempts",
    "job_postings",
    "mentor_follows",
}

# Column-level drift: these exist on `users` in the development database but
# were removed from the model in an earlier Professional Profile revision. They
# are nullable and harmless. Excluding them means autogenerate will not propose
# dropping columns that may still hold data, while a fresh database simply
# never creates them.
LEGACY_UNMANAGED_COLUMNS = {
    ("users", "qualification"),
    ("users", "experience"),
    ("users", "current_institute"),
    ("users", "previous_institutes"),
}


def include_object(object_, name, type_, reflected, compare_to):
    if type_ == "table" and name in LEGACY_UNMANAGED_TABLES:
        return False
    if type_ == "column" and reflected:
        table_name = getattr(object_.table, "name", None)
        if (table_name, name) in LEGACY_UNMANAGED_COLUMNS:
            return False
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
