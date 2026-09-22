"""Course categories on a Page, on an enquiry, and opportunity applications

Three additions, all from the client feedback sheet of 22 Sep 2026.

Row 3 — an institute had no way to declare which course categories it offers,
so its public page could not list them and the enquiry form could only offer
the Course rows the institute had already created (an institute with none got
an empty dropdown). `pages.course_categories` holds the declared selection as
[{"category": str, "subcategories": [str, ...]}, ...], and the two new
`page_enquiries` columns record what the enquirer picked from it.

Row 5 — "when the user clicks Apply we should not redirect them to any other
page ... if the user is new they should be able to create their profile here
itself". That needs somewhere to put an application. `opportunity_applications`
is its own table rather than a flag on `page_enquiries`: an enquiry is an
open-ended question addressed to an institute, an application is addressed to
one specific opportunity and carries the applicant's profile. Overloading the
one with the other is exactly what models/page_enquiry.py's docstring warns
against.

Purely additive — every column is nullable or carries a server_default, so no
existing row changes meaning.

Revision ID: 0008
Revises: 0007
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Row 3: the categories an institute declares it offers ---
    op.add_column("pages", sa.Column("course_categories", sa.JSON(), nullable=True))

    # --- Row 3: what the enquirer chose from that list ---
    op.add_column("page_enquiries", sa.Column("course_category", sa.String(), nullable=True))
    op.add_column("page_enquiries", sa.Column("course_subcategory", sa.String(), nullable=True))

    # --- Row 5: applications to an admission notice or a job vacancy ---
    op.create_table(
        "opportunity_applications",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "opportunity_id",
            sa.String(),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("page_id", sa.String(), sa.ForeignKey("pages.id", ondelete="CASCADE"), nullable=False),
        # Set for every application: applying creates an account when the
        # visitor does not have one, which is the whole point of the row.
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("state", sa.String(), nullable=True),
        # Job applications carry these; admission applications leave them null.
        sa.Column("qualification", sa.String(), nullable=True),
        sa.Column("experience", sa.String(), nullable=True),
        sa.Column("current_institute", sa.String(), nullable=True),
        sa.Column("resume_url", sa.String(), nullable=True),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="New"),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        # One application per person per opportunity — clicking Apply twice is
        # a double submit, not a second application.
        sa.UniqueConstraint("opportunity_id", "user_id", name="uq_application_per_user"),
    )
    op.create_index("ix_opportunity_applications_opportunity_id", "opportunity_applications", ["opportunity_id"])
    op.create_index("ix_opportunity_applications_user_id", "opportunity_applications", ["user_id"])
    op.create_index("ix_applications_page_status", "opportunity_applications", ["page_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_applications_page_status", table_name="opportunity_applications")
    op.drop_index("ix_opportunity_applications_user_id", table_name="opportunity_applications")
    op.drop_index("ix_opportunity_applications_opportunity_id", table_name="opportunity_applications")
    op.drop_table("opportunity_applications")

    op.drop_column("page_enquiries", "course_subcategory")
    op.drop_column("page_enquiries", "course_category")
    op.drop_column("pages", "course_categories")
