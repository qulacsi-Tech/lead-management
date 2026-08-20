import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import engine
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
from routers.social import follow_router, notification_router
from routers.credits import router as credits_router

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
app.include_router(pages_router, prefix="/api")
app.include_router(public_opportunities_router, prefix="/api")
app.include_router(enquiries_admin_router, prefix="/api")
app.include_router(follow_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(credits_router, prefix="/api")


@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} Backend is alive!"}


@app.get("/health")
def health():
    return {"status": "working"}
