import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import engine, get_db
from models import ALL_MODEL_MODULES  # noqa: F401  (registers every model on Base)
from routers import auth
from routers.register import router as register_router
from routers.admin_data import router as admin_data_router
from routers.geo import router as geo_router
from routers.profile import router as profile_router
from routers.pages import router as pages_router
from routers.page_media import router as page_media_router
from routers.courses import router as courses_router
from routers.opportunities import router as opportunities_router, public_router as public_opportunities_router
from routers.page_enquiries import router as page_enquiries_router, admin_router as enquiries_admin_router
from routers.study_papers import router as study_papers_router, public_router as public_papers_router
from routers.social import follow_router, notification_router
from routers.applications import router as applications_router, page_router as page_applications_router
from routers.credits import router as credits_router
from routers.ad_templates import router as ad_templates_router
from routers.posts import router as posts_router
from routers.seo import router as seo_router, render_public_html, legacy_slug_redirect

UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup no longer touches the schema.

    Schema is owned by Alembic as of Phase 2 — the previous `create_all` plus
    24 hand-written `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements are
    gone. Run `alembic upgrade head` (see backend/README_MIGRATIONS.md) before
    starting the app; the check below fails fast with that instruction rather
    than letting the app run against a schema it cannot use.
    """
    os.makedirs(UPLOAD_ROOT, exist_ok=True)
    async with engine.begin() as conn:
        from sqlalchemy import text
        exists = await conn.scalar(text("SELECT to_regclass('public.pages')"))
        if exists is None:
            raise RuntimeError(
                "Database schema is not up to date — table 'pages' is missing.\n"
                "Run:  cd backend && py -m alembic upgrade head"
            )
    yield
    await engine.dispose()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_ROOT, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# Include Routers
# Only auth + admin-facing endpoints remain — Student/Mentor/Institute
# self-service dashboards and the legacy generic CRM routers were retired
# in favor of the unified feed/profile experience (see
# docs/EDUCATION_NETWORK_ROADMAP.md). Admin still provisions and lists
# Student/Mentor/Institute accounts via register.py / admin_data.py.
app.include_router(auth.router, prefix="/api")
app.include_router(register_router, prefix="/api")
app.include_router(admin_data_router, prefix="/api")
app.include_router(geo_router, prefix="/api")
app.include_router(profile_router, prefix="/api")

# --- Phase 2: Page-centric ownership model ---------------------------------
# Nested page routers must be registered before the bare /pages router so that
# /pages/{page_id}/courses is not swallowed by /pages/{page_id}.
app.include_router(page_media_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")
app.include_router(page_enquiries_router, prefix="/api")
app.include_router(study_papers_router, prefix="/api")
app.include_router(page_applications_router, prefix="/api")
app.include_router(pages_router, prefix="/api")
app.include_router(public_opportunities_router, prefix="/api")
app.include_router(public_papers_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(enquiries_admin_router, prefix="/api")
app.include_router(follow_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(credits_router, prefix="/api")
app.include_router(ad_templates_router, prefix="/api")
app.include_router(posts_router, prefix="/api")


@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} Backend is alive!"}


@app.get("/health")
def health():
    return {"status": "working"}


# ---------------------------------------------------------------------------
# Public site
#
# robots.txt and sitemap.xml are unprefixed because crawlers only ever look for
# them at the origin root. Registered AFTER every /api route so nothing here
# can shadow the API.
# ---------------------------------------------------------------------------

app.include_router(seo_router)

if settings.FRONTEND_DIST and os.path.isdir(settings.FRONTEND_DIST):
    # Serve the built SPA. Hashed build assets are served straight from disk;
    # every other path falls through to the catch-all below, which returns
    # index.html with that URL's metadata injected.
    _assets_dir = os.path.join(settings.FRONTEND_DIST, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_shell(full_path: str, db: AsyncSession = Depends(get_db)):
        """Client-side routing fallback with server-rendered <head>.

        Declared last so it is only reached when no API route, upload or build
        asset matched. An unknown /api/* path must still 404 as JSON rather
        than quietly returning HTML, which would turn a typo in a fetch call
        into a confusing parse error.
        """
        if full_path.startswith(("api/", "uploads/")):
            raise HTTPException(status_code=404, detail="Not found")

        # An institute page moved from /{slug} to /{type}/{name}/{city}; send
        # the old URL on permanently rather than 404ing links already shared.
        moved = await legacy_slug_redirect(full_path, db)
        if moved:
            return RedirectResponse(moved, status_code=301)

        # A real file in the build (favicon.svg, icons.svg, _redirects, ...)
        # wins over the SPA shell.
        candidate = os.path.normpath(os.path.join(settings.FRONTEND_DIST, full_path))
        if (
            full_path
            and candidate.startswith(os.path.abspath(settings.FRONTEND_DIST))
            and os.path.isfile(candidate)
        ):
            return FileResponse(candidate)

        rendered = await render_public_html(full_path, db)
        if rendered is None:
            raise HTTPException(status_code=404, detail="Frontend build not found")
        return rendered
