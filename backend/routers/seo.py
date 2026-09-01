"""
Public SEO surface: robots.txt, sitemap.xml, and the SPA shell with per-page
metadata injected.

Why this lives in the backend
-----------------------------
The site is a client-rendered SPA, so `frontend/index.html` ships one static
`<title>` for every URL. Googlebot executes JavaScript and would eventually see
the real content, but the crawlers that build link previews — Facebook,
WhatsApp, LinkedIn, X — do **not** run JavaScript at all. They read the HTML as
delivered. Without server-injected tags, every institute link shared in a
WhatsApp group renders as a blank card titled "Next Move".

Injecting the head server-side fixes that without adopting SSR: the body stays
client-rendered, only `<head>` is personalised per URL. See
docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md.

This is NOT cloaking. Every visitor and every crawler receives byte-identical
HTML for a given URL; nothing branches on the User-Agent.
"""

import html
import os
import re
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Response
from fastapi.responses import HTMLResponse, PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.urls import page_public_path, parse_public_path
from routers.pages import find_page_by_public_path
from core.database import get_db
from models.course import Course
from models.opportunity import Opportunity
from models.page import Page

router = APIRouter(tags=["SEO"])

# Route prefixes that must never be indexed: either login-gated (so a crawler
# only ever sees a redirect) or thin/duplicate content with no search value.
#
# Institute pages are now namespaced under their type (/college/..., /coaching/...),
# so this list no longer decides what IS an institute — `parse_public_path` does,
# and a new app route can be added without touching this list. It is still
# consulted by `legacy_slug_redirect`, which looks at bare single-segment paths,
# so an app route missing here could be mistaken for an old institute slug.
NOINDEX_PREFIXES = (
    "/admin",
    "/institute",
    "/feed",
    "/profile",
    "/dashboard",
    "/purchased",
    "/search",
    "/create-page",
    "/login",
    "/signup",
    "/page",
)

SITE_NAME = "Connectedus"
DEFAULT_TITLE = "Connectedus — Schools, Colleges and Coaching Institutes"
DEFAULT_DESCRIPTION = (
    "Discover schools, colleges, coaching centres and training institutes. "
    "Browse courses, admission notices and faculty vacancies, and enquire directly."
)

# Google truncates descriptions around 160 characters; trimming here keeps
# snippets from ending mid-word.
MAX_DESCRIPTION = 160


def absolute_url(path: Optional[str]) -> Optional[str]:
    """Make a stored relative asset path absolute.

    og:image is fetched by a crawler with no page context, so a relative
    `/uploads/...` path silently yields no preview image.
    """
    if not path:
        return None
    if re.match(r"^https?://", path):
        return path
    return f"{settings.public_base_url}/{path.lstrip('/')}"


def truncate(text: Optional[str], limit: int = MAX_DESCRIPTION) -> str:
    if not text:
        return ""
    collapsed = " ".join(text.split())
    if len(collapsed) <= limit:
        return collapsed
    return collapsed[: limit - 1].rsplit(" ", 1)[0] + "…"


def is_noindex(path: str) -> bool:
    normalised = "/" + path.strip("/")
    return any(normalised == p or normalised.startswith(p + "/") for p in NOINDEX_PREFIXES)


# ---------------------------------------------------------------------------
# robots.txt
# ---------------------------------------------------------------------------

@router.get("/robots.txt", response_class=PlainTextResponse, include_in_schema=False)
async def robots_txt() -> PlainTextResponse:
    if not settings.SEO_INDEXING_ENABLED:
        # Staging and preview deployments must never compete with production
        # for the same content.
        body = "User-agent: *\nDisallow: /\n"
        return PlainTextResponse(body, headers={"Cache-Control": "public, max-age=300"})

    # Two lines per prefix: `$` anchors the exact path, `/` covers the subtree.
    # A bare `Disallow: /page` would also block every institute whose slug
    # merely starts with "page" — robots.txt matching is prefix-based — which
    # would silently de-index real institutes.
    disallow = "\n".join(f"Disallow: {p}$\nDisallow: {p}/" for p in NOINDEX_PREFIXES)
    body = (
        "User-agent: *\n"
        f"{disallow}\n"
        "Disallow: /api/\n"
        "Allow: /\n"
        "\n"
        f"Sitemap: {settings.public_base_url}/sitemap.xml\n"
    )
    return PlainTextResponse(body, headers={"Cache-Control": "public, max-age=3600"})


