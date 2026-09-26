"""
Member posts, likes and replies — see models/post.py for the why.

Every route needs a session: the feed is member-only, and a post carries its
author's name. Who wrote, liked or replied is always the session's user, never
a field in the body. The one thing a body may name is `as_page_id` on a
reply, and that is checked against page_admins before it is honoured.
"""

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.authz import is_main_admin, user_is_page_member
from core.database import get_db
from core.deps import get_current_active_user
from core.urls import page_public_path
from models.page import Page
from models.post import (
    POST_KINDS,
    CommentCreate,
    CommentPage,
    CommentResponse,
    Post,
    PostAuthor,
    PostComment,
    PostCreate,
    PostLike,
    PostLikeResponse,
    PostResponse,
)
from models.social import Notification
from models.user import User

router = APIRouter(prefix="/posts", tags=["Posts"])


def _author(user: User) -> PostAuthor:
    return PostAuthor(
        id=user.id,
        name=user.name,
        role=user.role,
        headline=user.headline,
        profile_photo_url=user.profile_photo_url,
    )


def _clean(body: str) -> str:
    text = body.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Write something first")
    return text


async def _load_post(db: AsyncSession, post_id: str) -> Post:
    post = await db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


async def _decorate(db: AsyncSession, posts: List[Post], me: User) -> List[PostResponse]:
    """Authors, like/comment counts and "did I like it", in four queries for
    the whole page rather than four per post."""
    if not posts:
        return []
    ids = [p.id for p in posts]

    authors: Dict[str, User] = {
        u.id: u
        for u in (
            await db.execute(select(User).where(User.id.in_({p.author_id for p in posts})))
        ).scalars()
    }
    likes = dict(
        (await db.execute(
            select(PostLike.post_id, func.count()).where(PostLike.post_id.in_(ids)).group_by(PostLike.post_id)
        )).all()
    )
    comments = dict(
        (await db.execute(
            select(PostComment.post_id, func.count()).where(PostComment.post_id.in_(ids)).group_by(PostComment.post_id)
        )).all()
    )
    mine = set(
        (await db.execute(
            select(PostLike.post_id).where(PostLike.post_id.in_(ids), PostLike.user_id == me.id)
        )).scalars()
    )

    out = []
    for p in posts:
        author = authors.get(p.author_id)
        if author is None:
            continue
        out.append(PostResponse(
            id=p.id,
            kind=p.kind,
            body=p.body,
            created_at=p.created_at,
            author=_author(author),
            likes_count=likes.get(p.id, 0),
            liked_by_me=p.id in mine,
            comments_count=comments.get(p.id, 0),
            can_delete=p.author_id == me.id or is_main_admin(me),
        ))
    return out


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------

@router.get("", response_model=List[PostResponse])
async def list_posts(
    limit: int = Query(20, ge=1, le=50),
    before: Optional[datetime] = Query(None, description="Only posts older than this, for paging"),
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    stmt = select(Post)
    if before is not None:
        stmt = stmt.where(Post.created_at < before)
    posts = list((await db.execute(stmt.order_by(Post.created_at.desc()).limit(limit))).scalars())
    return await _decorate(db, posts, me)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    if payload.kind not in POST_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {POST_KINDS}")
    post = Post(author_id=me.id, kind=payload.kind, body=_clean(payload.body))
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return (await _decorate(db, [post], me))[0]


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    post = await _load_post(db, post_id)
    if post.author_id != me.id and not is_main_admin(me):
        raise HTTPException(status_code=403, detail="You can only delete your own posts")
    await db.delete(post)
    await db.commit()


# ---------------------------------------------------------------------------
# Likes
# ---------------------------------------------------------------------------

async def _like_count(db: AsyncSession, post_id: str) -> int:
    return await db.scalar(select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id)) or 0


@router.post("/{post_id}/like", response_model=PostLikeResponse)
async def like_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    await _load_post(db, post_id)
    db.add(PostLike(post_id=post_id, user_id=me.id))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()  # already liked — idempotent
    return PostLikeResponse(post_id=post_id, liked=True, likes_count=await _like_count(db, post_id))


@router.delete("/{post_id}/like", response_model=PostLikeResponse)
async def unlike_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    await _load_post(db, post_id)
    like = (await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == me.id)
    )).scalars().first()
    if like is not None:
        await db.delete(like)
        await db.commit()
    return PostLikeResponse(post_id=post_id, liked=False, likes_count=await _like_count(db, post_id))


# ---------------------------------------------------------------------------
# Replies
# ---------------------------------------------------------------------------

async def _comment_responses(
    db: AsyncSession, post: Post, comments: List[PostComment], me: User
) -> List[CommentResponse]:
    user_ids = {c.author_id for c in comments}
    page_ids = {c.as_page_id for c in comments if c.as_page_id}
    users = {u.id: u for u in (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars()} if user_ids else {}
    pages = {p.id: p for p in (await db.execute(select(Page).where(Page.id.in_(page_ids)))).scalars()} if page_ids else {}

    out = []
    for c in comments:
        author = users.get(c.author_id)
        if author is None:
            continue
        page = pages.get(c.as_page_id) if c.as_page_id else None
        out.append(CommentResponse(
            id=c.id,
            post_id=c.post_id,
            body=c.body,
            created_at=c.created_at,
            author=_author(author),
            page=CommentPage(
                id=page.id, name=page.name, type=page.type, logo_url=page.logo_url,
                public_path=page_public_path(page),
            ) if page else None,
            # The commenter, the post's author (it is their thread) or a Main Admin.
            can_delete=c.author_id == me.id or post.author_id == me.id or is_main_admin(me),
        ))
    return out


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def list_comments(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    post = await _load_post(db, post_id)
    comments = list((await db.execute(
        select(PostComment).where(PostComment.post_id == post_id).order_by(PostComment.created_at)
    )).scalars())
    return await _comment_responses(db, post, comments, me)


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: str,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    post = await _load_post(db, post_id)

    page: Optional[Page] = None
    if payload.as_page_id:
        page = await db.get(Page, payload.as_page_id)
        # Membership, not "may write to": a Main Admin can edit every page but
        # speaks for none of them.
        if page is None or not await user_is_page_member(db, me, page.id):
            raise HTTPException(status_code=403, detail="You can only reply as an institute you administer")

    comment = PostComment(post_id=post.id, author_id=me.id, as_page_id=page.id if page else None, body=_clean(payload.body))
    db.add(comment)

    if post.author_id != me.id:
        who = page.name if page else me.name
        db.add(Notification(
            user_id=post.author_id,
            type="post_comment",
            title=f"{who} replied to your post",
            message=comment.body[:140],
            ref_type="post",
            ref_id=post.id,
        ))

    await db.commit()
    await db.refresh(comment)
    return (await _comment_responses(db, post, [comment], me))[0]


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: str,
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_current_active_user),
):
    post = await _load_post(db, post_id)
    comment = await db.get(PostComment, comment_id)
    if comment is None or comment.post_id != post.id:
        raise HTTPException(status_code=404, detail="Reply not found")
    if comment.author_id != me.id and post.author_id != me.id and not is_main_admin(me):
        raise HTTPException(status_code=403, detail="You can't delete this reply")
    await db.delete(comment)
    await db.commit()
