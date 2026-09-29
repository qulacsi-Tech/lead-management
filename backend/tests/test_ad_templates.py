"""
Ad description templates — PLATFORM-owned, so the rule under test is that any
signed-in user can read the list and only a Main Admin can change it.

Run:
    cd backend
    py -m pytest tests/ -v
"""

import pytest

from tests.test_isolation import app_client, world, login  # noqa: F401

BASE = "/api/ad-templates/descriptions"


@pytest.mark.asyncio
async def test_main_admin_manages_templates(app_client, world):
    platform = world["platform"]

    first = await app_client.post(BASE, headers=platform, json={
        "section": "job", "text": "  {name} is hiring.  \n\n  Apply below.  ",
    })
    assert first.status_code == 201, first.text
    # Collapsed to one line — an ad stores its chosen lines newline-separated.
    assert first.json()["text"] == "{name} is hiring. Apply below."

    second = await app_client.post(BASE, headers=platform, json={"section": "job", "text": "Second one"})
    assert second.json()["sort_order"] == first.json()["sort_order"] + 1

    tid = first.json()["id"]
    edited = await app_client.patch(f"{BASE}/{tid}", headers=platform, json={"text": "Edited text"})
    assert edited.status_code == 200, edited.text
    assert edited.json()["text"] == "Edited text"

    listed = (await app_client.get(BASE, params={"section": "job"}, headers=platform)).json()
    assert [t["text"] for t in listed] == ["Edited text", "Second one"]

    assert (await app_client.delete(f"{BASE}/{tid}", headers=platform)).status_code == 204
    listed = (await app_client.get(BASE, params={"section": "job"}, headers=platform)).json()
    assert [t["text"] for t in listed] == ["Second one"]


@pytest.mark.asyncio
async def test_page_admin_can_read_but_not_write(app_client, world):
    platform, admin_a = world["platform"], world["admin_a"]
    created = (await app_client.post(BASE, headers=platform, json={
        "section": "admission", "text": "Admissions open at {name}.",
    })).json()

    listed = await app_client.get(BASE, params={"section": "admission"}, headers=admin_a)
    assert listed.status_code == 200
    assert any(t["id"] == created["id"] for t in listed.json())

    assert (await app_client.post(BASE, headers=admin_a, json={
        "section": "admission", "text": "Mine",
    })).status_code == 403
    assert (await app_client.patch(
        f"{BASE}/{created['id']}", headers=admin_a, json={"text": "Changed"}
    )).status_code == 403
    assert (await app_client.delete(f"{BASE}/{created['id']}", headers=admin_a)).status_code == 403


@pytest.mark.asyncio
async def test_anonymous_cannot_read(app_client, world):
    assert (await app_client.get(BASE)).status_code == 401


@pytest.mark.asyncio
async def test_rejects_bad_section_duplicate_and_blank(app_client, world):
    platform = world["platform"]
    assert (await app_client.post(BASE, headers=platform, json={
        "section": "course", "text": "x",
    })).status_code == 422

    ok = await app_client.post(BASE, headers=platform, json={"section": "paper", "text": "Free PDF."})
    assert ok.status_code == 201
    assert (await app_client.post(BASE, headers=platform, json={
        "section": "paper", "text": "Free PDF.",
    })).status_code == 409

    assert (await app_client.post(BASE, headers=platform, json={
        "section": "paper", "text": "  \n  ",
    })).status_code == 422


# ---------------------------------------------------------------------------
# Groups inside an ad type
# ---------------------------------------------------------------------------

GROUPS = "/api/ad-templates/groups"


@pytest.mark.asyncio
async def test_groups_hold_lines_and_deleting_one_moves_them_to_general(app_client, world):
    platform = world["platform"]
    group = await app_client.post(GROUPS, headers=platform, json={"section": "job", "name": "  Non   teaching "})
    assert group.status_code == 201, group.text
    assert group.json()["name"] == "Non teaching"
    gid = group.json()["id"]

    line = await app_client.post(BASE, headers=platform, json={
        "section": "job", "text": "Office staff wanted.", "group_id": gid,
    })
    assert line.status_code == 201, line.text
    assert line.json()["group_id"] == gid

    listed = (await app_client.get(GROUPS, params={"section": "job"}, headers=platform)).json()
    assert [g["name"] for g in listed] == ["Non teaching"]

    renamed = await app_client.patch(f"{GROUPS}/{gid}", headers=platform, json={"name": "Admin staff"})
    assert renamed.json()["name"] == "Admin staff"

    assert (await app_client.delete(f"{GROUPS}/{gid}", headers=platform)).status_code == 204
    lines = (await app_client.get(BASE, params={"section": "job"}, headers=platform)).json()
    moved = next(t for t in lines if t["id"] == line.json()["id"])
    assert moved["group_id"] is None


@pytest.mark.asyncio
async def test_group_rules(app_client, world):
    platform, admin_a = world["platform"], world["admin_a"]
    paper_group = (await app_client.post(GROUPS, headers=platform, json={"section": "paper", "name": "Class 12"})).json()

    # A line cannot join another ad type's group, on create or on move.
    assert (await app_client.post(BASE, headers=platform, json={
        "section": "admission", "text": "Wrong group", "group_id": paper_group["id"],
    })).status_code == 422
    own = (await app_client.post(BASE, headers=platform, json={"section": "admission", "text": "Right place"})).json()
    assert (await app_client.patch(f"{BASE}/{own['id']}", headers=platform, json={
        "group_id": paper_group["id"],
    })).status_code == 422

    # Names are unique per ad type (case-insensitive), and "General" is reserved.
    assert (await app_client.post(GROUPS, headers=platform, json={"section": "paper", "name": "class 12"})).status_code == 409
    assert (await app_client.post(GROUPS, headers=platform, json={"section": "paper", "name": "General"})).status_code == 409
    assert (await app_client.post(GROUPS, headers=platform, json={"section": "job", "name": "Class 12"})).status_code == 201

    # Readable by a page admin, writable only by the Main Admin.
    assert (await app_client.get(GROUPS, headers=admin_a)).status_code == 200
    assert (await app_client.post(GROUPS, headers=admin_a, json={"section": "job", "name": "Mine"})).status_code == 403
    assert (await app_client.delete(f"{GROUPS}/{paper_group['id']}", headers=admin_a)).status_code == 403
