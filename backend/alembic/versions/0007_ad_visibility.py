"""Per-ad visibility: this institute's page only, or every institute's page

A Main Admin decides, per ad, whether it runs only where it was published or
across the platform's institute pages. Before this the sponsored rail inferred
eligibility from the city, which meant an institute was promoted onto a
competitor's page without anyone choosing that.

Both columns default to 'page', which is precisely the behaviour every existing
row already had, so no row changes meaning and nothing needs backfilling beyond
the server_default.

Purely additive.

Revision ID: 0007
Revises: 0006
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("opportunities", "study_papers"):
        # server_default rather than a separate UPDATE: it fills every existing
        # row as the column is added, and keeps NOT NULL satisfiable for any
        # insert that predates the model default.
        op.add_column(
            table,
            sa.Column(
                "visibility",
                sa.String(),
                nullable=False,
                server_default="page",
            ),
        )
        op.create_index(f"ix_{table}_visibility", table, ["visibility"])


def downgrade() -> None:
    for table in ("opportunities", "study_papers"):
        op.drop_index(f"ix_{table}_visibility", table_name=table)
        op.drop_column(table, "visibility")
