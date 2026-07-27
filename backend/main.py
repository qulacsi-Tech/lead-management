from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine, Base
from routers import auth, users, leads, dashboard
from routers.activities import router as activities_router
from routers.tasks import lead_tasks_router, tasks_router
from routers.register import router as register_router
from routers.admin_data import router as admin_data_router
from routers.geo import router as geo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so Base knows about them before create_all
    from models import user as _u, lead as _l, activity as _a, task as _t  # noqa
    from models import student as _s, mentor as _m, institute as _i  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(leads.router, prefix="/api")
app.include_router(activities_router, prefix="/api")
app.include_router(lead_tasks_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(register_router, prefix="/api")
app.include_router(admin_data_router, prefix="/api")
app.include_router(geo_router, prefix="/api")


@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": f"{settings.PROJECT_NAME} Backend is alive!"}


@app.get("/health")
def health():
    return {"status": "working"}