# ---------------------------------------------------------------------------
# sitemap.xml
# ---------------------------------------------------------------------------

@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml(db: AsyncSession = Depends(get_db)) -> Response:
    """Every enabled institute page, newest first.

    Only `is_enabled` pages are listed: a disabled page 404s for the public, and
    submitting URLs that 404 wastes crawl budget and erodes trust in the sitemap.
    """
    rows: List[Page] = list(
        (
            await db.execute(
                select(Page).where(Page.is_enabled.is_(True)).order_by(Page.created_at.desc())
            )
        ).scalars().all()
    )

    base = settings.public_base_url
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        f"  <url><loc>{html.escape(base)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>",
    ]
    for page in rows:
        lastmod = page.updated_at or page.created_at
        stamp = ""
        if lastmod:
            if lastmod.tzinfo is None:
                lastmod = lastmod.replace(tzinfo=timezone.utc)
            stamp = f"<lastmod>{lastmod.date().isoformat()}</lastmod>"
        loc = html.escape(f"{base}{page_public_path(page)}")
        parts.append(f"  <url><loc>{loc}</loc>{stamp}<changefreq>weekly</changefreq><priority>0.8</priority></url>")
    parts.append("</urlset>")

    return Response(
        content="\n".join(parts),
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )


# ---------------------------------------------------------------------------
# SPA shell with injected <head>
# ---------------------------------------------------------------------------

def _meta_tags(
    *,
    title: str,
    description: str,
    canonical: str,
    image: Optional[str],
    noindex: bool,
    json_ld: Optional[str] = None,
) -> str:
    esc = html.escape
    tags = [
        f"<title>{esc(title)}</title>",
        f'<meta name="description" content="{esc(description)}" />',
        f'<link rel="canonical" href="{esc(canonical)}" />',
        '<meta property="og:type" content="website" />',
        f'<meta property="og:site_name" content="{esc(SITE_NAME)}" />',
        f'<meta property="og:title" content="{esc(title)}" />',
        f'<meta property="og:description" content="{esc(description)}" />',
        f'<meta property="og:url" content="{esc(canonical)}" />',
        f'<meta name="twitter:card" content="{"summary_large_image" if image else "summary"}" />',
        f'<meta name="twitter:title" content="{esc(title)}" />',
        f'<meta name="twitter:description" content="{esc(description)}" />',
    ]
    if image:
        tags.append(f'<meta property="og:image" content="{esc(image)}" />')
        tags.append(f'<meta name="twitter:image" content="{esc(image)}" />')
    if noindex or not settings.SEO_INDEXING_ENABLED:
        tags.append('<meta name="robots" content="noindex, nofollow" />')
    else:
        tags.append('<meta name="robots" content="index, follow" />')
    if json_ld:
        tags.append(f'<script type="application/ld+json">{json_ld}</script>')
    return "\n    ".join(tags)


