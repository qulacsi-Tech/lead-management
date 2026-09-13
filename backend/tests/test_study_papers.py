"""
Guess paper / study material tests.

The isolation rules here are the same ones courses and opportunities already
have, and they are covered. What is specific to this feature — and the reason
this file exists separately — is the client's privacy requirement:

    "download karne wali ki information uske pass nahi jaye"
    (the downloader's information must not reach them)

`test_page_admin_never_learns_who_downloaded` and
`test_no_endpoint_exposes_a_download_row` are that requirement written down. If
someone later adds a `downloaded_by` field to StudyPaperResponse, or a
/pages/{id}/papers/{id}/downloads listing, those two fail.

Reuses the module-scoped fixtures from test_isolation so the two institutes and
their admins are set up once.

Run:
    cd backend
    py -m pytest tests/ -v
"""

import io

import pytest

from tests.test_isolation import app_client, world, login  # noqa: F401


def pdf_bytes() -> bytes:
    """Smallest thing that passes an `application/pdf` content-type check."""
    return b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"


def pdf_upload(name: str = "guess-paper.pdf"):
    return {"file": (name, io.BytesIO(pdf_bytes()), "application/pdf")}


async def make_published_paper(client, headers, page_id, title="Physics Class 12"):
    """Create → attach file → publish, the order the API requires."""
    created = await client.post(
        f"/api/pages/{page_id}/papers",
        headers=headers,
        json={"title": title, "kind": "Guess Paper", "subject": "Physics", "class_level": "Class 12"},
    )
    assert created.status_code == 201, created.text
    paper = created.json()

    uploaded = await client.post(
        f"/api/pages/{page_id}/papers/{paper['id']}/file", headers=headers, files=pdf_upload()
    )
    assert uploaded.status_code == 200, uploaded.text

    published = await client.patch(
        f"/api/pages/{page_id}/papers/{paper['id']}", headers=headers, json={"status": "Published"}
    )
    assert published.status_code == 200, published.text
    return published.json()


