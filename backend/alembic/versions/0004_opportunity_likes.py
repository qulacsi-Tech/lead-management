"""Likes on admission notices and job vacancies

The feed showed like counts that were fixtures in the browser — a number that
changed on click and forgot immediately. This is the table behind a real one.

Scoped to opportunities, which already exist, rather than to posts, which do
not: there is still no Post entity (see
docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md step 4).

Purely additive.

Revision ID: 0004
Revises: 0003
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "opportunity_likes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("opportunity_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        # One row per user per opportunity — makes a double-tap idempotent in
        # the database rather than trusting the client to keep count.
        sa.UniqueConstraint("user_id", "opportunity_id", name="uq_like_user_opportunity"),
    )
    op.create_index("ix_opportunity_likes_user_id", "opportunity_likes", ["user_id"])
    op.create_index("ix_opportunity_likes_opportunity_id", "opportunity_likes", ["opportunity_id"])
    op.create_index(
        "ix_opportunity_likes_opp_user", "opportunity_likes", ["opportunity_id", "user_id"]
    )


def downgrade() -> None:
    op.drop_table("opportunity_likes")