def _page_json_ld(page: Page) -> str:
    """EducationalOrganization — the schema.org type Google understands for a
    school/college/coaching centre. Emitted as a compact JSON string; `</` is
    escaped so a stray sequence in free text cannot close the script tag."""
    import json

    data = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": page.name,
        "url": f"{settings.public_base_url}{page_public_path(page)}",
    }
    if page.about or page.tagline:
        data["description"] = truncate(page.about or page.tagline, 300)
    logo = absolute_url(page.logo_url)
    if logo:
        data["logo"] = logo
    if page.website:
        site = page.website if re.match(r"^https?://", page.website) else f"https://{page.website}"
        data["sameAs"] = [site]
    if page.contact:
        data["telephone"] = page.contact
    address = {
        k: v
        for k, v in {
            "@type": "PostalAddress",
            "streetAddress": page.address,
            "addressLocality": page.city,
            "addressRegion": page.state,
            "addressCountry": "IN",
        }.items()
        if v
    }
    if len(address) > 2:
        data["address"] = address

    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def _load_shell() -> Optional[str]:
    if not settings.FRONTEND_DIST:
        return None
    index_path = os.path.join(settings.FRONTEND_DIST, "index.html")
    if not os.path.isfile(index_path):
        return None
    with open(index_path, encoding="utf-8") as fh:
        return fh.read()


# The built index.html has exactly one <title>; replacing it and appending the
# rest keeps whatever else Vite injected (module script, stylesheet, fonts).
_TITLE_RE = re.compile(r"<title>.*?</title>", re.IGNORECASE | re.DOTALL)


# React's createRoot().render() REPLACES whatever is already inside the
# container, so anything written into #root here is swapped out cleanly the
# moment the bundle boots. No hydration is involved and no mismatch is
# possible — this is content for readers that never run the bundle (crawlers,
# view-source, JS disabled), not a hydration root.
_ROOT_RE = re.compile(r'(<div id="root">)(</div>)', re.IGNORECASE)


def render_shell(shell: str, meta: str, body: str = "") -> str:
    if _TITLE_RE.search(shell):
        out = _TITLE_RE.sub(meta, shell, count=1)
    else:
        out = shell.replace("</head>", f"    {meta}\n  </head>", 1)
    if body:
        out = _ROOT_RE.sub(lambda m: m.group(1) + body + m.group(2), out, count=1)
    return out


def _esc(value) -> str:
    return html.escape(str(value)) if value else ""


def _page_body_html(page: Page, courses: List[Course], opportunities: List[Opportunity]) -> str:
    """A plain, semantic rendering of the institute page.

    Deliberately minimal: headings, paragraphs and lists carrying the facts a
    search engine needs — name, what it is, where it is, what it teaches, what
    it has posted. Presentation is the React app's job; this exists so the
    content is in the delivered HTML rather than only after a bundle executes.
    """
    location = ", ".join(p for p in (page.address, page.city, page.state) if p)
    parts = [
        '<div style="max-width:64rem;margin:0 auto;padding:2rem 1.5rem;'
        'font-family:Inter,system-ui,sans-serif;color:#131b2e">',
        f"<h1>{_esc(page.name)}</h1>",
    ]
    if page.tagline:
        parts.append(f"<p>{_esc(page.tagline)}</p>")
    suffix = f" · {_esc(location)}" if location else ""
    parts.append(f"<p>{_esc(page.type)}{suffix}</p>")

    if page.about:
        parts.append("<h2>About</h2>")
        parts.append(f"<p>{_esc(page.about)}</p>")

    details = []
    if location:
        details.append(f"<li>Address: {_esc(location)}</li>")
    if page.contact:
        details.append(f"<li>Contact: {_esc(page.contact)}</li>")
    if page.website:
        details.append(f"<li>Website: {_esc(page.website)}</li>")
    if page.affiliation:
        details.append(f"<li>Affiliation: {_esc(page.affiliation)}</li>")
    if details:
        parts.append("<h2>Details</h2><ul>" + "".join(details) + "</ul>")

    if courses:
        parts.append("<h2>Courses Offered</h2><ul>")
        for c in courses:
            meta_bits = " · ".join(_esc(b) for b in (c.category, c.level, c.duration) if b)
            line = f"<strong>{_esc(c.name)}</strong>"
            if meta_bits:
                line += f" — {meta_bits}"
            parts.append(f"<li>{line}</li>")
        parts.append("</ul>")

    if opportunities:
        parts.append("<h2>Opportunities</h2><ul>")
        for o in opportunities:
            label = "Admission Notice" if o.type == "admission" else "Job Vacancy"
            line = f"<strong>{_esc(o.title)}</strong> ({label})"
            if o.description:
                line += f" — {_esc(o.description)}"
            parts.append(f"<li>{line}</li>")
        parts.append("</ul>")

    parts.append("</div>")
    return "".join(parts)


