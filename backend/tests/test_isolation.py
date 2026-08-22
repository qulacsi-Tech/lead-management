"""
Multi-tenant isolation and authorization tests — the mandatory Phase 2 gate.

Sets up two institutes with different admins and asserts that the *server*
refuses cross-tenant access, regardless of what a client claims. Runs against a
throwaway SQLite database so it never touches development data.

Run:
    cd backend
    py -m pytest tests/ -v
"""

import os
import sys
import uuid

import pytest
import pytest_asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TEST_DB = f"sqlite+aiosqlite:///./test_isolation_{uuid.uuid4().hex[:8]}.db"
os.environ.setdefault("DATABASE_URL", TEST_DB)
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ["DATABASE_URL"] = TEST_DB

from httpx import ASGITransport, AsyncClient  # noqa: E402

import core.database as database  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession  # noqa: E402

test_engine = create_async_engine(TEST_DB, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
database.engine = test_engine
database.AsyncSessionLocal = TestSession

from core.database import Base, get_db  # noqa: E402
import models  # noqa: E402,F401
from core.security import get_password_hash  # noqa: E402
from models.user import User  # noqa: E402
from models.enums import UserRole  # noqa: E402


async def override_get_db():
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture(scope="module")
async def app_client():
    from main import app

    app.dependency_overrides[get_db] = override_get_db
    # Bypass the lifespan schema check — the tables are created directly here.
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as db:
        for email, role in [
            ("platform@connectedus.example.com", UserRole.ADMIN),
            ("admin.a@institute-a.example.com", UserRole.PROFESSIONAL),
            ("admin.b@institute-b.example.com", UserRole.PROFESSIONAL),
            ("normal@user.example.com", UserRole.STUDENT),
        ]:
            db.add(User(
                email=email, name=email.split("@")[0],
                hashed_password=get_password_hash("password123"),
                role=role, is_active=True,
            ))
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    await test_engine.dispose()
    for suffix in ("", "-journal"):
        path = TEST_DB.replace("sqlite+aiosqlite:///./", "") + suffix
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass


async def login(client, email: str) -> dict:
    resp = await client.post(
        "/api/auth/login", data={"username": email, "password": "password123"}
    )
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture(scope="module")
async def world(app_client):
    """Two institutes, each with its own admin, created by the platform admin."""
    platform = await login(app_client, "platform@connectedus.example.com")
    admin_a = await login(app_client, "admin.a@institute-a.example.com")
    admin_b = await login(app_client, "admin.b@institute-b.example.com")
    user = await login(app_client, "normal@user.example.com")

    page_a = (await app_client.post("/api/pages", headers=platform, json={
        "name": "Institute A", "type": "Coaching", "admin_email": "admin.a@institute-a.example.com",
    })).json()
    page_b = (await app_client.post("/api/pages", headers=platform, json={
        "name": "Institute B", "type": "School", "admin_email": "admin.b@institute-b.example.com",
    })).json()

    course_a = (await app_client.post(
        f"/api/pages/{page_a['id']}/courses", headers=admin_a,
        json={"name": "A Physics", "status": "Published"},
    )).json()
    course_b = (await app_client.post(
        f"/api/pages/{page_b['id']}/courses", headers=admin_b,
        json={"name": "B Chemistry", "status": "Published"},
    )).json()

    return {
        "platform": platform, "admin_a": admin_a, "admin_b": admin_b, "user": user,
        "page_a": page_a, "page_b": page_b, "course_a": course_a, "course_b": course_b,
    }


# ---------------------------------------------------------------------------
# Admin A can fully manage Institute A
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_a_can_manage_own_institute(app_client, world):
    a, page_a = world["admin_a"], world["page_a"]

    assert (await app_client.get(f"/api/pages/{page_a['id']}", headers=a)).status_code == 200
    assert (await app_client.patch(
        f"/api/pages/{page_a['id']}", headers=a, json={"tagline": "Ours"}
    )).status_code == 200

    for path, payload in [
        (f"/api/pages/{page_a['id']}/courses", {"name": "A Maths"}),
        (f"/api/pages/{page_a['id']}/opportunities",
         {"type": "admission", "title": "A Admissions Open"}),
        (f"/api/pages/{page_a['id']}/opportunities",
         {"type": "job", "title": "A Physics Faculty"}),
    ]:
        assert (await app_client.post(path, headers=a, json=payload)).status_code == 201

    assert (await app_client.get(f"/api/pages/{page_a['id']}/enquiries", headers=a)).status_code == 200


@pytest.mark.asyncio
async def test_my_pages_lists_only_own(app_client, world):
    mine_a = (await app_client.get("/api/pages/mine", headers=world["admin_a"])).json()
    assert [p["name"] for p in mine_a] == ["Institute A"]

    mine_b = (await app_client.get("/api/pages/mine", headers=world["admin_b"])).json()
    assert [p["name"] for p in mine_b] == ["Institute B"]


# ---------------------------------------------------------------------------
# Admin A must NOT reach Institute B  (the core isolation requirement)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_a_cannot_read_institute_b_management_view(app_client, world):
    r = await app_client.get(f"/api/pages/{world['page_b']['id']}", headers=world["admin_a"])
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_a_cannot_edit_institute_b(app_client, world):
    r = await app_client.patch(
        f"/api/pages/{world['page_b']['id']}", headers=world["admin_a"], json={"tagline": "hijacked"}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_a_cannot_create_content_on_institute_b(app_client, world):
    b_id, a = world["page_b"]["id"], world["admin_a"]
    assert (await app_client.post(
        f"/api/pages/{b_id}/courses", headers=a, json={"name": "sneaky"}
    )).status_code == 403
    assert (await app_client.post(
        f"/api/pages/{b_id}/opportunities", headers=a, json={"type": "job", "title": "sneaky"}
    )).status_code == 403


@pytest.mark.asyncio
async def test_admin_a_cannot_delete_institute_b_content(app_client, world):
    r = await app_client.delete(
        f"/api/pages/{world['page_b']['id']}/courses/{world['course_b']['id']}",
        headers=world["admin_a"],
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_id_pairing_is_rejected(app_client, world):
    """The subtle one: Admin A pairs a page they DO own with a course they do
    not. The page-admin check passes, so only the child-ownership check stops
    this from editing Institute B's course."""
    r = await app_client.patch(
        f"/api/pages/{world['page_a']['id']}/courses/{world['course_b']['id']}",
        headers=world["admin_a"],
        json={"name": "hijacked"},
    )
    assert r.status_code == 404

    unchanged = (await app_client.get(
        f"/api/pages/{world['page_b']['id']}/courses/{world['course_b']['id']}",
        headers=world["admin_b"],
    )).json()
    assert unchanged["name"] == "B Chemistry"


@pytest.mark.asyncio
async def test_admin_a_cannot_read_institute_b_enquiries(app_client, world):
    r = await app_client.get(
        f"/api/pages/{world['page_b']['id']}/enquiries", headers=world["admin_a"]
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_institute_admin_cannot_assign_themselves_to_another_page(app_client, world):
    """Privilege escalation: A tries to make themselves an admin of B."""
    r = await app_client.post(
        f"/api/pages/{world['page_b']['id']}/admins",
        headers=world["admin_a"],
        json={"email": "admin.a@institute-a.example.com", "role": "ADMIN"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_institute_admin_cannot_change_platform_fields(app_client, world):
    """slug/type/is_enabled are platform-owned even on a page you administer."""
    r = await app_client.patch(
        f"/api/pages/{world['page_a']['id']}", headers=world["admin_a"], json={"slug": "premium-spot"}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_institute_admin_cannot_delete_their_page(app_client, world):
    r = await app_client.delete(f"/api/pages/{world['page_a']['id']}", headers=world["admin_a"])
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# Normal users
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_normal_user_cannot_mutate_institute_content(app_client, world):
    u, a_id = world["user"], world["page_a"]["id"]
    assert (await app_client.post(
        f"/api/pages/{a_id}/courses", headers=u, json={"name": "nope"}
    )).status_code == 403
    assert (await app_client.patch(
        f"/api/pages/{a_id}", headers=u, json={"tagline": "nope"}
    )).status_code == 403


@pytest.mark.asyncio
async def test_normal_user_cannot_create_pages_or_reach_platform_routes(app_client, world):
    u = world["user"]
    assert (await app_client.post(
        "/api/pages", headers=u, json={"name": "Fake", "type": "Coaching"}
    )).status_code == 403
    assert (await app_client.get("/api/pages", headers=u)).status_code == 403
    assert (await app_client.get("/api/enquiries/all", headers=u)).status_code == 403
    assert (await app_client.post(
        "/api/credits/grant", headers=u, json={"user_id": "x", "amount": 9999}
    )).status_code == 403


@pytest.mark.asyncio
async def test_public_can_read_published_but_not_drafts(app_client, world):
    """Draft visibility is enforced server-side, not by client filtering."""
    a_id, admin_a = world["page_a"]["id"], world["admin_a"]
    await app_client.post(
        f"/api/pages/{a_id}/courses", headers=admin_a,
        json={"name": "Secret Draft Course", "status": "Draft"},
    )

    public = (await app_client.get(f"/api/pages/{a_id}/courses")).json()
    names = [c["name"] for c in public]
    assert "Secret Draft Course" not in names
    assert "A Physics" in names

    owner_view = (await app_client.get(f"/api/pages/{a_id}/courses", headers=admin_a)).json()
    assert "Secret Draft Course" in [c["name"] for c in owner_view]


@pytest.mark.asyncio
async def test_enquiry_is_visible_only_to_receiving_institute(app_client, world):
    a_id = world["page_a"]["id"]
    created = await app_client.post(f"/api/pages/{a_id}/enquiries", json={
        "name": "Prospective Student", "email": "prospect@example.com", "course_name": "A Physics",
    })
    assert created.status_code == 201

    seen_by_a = (await app_client.get(f"/api/pages/{a_id}/enquiries", headers=world["admin_a"])).json()
    assert any(e["email"] == "prospect@example.com" for e in seen_by_a)

    seen_by_b = (await app_client.get(
        f"/api/pages/{world['page_b']['id']}/enquiries", headers=world["admin_b"]
    )).json()
    assert all(e["email"] != "prospect@example.com" for e in seen_by_b)


@pytest.mark.asyncio
async def test_user_cannot_read_another_users_notifications(app_client, world):
    """Admin A got a 'you are now an admin' notification; B must not see it."""
    a_notifs = (await app_client.get("/api/notifications", headers=world["admin_a"])).json()
    assert len(a_notifs) >= 1
    b_notifs = (await app_client.get("/api/notifications", headers=world["admin_b"])).json()
    assert all(n["id"] != a_notifs[0]["id"] for n in b_notifs)

    r = await app_client.post(
        f"/api/notifications/{a_notifs[0]['id']}/read", headers=world["admin_b"]
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Main Admin
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_main_admin_can_manage_both_institutes(app_client, world):
    p = world["platform"]
    assert (await app_client.get(f"/api/pages/{world['page_a']['id']}", headers=p)).status_code == 200
    assert (await app_client.get(f"/api/pages/{world['page_b']['id']}", headers=p)).status_code == 200
    assert (await app_client.patch(
        f"/api/pages/{world['page_b']['id']}", headers=p, json={"tagline": "platform edit"}
    )).status_code == 200
    assert len((await app_client.get("/api/pages", headers=p)).json()) >= 2


@pytest.mark.asyncio
async def test_provisioning_endpoints_require_main_admin(app_client, world):
    """P0 fix: these were previously unauthenticated."""
    payload = {"name": "X", "email": f"x{uuid.uuid4().hex[:6]}@t.example.com", "password": "password123"}

    assert (await app_client.post("/api/register/mentor", json=payload)).status_code == 401
    assert (await app_client.post("/api/register/institute", json=payload)).status_code == 401
    assert (await app_client.post(
        "/api/register/mentor", headers=world["user"], json=payload
    )).status_code == 403
    assert (await app_client.post(
        "/api/register/institute", headers=world["admin_a"], json=payload
    )).status_code == 403
    assert (await app_client.post(
        "/api/register/mentor", headers=world["platform"], json=payload
    )).status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_requests_are_rejected(app_client, world):
    a_id = world["page_a"]["id"]
    assert (await app_client.get("/api/pages/mine")).status_code == 401
    assert (await app_client.post(f"/api/pages/{a_id}/courses", json={"name": "x"})).status_code == 401
    assert (await app_client.get("/api/notifications")).status_code == 401


# ---------------------------------------------------------------------------
# Follows and credits stay user-scoped
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_follow_is_scoped_to_the_authenticated_user(app_client, world):
    u, b_id = world["user"], world["page_b"]["id"]
    r = await app_client.post(f"/api/follows/{b_id}", headers=u)
    assert r.status_code == 201 and r.json()["is_following"] is True

    assert [p["id"] for p in (await app_client.get("/api/follows", headers=u)).json()] == [b_id]
    # Another user's follow list is unaffected — no endpoint accepts a user_id.
    assert (await app_client.get("/api/follows", headers=world["admin_a"])).json() == []

    r = await app_client.delete(f"/api/follows/{b_id}", headers=u)
    assert r.json()["is_following"] is False


@pytest.mark.asyncio
async def test_credit_ledger_derives_balance_and_blocks_overspend(app_client, world):
    platform, user_headers = world["platform"], world["user"]

    me = (await app_client.get("/api/credits/me", headers=user_headers)).json()
    assert me["balance"] == 0
    user_id = me["user_id"]

    granted = await app_client.post("/api/credits/grant", headers=platform, json={
        "user_id": user_id, "amount": 100, "reason": "grant", "description": "Welcome credits",
    })
    assert granted.status_code == 201
    assert granted.json()["balance_after"] == 100

    await app_client.post("/api/credits/grant", headers=platform, json={
        "user_id": user_id, "amount": -30, "reason": "unlock", "description": "Unlocked a profile",
    })

    after = (await app_client.get("/api/credits/me", headers=user_headers)).json()
    assert after["balance"] == 70
    assert len(after["transactions"]) == 2

    overspend = await app_client.post("/api/credits/grant", headers=platform, json={
        "user_id": user_id, "amount": -1000, "reason": "unlock",
    })
    assert overspend.status_code == 402
