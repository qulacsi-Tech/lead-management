"""Scope page slug uniqueness to (type, slug, city)

Institute pages moved from `/{slug}` to `/{type}/{name}/{city}` — the URL shape
the client asked for on 01 Sep 2026 (docs/CLIENT_FEEDBACK_2026-09-01.md §9).

Because the city is now part of the URL, two institutes with the same name in
different cities no longer collide, and neither has to carry a `-2` suffix. The
old global UNIQUE on `pages.slug` would still reject the second one, so it is
replaced by a composite constraint over the three columns the URL is built
from.

This RELAXES a constraint: every row that satisfied the old rule satisfies the
new one, so there is nothing to clean up first and no data is touched. The
plain index on `slug` is kept — the old-URL redirect still looks pages up by
slug alone.

Revision ID: 0005
Revises: 0004
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slug_unique_constraints(bind) -> list[str]:
    """Names of the UNIQUE constraints/indexes covering `slug` alone.

    SQLAlchemy's `unique=True` on a Column becomes a UNIQUE *index* on
    PostgreSQL when the table was created by `create_all`, but a named UNIQUE
    *constraint* when created by a migration. This database has been through
    both (see 0001's baseline), so the name cannot be assumed — it is looked up.
    """
    inspector = sa.inspect(bind)
    names = []
    for constraint in inspector.get_unique_constraints("pages"):
        if constraint["column_names"] == ["slug"]:
            names.append(("constraint", constraint["name"]))
    for index in inspector.get_indexes("pages"):
        if index.get("unique") and index["column_names"] == ["slug"]:
            names.append(("index", index["name"]))
    return names


def upgrade() -> None:
    bind = op.get_bind()

    for kind, name in _slug_unique_constraints(bind):
        if kind == "constraint":
            op.drop_constraint(name, "pages", type_="unique")
        else:
            op.drop_index(name, table_name="pages")

    # Keep slug indexed for lookups now that the unique index may be gone.
    existing = {ix["name"] for ix in sa.inspect(bind).get_indexes("pages")}
    if "ix_pages_slug" not in existing:
        op.create_index("ix_pages_slug", "pages", ["slug"])

    op.create_unique_constraint("uq_page_type_slug_city", "pages", ["type", "slug", "city"])


def downgrade() -> None:
    """Reverting can fail, by design.

    Once two institutes share a slug in different cities — the whole point of
    this change — a global UNIQUE on `slug` is no longer satisfiable. Rather
    than deleting somebody's institute to force it through, this raises and
    leaves the data intact for a human to decide.
    """
    op.drop_constraint("uq_page_type_slug_city", "pages", type_="unique")
    # Restored under its original name from 0002, so the schema matches what a
    # database at revision 0004 actually looks like.
    op.drop_index("ix_pages_slug", table_name="pages")
    op.create_index("ix_pages_slug", "pages", ["slug"], unique=True)