async def _feed_body_html(db: AsyncSession) -> str:
    """The public feed, rendered plainly.

    Its job for search is to be a crawlable hub: an aggregated, constantly
    changing feed ranks for nothing itself, but the links out of it are how
    crawlers discover every institute page. So this lists what is actually
    published — notices and vacancies, then the institutes — rather than trying
    to reproduce the app's feed cards.

    Member posts are not here because there is no Post entity yet; see
    docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md step 4.
    """
    base = settings.public_base_url

    opportunities = list(
        (
            await db.execute(
                select(Opportunity, Page)
                .join(Page, Page.id == Opportunity.page_id)
                .where(Opportunity.status == "Published", Page.is_enabled.is_(True))
                .order_by(Opportunity.published_at.desc().nullslast())
                .limit(30)
            )
        ).all()
    )
    pages = list(
        (
            await db.execute(
                select(Page).where(Page.is_enabled.is_(True)).order_by(Page.created_at.desc()).limit(50)
            )
        ).scalars().all()
    )

    parts = [
        '<div style="max-width:64rem;margin:0 auto;padding:2rem 1.5rem;'
        'font-family:Inter,system-ui,sans-serif;color:#131b2e">',
        f"<h1>{_esc(SITE_NAME)}</h1>",
        f"<p>{_esc(DEFAULT_DESCRIPTION)}</p>",
    ]

    if opportunities:
        parts.append("<h2>Latest admission notices and vacancies</h2><ul>")
        for opp, page in opportunities:
            label = "Admission Notice" if opp.type == "admission" else "Job Vacancy"
            href = _esc(f"{base}{page_public_path(page)}")
            line = (
                f'<strong>{_esc(opp.title)}</strong> ({label}) — '
                f'<a href="{href}">{_esc(page.name)}</a>'
            )
            if opp.description:
                line += f"<br />{_esc(truncate(opp.description, 200))}"
            parts.append(f"<li>{line}</li>")
        parts.append("</ul>")

    if pages:
        parts.append("<h2>Institutes on Connectedus</h2><ul>")
        for page in pages:
            location = ", ".join(p for p in (page.city, page.state) if p)
            href = _esc(f"{base}{page_public_path(page)}")
            suffix = f" — {_esc(page.type)}" + (f", {_esc(location)}" if location else "")
            parts.append(f'<li><a href="{href}">{_esc(page.name)}</a>{suffix}</li>')
        parts.append("</ul>")

    if not opportunities and not pages:
        parts.append("<p>No institutes have been published yet.</p>")

    parts.append("</div>")
    return "".join(parts)


