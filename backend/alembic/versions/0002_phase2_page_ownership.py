"""Phase 2: Page ownership model, institute content, network and credits

Adds the entities the Phase 1 UI was designed around:

    pages            institute/page entity (PLATFORM-owned)
    page_admins      who may administer a page  <-- the ownership relationship
    courses          academic catalogue          (INSTITUTE-owned)
    opportunities    admission notices + job vacancies (Sell Leads)
    page_enquiries   enquiries addressed to one institute
    follows          user -> page
    notifications    per-user notification log
    credit_transactions  append-only credit ledger

Purely additive: no existing table is altered or dropped, so applying this to
the development database cannot lose data.

Revision ID: 0002
Revises: 0001
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------------- pages
    op.create_table(
        "pages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("tagline", sa.String()),
        sa.Column("about", sa.String()),
        sa.Column("logo_url", sa.String()),
        sa.Column("banners", sa.JSON()),
        sa.Column("gallery", sa.JSON()),
        sa.Column("social_links", sa.JSON()),
        sa.Column("content", sa.JSON()),
        sa.Column("address", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("state", sa.String()),
        sa.Column("website", sa.String()),
        sa.Column("contact", sa.String()),
        sa.Column("affiliation", sa.String()),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("followers_count", sa.String(), server_default="0"),
        sa.Column("created_by", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pages_slug", "pages", ["slug"], unique=True)
    op.create_index("ix_pages_city", "pages", ["city"])
    op.create_index("ix_pages_state", "pages", ["state"])
    op.create_index("ix_pages_created_by", "pages", ["created_by"])

    # ---------------------------------------------------------- page_admins
    op.create_table(
        "page_admins",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="ADMIN"),
        sa.Column("assigned_by", sa.String()),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("page_id", "user_id", name="uq_page_admin"),
    )
    op.create_index("ix_page_admins_page_id", "page_admins", ["page_id"])
    op.create_index("ix_page_admins_user_id", "page_admins", ["user_id"])
    op.create_index("ix_page_admins_user_page", "page_admins", ["user_id", "page_id"])

    # -------------------------------------------------------------- courses
    op.create_table(
        "courses",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String()),
        sa.Column("level", sa.String()),
        sa.Column("duration", sa.String()),
        sa.Column("fees", sa.String()),
        sa.Column("intake", sa.String()),
        sa.Column("eligibility", sa.String()),
        sa.Column("description", sa.String()),
        sa.Column("specializations", sa.JSON()),
        sa.Column("status", sa.String(), nullable=False, server_default="Draft"),
        sa.Column("admission_open", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_courses_page_id", "courses", ["page_id"])
    op.create_index("ix_courses_category", "courses", ["category"])
    op.create_index("ix_courses_status", "courses", ["status"])
    op.create_index("ix_courses_page_status", "courses", ["page_id", "status"])

    # --------------------------------------------------------- opportunities
    op.create_table(
        "opportunities",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String()),
        sa.Column("status", sa.String(), nullable=False, server_default="Draft"),
        sa.Column("course_id", sa.String()),
        sa.Column("session", sa.String()),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("eligibility", sa.String()),
        sa.Column("position", sa.String()),
        sa.Column("subject", sa.String()),
        sa.Column("department", sa.String()),
        sa.Column("employment_type", sa.String()),
        sa.Column("location", sa.String()),
        sa.Column("experience", sa.String()),
        sa.Column("qualification", sa.String()),
        sa.Column("salary", sa.String()),
        sa.Column("skills", sa.JSON()),
        sa.Column("apply_before", sa.Date()),
        sa.Column("apply_url", sa.String()),
        sa.Column("ranking", sa.Integer(), server_default="100"),
        sa.Column("reach", sa.Integer(), server_default="0"),
        sa.Column("views", sa.Integer(), server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_opportunities_page_id", "opportunities", ["page_id"])
    op.create_index("ix_opportunities_type", "opportunities", ["type"])
    op.create_index("ix_opportunities_status", "opportunities", ["status"])
    op.create_index("ix_opportunities_course_id", "opportunities", ["course_id"])
    op.create_index(
        "ix_opportunities_page_type_status", "opportunities", ["page_id", "type", "status"]
    )

    # -------------------------------------------------------- page_enquiries
    op.create_table(
        "page_enquiries",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String()),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("state", sa.String()),
        sa.Column("course_id", sa.String()),
        sa.Column("course_name", sa.String()),
        sa.Column("specialization", sa.String()),
        sa.Column("status", sa.String(), nullable=False, server_default="New"),
        sa.Column("note", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_page_enquiries_page_id", "page_enquiries", ["page_id"])
    op.create_index("ix_page_enquiries_user_id", "page_enquiries", ["user_id"])
    op.create_index("ix_page_enquiries_status", "page_enquiries", ["status"])
    op.create_index("ix_page_enquiries_page_status", "page_enquiries", ["page_id", "status"])

    # -------------------------------------------------------------- follows
    op.create_table(
        "follows",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "page_id", name="uq_follow_user_page"),
    )
    op.create_index("ix_follows_user_id", "follows", ["user_id"])
    op.create_index("ix_follows_page_id", "follows", ["page_id"])
    op.create_index("ix_follows_page_user", "follows", ["page_id", "user_id"])

    # -------------------------------------------------------- notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.String()),
        sa.Column("ref_type", sa.String()),
        sa.Column("ref_id", sa.String()),
        sa.Column("payload", sa.JSON()),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index("ix_notifications_user_read", "notifications", ["user_id", "is_read"])

    # -------------------------------------------------- credit_transactions
    op.create_table(
        "credit_transactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("page_id", sa.String()),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("description", sa.String()),
        sa.Column("ref_type", sa.String()),
        sa.Column("ref_id", sa.String()),
        sa.Column("meta", sa.JSON()),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_credit_transactions_user_id", "credit_transactions", ["user_id"])
    op.create_index("ix_credit_transactions_page_id", "credit_transactions", ["page_id"])
    op.create_index("ix_credit_tx_user_created", "credit_transactions", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_table("credit_transactions")
    op.drop_table("notifications")
    op.drop_table("follows")
    op.drop_table("page_enquiries")
    op.drop_table("opportunities")
    op.drop_table("courses")
    op.drop_table("page_admins")
    op.drop_index("ix_pages_slug", table_name="pages")
    op.drop_table("pages")
