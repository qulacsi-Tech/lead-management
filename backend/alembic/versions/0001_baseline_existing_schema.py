"""Baseline: the pre-Phase-2 schema as it already exists

This migration reproduces the schema that the old `create_all` + 24 ad-hoc
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements in main.py used to
produce. It exists so a FRESH database can be built from zero.

An EXISTING database must NOT run this — it already has these tables. Stamp it
instead:

    py -m alembic stamp 0001
    py -m alembic upgrade head

`backend/migrate.py` does that detection automatically.

Legacy tables with no model (leads, papers, job_postings, mentor_follows, ...)
are intentionally absent: they are not recreated on a fresh database, and are
left untouched where they already exist.

Revision ID: 0001
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone", sa.String()),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.String()),
        sa.Column("is_active", sa.Boolean()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.Column("headline", sa.String()),
        sa.Column("about", sa.String()),
        sa.Column("category", sa.String()),
        sa.Column("education", sa.JSON()),
        sa.Column("work_experience", sa.JSON()),
        sa.Column("subjects", sa.JSON()),
        sa.Column("skills", sa.JSON()),
        sa.Column("profile_photo_url", sa.String()),
        sa.Column("cover_photo_url", sa.String()),
        sa.Column("resume_url", sa.String()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "revoked_tokens",
        sa.Column("jti", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("jti"),
    )

    op.create_table(
        "students",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("target_course", sa.String()),
        sa.Column("current_school", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "mentors",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String()),
        sa.Column("domain", sa.String()),
        sa.Column("company", sa.String()),
        sa.Column("experience_level", sa.String()),
        sa.Column("title", sa.String()),
        sa.Column("location", sa.String()),
        sa.Column("about", sa.String()),
        sa.Column("status", sa.String()),
        sa.Column("subjects", sa.JSON()),
        sa.Column("classes_taught", sa.JSON()),
        sa.Column("highlights", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "institutes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String()),
        sa.Column("state", sa.String()),
        sa.Column("district", sa.String()),
        sa.Column("block", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("programs", sa.String()),
        sa.Column("website", sa.String()),
        sa.Column("about", sa.String()),
        sa.Column("credits", sa.Integer(), server_default="1240"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "enquiries",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("enquiry_type", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("course", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_enquiries_student_id", "enquiries", ["student_id"])

    op.create_table(
        "enquiry_unlocks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("institute_id", sa.String(), nullable=False),
        sa.Column("enquiry_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["institute_id"], ["institutes.id"]),
        sa.ForeignKeyConstraint(["enquiry_id"], ["enquiries.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("institute_id", "enquiry_id", name="uq_institute_enquiry_unlock"),
    )
    op.create_index("ix_enquiry_unlocks_institute_id", "enquiry_unlocks", ["institute_id"])
    op.create_index("ix_enquiry_unlocks_enquiry_id", "enquiry_unlocks", ["enquiry_id"])


def downgrade() -> None:
    op.drop_table("enquiry_unlocks")
    op.drop_table("enquiries")
    op.drop_table("institutes")
    op.drop_table("mentors")
    op.drop_table("students")
    op.drop_table("revoked_tokens")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
