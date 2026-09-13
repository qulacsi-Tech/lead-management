"""Guess papers and study material, with anonymous-to-the-institute downloads

The third ad type a Page can publish, alongside its admission notices and job
vacancies. Unlike those two it is download-only and must never generate a lead
for the institute — see models/study_paper.py for why that made it a separate
entity rather than a third Opportunity.type.

`study_papers`, not `papers`: an orphaned `papers` table from the deleted
mentor-question-bank feature still holds rows in the development database and
is on alembic/env.py's LEGACY_UNMANAGED_TABLES list. This does not touch it.

Purely additive.

Revision ID: 0006
Revises: 0005
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_papers",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False, server_default="Guess Paper"),
        sa.Column("description", sa.String()),
        sa.Column("subject", sa.String()),
        sa.Column("class_level", sa.String()),
        sa.Column("exam", sa.String()),
        sa.Column("session", sa.String()),
        sa.Column("tags", sa.JSON()),
        sa.Column("file_url", sa.String()),
        sa.Column("file_name", sa.String()),
        sa.Column("file_size", sa.Integer()),
        sa.Column("status", sa.String(), nullable=False, server_default="Draft"),
        # server_default so the counter is never NULL on a row inserted by
        # anything that predates the model default.
        sa.Column("downloads_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ranking", sa.Integer(), server_default="100"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_study_papers_page_id", "study_papers", ["page_id"])
    op.create_index("ix_study_papers_kind", "study_papers", ["kind"])
    op.create_index("ix_study_papers_status", "study_papers", ["status"])
    op.create_index("ix_study_papers_page_status", "study_papers", ["page_id", "status"])

    op.create_table(
        "study_paper_downloads",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("paper_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["paper_id"], ["study_papers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        # One row per account per paper, so `downloads_count` counts people
        # rather than clicks and a reader re-fetching their own copy cannot
        # inflate the institute's number.
        sa.UniqueConstraint("paper_id", "user_id", name="uq_study_paper_download"),
    )
    op.create_index("ix_study_paper_downloads_paper_id", "study_paper_downloads", ["paper_id"])
    op.create_index("ix_study_paper_downloads_user_id", "study_paper_downloads", ["user_id"])


def downgrade() -> None:
    op.drop_table("study_paper_downloads")
    op.drop_table("study_papers")
