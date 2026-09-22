"""
Applying to an admission notice or a job vacancy.

The requirement behind this endpoint (client feedback 22 Sep 2026, row 5):

    "When the user clicks on 'Apply' we should not redirect them to any other
    page — our task is to ensure that if the user is new they should be able to
    create their profile here itself."

So applying has to mint an account for a visitor who has none. That is an
unauthenticated endpoint that creates users, which makes three things worth
pinning down:

  - it really does work without redirecting (a token comes back, so the client
    never has to send them to /signup),
  - it cannot be used to apply *as* an existing account without that account's
    password, and
  - the resulting applications stay inside the institute they were sent to,
    like every other page-scoped resource.

Reuses the module-scoped fixtures from test_isolation so the two institutes and
their admins are set up once.

Run:
    cd backend
    py -m pytest tests/ -v
"""

import pytest

from tests.test_isolation import app_client, world, login  # noqa: F401


async def make_published_opportunity(client, headers, page_id, type_="job", title="We Are Hiring"):
    created = await client.post(
        f"/api/pages/{page_id}/opportunities",
        headers=headers,
        json={"type": type_, "title": title, "status": "Published"},
    )
    assert created.status_code == 201, created.text
    return created.json()


# ---------------------------------------------------------------------------
# The requirement: no redirect, profile created inline
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_a_new_visitor_applies_and_gets_an_account_in_one_request(app_client, world):
    """The whole point of row 5: no /signup detour."""
    op = await make_published_opportunity(app_client, world["admin_a"], world["page_a"]["id"])

    res = await app_client.post(
        f"/api/opportunities/{op['id']}/applications",
        json={
            "name": "Brand New Applicant",
            "email": "brand.new@applicant.example.com",
            "password": "secret123",
            "phone": "9876500000",
            "qualification": "Coaching Faculty",
            "experience": "4 years",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()

    assert body["account_created"] is True
    # A token and a user come back, so the client can sign them in where they
    # stand rather than navigating anywhere.
    assert body["access_token"]
    assert body["user"]["email"] == "brand.new@applicant.example.com"
    assert body["application"]["name"] == "Brand New Applicant"

    # And that token is a real session.
    me = await app_client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == "brand.new@applicant.example.com"


@pytest.mark.asyncio
async def test_a_signed_in_user_applies_without_resupplying_anything(app_client, world):
    op = await make_published_opportunity(
        app_client, world["admin_a"], world["page_a"]["id"], title="Join Our Teaching Team"
    )

    res = await app_client.post(
        f"/api/opportunities/{op['id']}/applications", headers=world["user"], json={}
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["account_created"] is False
    # No second account, and no token — they already have a session.
    assert body["access_token"] is None
    assert body["application"]["email"]


# ---------------------------------------------------------------------------
# What applying must NOT let you do
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_applying_cannot_impersonate_an_existing_account(app_client, world):
    """An email that already has an account must not be applied-as anonymously.

    Without this, anyone could file applications in someone else's name by
    typing their email — and, worse, the inline-signup path would be a way to
    discover-and-use an address. 409 sends the client to sign in instead.
    """
    op = await make_published_opportunity(
        app_client, world["admin_a"], world["page_a"]["id"], title="Faculty Vacancy"
    )

    res = await app_client.post(
        f"/api/opportunities/{op['id']}/applications",
        json={
            "name": "Not Really Them",
            "email": "normal@user.example.com",   # already exists, see test_isolation
            "password": "secret123",
        },
    )
    assert res.status_code == 409, res.text
    assert "sign in" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_the_same_person_cannot_apply_twice(app_client, world):
    op = await make_published_opportunity(
        app_client, world["admin_a"], world["page_a"]["id"], title="Career Opportunity for Educators"
    )

    first = await app_client.post(
        f"/api/opportunities/{op['id']}/applications", headers=world["user"], json={}
    )
    assert first.status_code == 201

    second = await app_client.post(
        f"/api/opportunities/{op['id']}/applications", headers=world["user"], json={}
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_a_draft_opportunity_does_not_accept_applications(app_client, world):
    """A Draft is not something a visitor could have been looking at."""
    created = await app_client.post(
        f"/api/pages/{world['page_a']['id']}/opportunities",
        headers=world["admin_a"],
        json={"type": "admission", "title": "Admissions Open — Apply Now", "status": "Draft"},
    )
    assert created.status_code == 201
    op = created.json()

    res = await app_client.post(
        f"/api/opportunities/{op['id']}/applications", headers=world["user"], json={}
    )
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# Applications are institute-scoped, like every other page resource
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_institute_b_cannot_read_institute_a_applications(app_client, world):
    op = await make_published_opportunity(
        app_client, world["admin_a"], world["page_a"]["id"], title="Hiring Qualified Subject Experts"
    )
    applied = await app_client.post(
        f"/api/opportunities/{op['id']}/applications", headers=world["user"], json={}
    )
    assert applied.status_code == 201

    mine = await app_client.get(
        f"/api/pages/{world['page_a']['id']}/applications", headers=world["admin_a"]
    )
    assert mine.status_code == 200
    assert any(a["opportunity_id"] == op["id"] for a in mine.json())

    theirs = await app_client.get(
        f"/api/pages/{world['page_a']['id']}/applications", headers=world["admin_b"]
    )
    assert theirs.status_code in (403, 404)


@pytest.mark.asyncio
async def test_an_applicant_cannot_read_the_institutes_inbox(app_client, world):
    r = await app_client.get(
        f"/api/pages/{world['page_a']['id']}/applications", headers=world["user"]
    )
    assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_mine_tells_an_applicant_whether_they_already_applied(app_client, world):
    """Drives the "Applied" state on the public page's button."""
    op = await make_published_opportunity(
        app_client, world["admin_a"], world["page_a"]["id"], title="Multiple Teaching Positions Open"
    )

    before = await app_client.get(
        f"/api/opportunities/{op['id']}/applications/mine", headers=world["user"]
    )
    assert before.status_code == 200
    assert before.json() is None

    await app_client.post(
        f"/api/opportunities/{op['id']}/applications", headers=world["user"], json={}
    )

    after = await app_client.get(
        f"/api/opportunities/{op['id']}/applications/mine", headers=world["user"]
    )
    assert after.status_code == 200
    assert after.json()["opportunity_id"] == op["id"]

    # An anonymous caller is simply "not applied", never an error.
    anon = await app_client.get(f"/api/opportunities/{op['id']}/applications/mine")
    assert anon.status_code == 200
    assert anon.json() is None
