"""Account kind: let a self-registered user declare itself an organisation

Self-registration always creates an individual (`/register/student`), and the
Institute role is admin-provisioned, so there was no way for someone who signed
up themselves to say "this account is an organisation". `users.is_organization`
records that.

It is a KIND, not a role: it hides individual-only profile UI (schooling, work
history, CV) and unlocks the organisation details form, but grants no
permissions. Organisation details themselves reuse the existing `institutes`
table via `institutes.user_id`, so no new table is needed.

Purely additive — one nullable-with-default column, safe on a populated
database.

Revision ID: 0003
Revises: 0002
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default so existing rows get False rather than NULL; the column is
    # then safe to mark NOT NULL in the same step.
    op.add_column(
        "users",
        sa.Column(
            "is_organization",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_organization")