async def build_head_and_body(path: str, db: AsyncSession) -> tuple[str, str, int]:
    """The `<head>` tags, `#root` content and HTTP status for one URL.

    Split out from `render_public_html` so the same computation backs both the
    served HTML and `/api/seo/preview`, which the Vite dev server calls to give
    development the same output as production. One implementation, so the two
    cannot drift.
    """
    base = settings.public_base_url
    slug = path.strip("/")

    # An institute lives at /{type}/{name}/{city} (see core/urls.py), which is
    # recognised by its leading type segment rather than by "anything that is
    # not a known app route". That removes the old trap where adding a route to
    # App.jsx without also adding it to NOINDEX_PREFIXES made that route 404.
    page = await find_page_by_public_path(db, path)
    is_vanity_url = parse_public_path(path) is not None

    if page is not None:
        if page.is_enabled:
            location = ", ".join(p for p in (page.city, page.state) if p)
            title = f"{page.name}"
            if location:
                title += f" — {location}"
            title += f" | {SITE_NAME}"
            fallback = f"{page.name} — {page.type} in {location}." if location else f"{page.name} — {page.type}."
            description = truncate(page.about or page.tagline or fallback)
            meta = _meta_tags(
                title=title,
                description=description,
                canonical=f"{base}{page_public_path(page)}",
                image=absolute_url(page.logo_url) or absolute_url((page.banners or [None])[0]),
                noindex=False,
                json_ld=_page_json_ld(page),
            )
            # Published content only — the same rule the API applies to
            # anonymous callers. A crawler must never be shown a draft.
            courses = list(
                (
                    await db.execute(
                        select(Course)
                        .where(Course.page_id == page.id, Course.status == "Published")
                        .order_by(Course.created_at)
                    )
                ).scalars().all()
            )
            opportunities = list(
                (
                    await db.execute(
                        select(Opportunity)
                        .where(Opportunity.page_id == page.id, Opportunity.status == "Published")
                        .order_by(Opportunity.created_at.desc())
                    )
                ).scalars().all()
            )
            return meta, _page_body_html(page, courses, opportunities), 200

    # A vanity URL that matched no enabled page really is missing. Replying 200
    # here would be a soft 404: Google treats a page that says "not found"
    # while returning 200 as a quality problem and keeps re-crawling it. The
    # SPA still renders its own not-found screen from a 404 body.
    missing = is_vanity_url
    meta = _meta_tags(
        title=f"Page not found | {SITE_NAME}" if missing else DEFAULT_TITLE,
        description=DEFAULT_DESCRIPTION,
        canonical=f"{base}/{slug}" if slug else f"{base}/",
        image=None,
        noindex=missing or is_noindex(f"/{slug}"),
    )
    # The home feed is the only other page worth rendering: it is the hub whose
    # outbound links let a crawler reach every institute page.
    body = await _feed_body_html(db) if not slug else ""
    return meta, body, 404 if missing else 200


async def legacy_slug_redirect(path: str, db: AsyncSession) -> Optional[str]:
    """The canonical path for an old single-segment institute URL, or None.

    Institute pages used to live at `/{slug}`. Those links are already out in
    the world — handed to institutes, posted in chats — so they redirect
    permanently to the new `/{type}/{name}/{city}` instead of 404ing. Search
    engines follow a 301 and transfer the ranking rather than starting over.

    Only single-segment paths that are not known app routes are considered, so
    `/profile` is never mistaken for an institute.
    """
    slug = path.strip("/")
    if not slug or "/" in slug or is_noindex(f"/{slug}"):
        return None

    page = (await db.execute(select(Page).where(Page.slug == slug))).scalars().first()
    if page is None or not page.is_enabled:
        return None

    canonical = page_public_path(page)
    return canonical if canonical != f"/{slug}" else None


async def render_public_html(path: str, db: AsyncSession) -> Optional[HTMLResponse]:
    """The built SPA shell for `path` with its metadata and content injected,
    or None when there is no build to serve (i.e. FRONTEND_DIST unset)."""
    shell = _load_shell()
    if shell is None:
        return None
    meta, body, status = await build_head_and_body(path, db)
    return HTMLResponse(render_shell(shell, meta, body), status_code=status)


@router.get("/api/seo/preview", include_in_schema=False)
async def seo_preview(path: str = "/", db: AsyncSession = Depends(get_db)):
    """What `path` should carry in <head> and inside #root.

    Exists for the Vite dev server, which serves index.html itself and so never
    reaches the HTML route above — without this, the SEO output would be
    invisible on :5173 and only appear after a production build. See the
    seoDevPreview plugin in frontend/vite.config.js.
    """
    meta, body, status = await build_head_and_body(path, db)
    return {"head": meta, "body": body, "status": status}
