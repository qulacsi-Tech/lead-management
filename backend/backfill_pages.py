"""
Give every existing Institute *account* a public Institute *Page*.

Why this is needed
------------------
`institutes` and `pages` are different things on purpose (see models/page.py):

    institutes  one row per Institute-role login, created by /register/institute
                or by an org account filling in its details. No slug, no media,
                no multi-admin support.
    pages       the public entity behind connectedus.in/<slug> — slug, content,
                banners, gallery, and any number of admins.

Accounts created before Institute Pages existed therefore have no public page,
so their vanity URL 404s and nothing about them is indexable. This backfills
one Page per account and hands it to that account as OWNER.

Idempotent: an account whose user already administers a page is skipped, so it
is safe to re-run after adding more institutes.

    cd backend && py backfill_pages.py            # apply
    cd backend && py backfill_pages.py --dry-run  # report only
"""

import asyncio
import sys
import uuid

from sqlalchemy import select

from core.database import AsyncSessionLocal
from models.course import Course
from models.institute import Institute
from models.page import Page, PageAdmin
from models.user import User
from routers.pages import RESERVED_SLUGS, slugify

# Institute accounts carry no type — the field only exists on Page. Everything
# is created as this and can be corrected in Admin → Institute Pages.
DEFAULT_TYPE = "Training Institute"


async def unique_slug(db, desired: str, taken: set) -> str:
    """`taken` carries slugs chosen earlier in this run.

    A real run flushes each page before the next lookup, so the database alone
    would be enough — but a dry run writes nothing, and without this two
    institutes sharing a name would both be reported as the same slug. The
    report has to match what an apply would actually do.
    """
    base = slugify(desired) or f"institute-{uuid.uuid4().hex[:6]}"
    if base in RESERVED_SLUGS:
        base = f"{base}-institute"
    candidate, n = base, 2
    while candidate in taken or (
        await db.execute(select(Page.id).where(Page.slug == candidate))
    ).scalars().first():
        candidate, n = f"{base}-{n}", n + 1
    taken.add(candidate)
    return candidate


async def main(dry_run: bool) -> None:
    created, skipped = [], []
    taken = set()

    async with AsyncSessionLocal() as db:
        institutes = list((await db.execute(select(Institute))).scalars().all())

        for inst in institutes:
            # "Already has a page" is a relationship question, not a name match:
            # does this account's user administer any page?
            existing = (
                await db.execute(
                    select(Page)
                    .join(PageAdmin, PageAdmin.page_id == Page.id)
                    .where(PageAdmin.user_id == inst.user_id)
                )
            ).scalars().first()
            if existing is not None:
                skipped.append((inst.name, existing.slug))
                continue

            slug = await unique_slug(db, inst.name, taken)
            # `programs` is a comma-separated string on the account; courses are
            # rows on the page. Published so they show on the public page.
            course_names = [p.strip() for p in (inst.programs or "").split(",") if p.strip()]

            if dry_run:
                created.append((inst.name, slug, len(course_names)))
                continue

            page = Page(
                name=inst.name,
                slug=slug,
                type=DEFAULT_TYPE,
                about=inst.about,
                city=inst.city,
                state=inst.state,
                address=inst.block or inst.district,
                website=inst.website,
                contact=inst.phone,
                banners=[], gallery=[], social_links={}, content={},
                created_by=inst.user_id,
            )
            db.add(page)
            await db.flush()

            # The account that owns the institute administers its page.
            if (await db.execute(select(User.id).where(User.id == inst.user_id))).scalars().first():
                db.add(PageAdmin(page_id=page.id, user_id=inst.user_id, role="OWNER"))

            for name in course_names:
                db.add(Course(page_id=page.id, name=name, status="Published"))

            created.append((inst.name, slug, len(course_names)))

        if not dry_run:
            await db.commit()

    verb = "would create" if dry_run else "created"
    print(f"{verb} {len(created)} page(s):")
    for name, slug, n_courses in created:
        print(f"   /{slug:<40} {name}  ({n_courses} course(s))")
    if skipped:
        print(f"skipped {len(skipped)} account(s) that already administer a page:")
        for name, slug in skipped:
            print(f"   /{slug:<40} {name}")


if __name__ == "__main__":
    asyncio.run(main(dry_run="--dry-run" in sys.argv))
