import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import engine, Base
from routers import auth
from routers.register import router as register_router
from routers.admin_data import router as admin_data_router
from routers.geo import router as geo_router
from routers.profile import router as profile_router

UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so Base knows about them before create_all
    from models import user as _u, revoked_token as _rt  # noqa
    from models import student as _s, mentor as _m, institute as _i, enquiry as _e  # noqa
    from sqlalchemy import text
    os.makedirs(UPLOAD_ROOT, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure new columns exist in Postgres
        await conn.execute(text("ALTER TABLE institutes ADD COLUMN IF NOT EXISTS state VARCHAR;"))
        await conn.execute(text("ALTER TABLE institutes ADD COLUMN IF NOT EXISTS district VARCHAR;"))
        await conn.execute(text("ALTER TABLE institutes ADD COLUMN IF NOT EXISTS block VARCHAR;"))
        await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS city VARCHAR;"))
        await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS target_course VARCHAR;"))
        await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS current_school VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS domain VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS company VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS experience_level VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS title VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS location VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS about VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS status VARCHAR;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS subjects JSON;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS classes_taught JSON;"))
        await conn.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS highlights JSON;"))
        await conn.execute(text("ALTER TABLE institutes ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1240;"))
        await conn.execute(text("ALTER TABLE institutes ADD COLUMN IF NOT EXISTS about VARCHAR;"))
        # Professional Profile fields on users
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS about VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS category VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS experience VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects JSON;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSON;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_institute VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_institutes JSON;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_photo_url VARCHAR;"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url VARCHAR;"))
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


@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} Backend is alive!"}


@app.get("/health")
def health():
    return {"status": "working"}
