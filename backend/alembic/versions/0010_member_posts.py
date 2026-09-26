"""Member posts, their likes and replies

Client request, 26 Sep 2026: students, mentors and every other member can post
on the feed, and institutes can reply. Before this the only things that could
be posted were an institute's admission notices and vacancies. See
models/post.py.

Purely additive — three new tables, nothing existing changes.

Revision ID: 0010
Revises: 0009
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("author_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(), nullable=False, server_default="update"),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_posts_author_id", "posts", ["author_id"])
    op.create_index("ix_posts_created_at", "posts", ["created_at"])

    op.create_table(
        "post_comments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("as_page_id", sa.String(), sa.ForeignKey("pages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_post_comments_author_id", "post_comments", ["author_id"])
    op.create_index("ix_post_comments_post_created", "post_comments", ["post_id", "created_at"])

    op.create_table(
        "post_likes",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_like_user"),
    )
    op.create_index("ix_post_likes_post_id", "post_likes", ["post_id"])
    op.create_index("ix_post_likes_user_id", "post_likes", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_post_likes_user_id", table_name="post_likes")
    op.drop_index("ix_post_likes_post_id", table_name="post_likes")
    op.drop_table("post_likes")
    op.drop_index("ix_post_comments_post_created", table_name="post_comments")
    op.drop_index("ix_post_comments_author_id", table_name="post_comments")
    op.drop_table("post_comments")
    op.drop_index("ix_posts_created_at", table_name="posts")
    op.drop_index("ix_posts_author_id", table_name="posts")
    op.drop_table("posts")