# ---------------------------------------------------------------------------
# The privacy contract
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_page_admin_never_learns_who_downloaded(app_client, world):
    """The institute sees the count move and nothing else."""
    admin_a, page_a, reader = world["admin_a"], world["page_a"], world["user"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"])

    before = (await app_client.get(f"/api/pages/{page_a['id']}/papers", headers=admin_a)).json()[0]
    assert before["downloads_count"] == 0

    dl = await app_client.post(f"/api/papers/{paper['id']}/download", headers=reader)
    assert dl.status_code == 200, dl.text
    assert dl.json()["downloads_count"] == 1

    after = (await app_client.get(f"/api/pages/{page_a['id']}/papers", headers=admin_a)).json()[0]
    assert after["downloads_count"] == 1

    # Nothing in the admin's view identifies the reader. Checked against the
    # serialized payload rather than a field list, so a nested object added
    # later is caught too.
    # No value anywhere in the payload identifies the reader. Checked against
    # the serialized blob rather than a field list, so a nested object added
    # later is caught too.
    assert "normal@user.example.com" not in str(after).lower()

    # And no key that could carry one. `downloads_count` is the aggregate and
    # is deliberately not in this list.
    for leak in ("user_id", "downloaded_by", "downloader", "downloaders", "email", "phone"):
        assert leak not in after, f"{leak} must not be exposed to the page admin"


@pytest.mark.asyncio
async def test_no_endpoint_exposes_a_download_row(app_client, world):
    """There is no route that lists a paper's downloaders — by design."""
    admin_a, page_a = world["admin_a"], world["page_a"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"], title="Leak Probe")

    for path in (
        f"/api/pages/{page_a['id']}/papers/{paper['id']}/downloads",
        f"/api/papers/{paper['id']}/downloads",
        f"/api/pages/{page_a['id']}/papers/downloads",
    ):
        r = await app_client.get(path, headers=admin_a)
        # 404 (no such route) or 405 (the path collides with PATCH
        # /papers/{paper_id} and there is no GET on it) are both fine. What
        # matters is that no listing ever succeeds.
        assert r.status_code in (404, 405), f"{path} returned {r.status_code}"


@pytest.mark.asyncio
async def test_download_is_not_an_enquiry(app_client, world):
    """A download must not create a lead — that is the whole distinction from
    the enquiry form."""
    admin_a, page_a, reader = world["admin_a"], world["page_a"], world["user"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"], title="No Lead Paper")

    before = len((await app_client.get(f"/api/pages/{page_a['id']}/enquiries", headers=admin_a)).json())
    await app_client.post(f"/api/papers/{paper['id']}/download", headers=reader)
    after = (await app_client.get(f"/api/pages/{page_a['id']}/enquiries", headers=admin_a)).json()

    assert len(after) == before


# ---------------------------------------------------------------------------
# Counting
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_download_requires_sign_in(app_client, world):
    admin_a, page_a = world["admin_a"], world["page_a"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"], title="Auth Required")

    r = await app_client.post(f"/api/papers/{paper['id']}/download")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_repeat_download_by_same_account_does_not_inflate_the_count(app_client, world):
    """The count is people, not clicks."""
    admin_a, page_a, reader = world["admin_a"], world["page_a"], world["user"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"], title="Repeat Paper")

    first = await app_client.post(f"/api/papers/{paper['id']}/download", headers=reader)
    second = await app_client.post(f"/api/papers/{paper['id']}/download", headers=reader)
    third = await app_client.post(f"/api/papers/{paper['id']}/download", headers=reader)

    assert first.json()["downloads_count"] == 1
    assert second.json()["downloads_count"] == 1
    assert third.json()["downloads_count"] == 1
    # The reader still gets the file every time.
    assert third.json()["file_url"]


@pytest.mark.asyncio
async def test_two_accounts_each_count_once(app_client, world):
    admin_a, page_a = world["admin_a"], world["page_a"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"], title="Two Readers")

    await app_client.post(f"/api/papers/{paper['id']}/download", headers=world["user"])
    second = await app_client.post(f"/api/papers/{paper['id']}/download", headers=world["admin_b"])

    assert second.json()["downloads_count"] == 2


@pytest.mark.asyncio
async def test_downloaded_by_me_is_per_caller(app_client, world):
    admin_a, page_a, reader = world["admin_a"], world["page_a"], world["user"]
    paper = await make_published_paper(app_client, admin_a, page_a["id"], title="Mine Flag")

    await app_client.post(f"/api/papers/{paper['id']}/download", headers=reader)

    mine = (await app_client.get(f"/api/papers?page_id={page_a['id']}", headers=reader)).json()
    assert [p["downloaded_by_me"] for p in mine if p["id"] == paper["id"]] == [True]

    # The admin has not downloaded it, so their own flag stays False — this is
    # "did I", never "who did".
    theirs = (await app_client.get(f"/api/papers?page_id={page_a['id']}", headers=admin_a)).json()
    assert [p["downloaded_by_me"] for p in theirs if p["id"] == paper["id"]] == [False]


# ---------------------------------------------------------------------------
# Publish gating
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cannot_publish_a_paper_with_no_file(app_client, world):
    admin_a, page_a = world["admin_a"], world["page_a"]

    direct = await app_client.post(
        f"/api/pages/{page_a['id']}/papers",
        headers=admin_a,
        json={"title": "Fileless", "status": "Published"},
    )
    assert direct.status_code == 422

    draft = (await app_client.post(
        f"/api/pages/{page_a['id']}/papers", headers=admin_a, json={"title": "Fileless Two"}
    )).json()
    promote = await app_client.patch(
        f"/api/pages/{page_a['id']}/papers/{draft['id']}", headers=admin_a,
        json={"status": "Published"},
    )
    assert promote.status_code == 422


@pytest.mark.asyncio
async def test_non_pdf_upload_is_rejected(app_client, world):
    admin_a, page_a = world["admin_a"], world["page_a"]
    draft = (await app_client.post(
        f"/api/pages/{page_a['id']}/papers", headers=admin_a, json={"title": "Wrong Type"}
    )).json()

    r = await app_client.post(
        f"/api/pages/{page_a['id']}/papers/{draft['id']}/file",
        headers=admin_a,
        files={"file": ("sneaky.html", io.BytesIO(b"<script>"), "text/html")},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_drafts_are_hidden_from_the_public(app_client, world):
    admin_a, page_a = world["admin_a"], world["page_a"]
    draft = (await app_client.post(
        f"/api/pages/{page_a['id']}/papers", headers=admin_a, json={"title": "Secret Draft"}
    )).json()

    anon = (await app_client.get(f"/api/pages/{page_a['id']}/papers")).json()
    assert draft["id"] not in [p["id"] for p in anon]

    owner = (await app_client.get(f"/api/pages/{page_a['id']}/papers", headers=admin_a)).json()
    assert draft["id"] in [p["id"] for p in owner]


@pytest.mark.asyncio
async def test_unpublished_paper_cannot_be_downloaded(app_client, world):
    admin_a, page_a, reader = world["admin_a"], world["page_a"], world["user"]
    draft = (await app_client.post(
        f"/api/pages/{page_a['id']}/papers", headers=admin_a, json={"title": "Not Yet"}
    )).json()

    r = await app_client.post(f"/api/papers/{draft['id']}/download", headers=reader)
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Tenant isolation, same rules as courses and opportunities
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_b_cannot_upload_to_institute_a(app_client, world):
    r = await app_client.post(
        f"/api/pages/{world['page_a']['id']}/papers",
        headers=world["admin_b"],
        json={"title": "Planted"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_cannot_edit_a_paper_belonging_to_another_page(app_client, world):
    """The confused-deputy case: a page I do administer paired with a paper I
    do not own. Must 404, not silently edit the other institute's row."""
    admin_a, admin_b = world["admin_a"], world["admin_b"]
    theirs = await make_published_paper(
        app_client, admin_b, world["page_b"]["id"], title="B's Paper"
    )

    r = await app_client.patch(
        f"/api/pages/{world['page_a']['id']}/papers/{theirs['id']}",
        headers=admin_a,
        json={"title": "hijacked"},
    )
    assert r.status_code == 404

    delete = await app_client.delete(
        f"/api/pages/{world['page_a']['id']}/papers/{theirs['id']}", headers=admin_a
    )
    assert delete.status_code == 404


@pytest.mark.asyncio
async def test_a_plain_user_cannot_upload(app_client, world):
    r = await app_client.post(
        f"/api/pages/{world['page_a']['id']}/papers",
        headers=world["user"],
        json={"title": "Not mine"},
    )
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# Crawlable surface
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_seo_body_lists_published_papers_but_never_drafts(app_client, world):
    """The server-rendered body is what a crawler sees before any JS runs.

    Published papers belong in it — "physics class 12 guess paper" is a real
    search route to an institute. A draft in it would publish something the
    admin has not published.
    """
    from routers.seo import build_head_and_body
    from core.urls import page_public_path
    from tests.test_isolation import TestSession

    admin_a, page_a = world["admin_a"], world["page_a"]
    await make_published_paper(app_client, admin_a, page_a["id"], title="Crawlable Physics Paper")
    await app_client.post(
        f"/api/pages/{page_a['id']}/papers", headers=admin_a, json={"title": "Unpublished Draft Paper"}
    )

    stub = type("P", (), {"type": page_a["type"], "slug": page_a["slug"], "city": page_a.get("city")})()
    async with TestSession() as db:
        _meta, body, status = await build_head_and_body(page_public_path(stub), db)

    assert status == 200
    assert "Guess Papers" in body
    assert "Crawlable Physics Paper" in body
    assert "Unpublished Draft Paper" not in body


# ---------------------------------------------------------------------------
# Ad visibility: this institute only, or every institute page
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_visibility_defaults_to_page(app_client, world):
    """The default must match how ads behaved before the toggle existed."""
    paper = await make_published_paper(
        app_client, world["admin_a"], world["page_a"]["id"], title="Default Scope"
    )
    assert paper["visibility"] == "page"


@pytest.mark.asyncio
async def test_page_admin_cannot_promote_themselves_platform_wide(app_client, world):
    """Running on every institute's page is inventory the platform sells. An
    institute admin granting it to themselves would be free advertising on
    every competitor's page."""
    admin_a, page_a = world["admin_a"], world["page_a"]

    create = await app_client.post(
        f"/api/pages/{page_a['id']}/papers",
        headers=admin_a,
        json={"title": "Self Promoted", "visibility": "platform"},
    )
    assert create.status_code == 403

    draft = (await app_client.post(
        f"/api/pages/{page_a['id']}/papers", headers=admin_a, json={"title": "Escalation Probe"}
    )).json()
    patch = await app_client.patch(
        f"/api/pages/{page_a['id']}/papers/{draft['id']}",
        headers=admin_a,
        json={"visibility": "platform"},
    )
    assert patch.status_code == 403

    # And the same for a vacancy.
    opp = await app_client.post(
        f"/api/pages/{page_a['id']}/opportunities",
        headers=admin_a,
        json={"type": "job", "title": "Self Promoted Job", "visibility": "platform"},
    )
    assert opp.status_code == 403


@pytest.mark.asyncio
async def test_main_admin_can_set_platform_wide(app_client, world):
    platform, page_a = world["platform"], world["page_a"]

    paper = (await app_client.post(
        f"/api/pages/{page_a['id']}/papers",
        headers=platform,
        json={"title": "Platform Wide Paper", "visibility": "platform"},
    )).json()
    assert paper["visibility"] == "platform"

    opp = (await app_client.post(
        f"/api/pages/{page_a['id']}/opportunities",
        headers=platform,
        json={"type": "job", "title": "Platform Wide Job", "visibility": "platform"},
    )).json()
    assert opp["visibility"] == "platform"


@pytest.mark.asyncio
async def test_invalid_visibility_is_rejected(app_client, world):
    r = await app_client.post(
        f"/api/pages/{world['page_a']['id']}/papers",
        headers=world["platform"],
        json={"title": "Bad Scope", "visibility": "everywhere"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_platform_filter_selects_only_cleared_ads(app_client, world):
    """What the sponsored rail asks for: platform-wide ads, minus the page
    doing the asking."""
    platform, page_a, page_b = world["platform"], world["page_a"], world["page_b"]

    wide = (await app_client.post(
        f"/api/pages/{page_b['id']}/opportunities",
        headers=platform,
        json={"type": "job", "title": "B Wide Vacancy", "status": "Published", "visibility": "platform"},
    )).json()
    narrow = (await app_client.post(
        f"/api/pages/{page_b['id']}/opportunities",
        headers=platform,
        json={"type": "job", "title": "B Narrow Vacancy", "status": "Published"},
    )).json()

    rail = (await app_client.get(
        f"/api/opportunities?visibility=platform&exclude_page_id={page_a['id']}"
    )).json()
    ids = [o["id"] for o in rail]

    assert wide["id"] in ids
    assert narrow["id"] not in ids, "a page-scoped ad must never run on another institute"


@pytest.mark.asyncio
async def test_exclude_page_id_drops_the_asking_page(app_client, world):
    """A page advertising to its own visitors is just its Opportunities
    section again."""
    platform, page_a = world["platform"], world["page_a"]

    own = (await app_client.post(
        f"/api/pages/{page_a['id']}/opportunities",
        headers=platform,
        json={"type": "job", "title": "A Own Wide Vacancy", "status": "Published", "visibility": "platform"},
    )).json()

    on_own_page = (await app_client.get(
        f"/api/opportunities?visibility=platform&exclude_page_id={page_a['id']}"
    )).json()
    assert own["id"] not in [o["id"] for o in on_own_page]

    elsewhere = (await app_client.get(
        f"/api/opportunities?visibility=platform&exclude_page_id={world['page_b']['id']}"
    )).json()
    assert own["id"] in [o["id"] for o in elsewhere]
