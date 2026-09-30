"""
Per-level course hierarchy — Platform Admin -> Types & Categories.

The rule under test (client request, 30 Sep 2026): whatever is added, renamed
or removed under one level stays under that level only.

Run:
    cd backend
    py -m pytest tests/ -v
"""

import pytest

from tests.test_isolation import app_client, world, login  # noqa: F401

T = "/api/taxonomy"


async def add(client, headers, levels, category, subs=()):
    resp = await client.post(f"{T}/level-hierarchy/items", headers=headers, json={
        "levels": levels, "category": category, "subcategories": list(subs),
    })
    assert resp.status_code == 200, resp.text
    return resp.json()


@pytest.mark.asyncio
async def test_items_go_only_under_the_ticked_levels(app_client, world):
    platform = world["platform"]
    data = await add(app_client, platform, ["UG"], "B.Tech", ["CSE", "EEE"])
    data = await add(app_client, platform, ["PG", "Diploma"], "M.Tech", ["VLSI"])

    lh = data["level_hierarchy"]
    assert lh["UG"] == {"B.Tech": ["CSE", "EEE"]}
    assert lh["PG"] == {"M.Tech": ["VLSI"]}
    # A new level named in the request is created.
    assert "Diploma" in data["course_levels"] and lh["Diploma"] == {"M.Tech": ["VLSI"]}

    # Adding again merges branches rather than duplicating (case-insensitive).
    data = await add(app_client, platform, ["ug"], "b.tech", ["cse", "Civil"])
    assert data["level_hierarchy"]["UG"] == {"B.Tech": ["CSE", "EEE", "Civil"]}


@pytest.mark.asyncio
async def test_renames_and_deletes_touch_one_level(app_client, world):
    platform = world["platform"]
    await add(app_client, platform, ["UG", "PG"], "Science", ["Physics"])

    resp = await app_client.patch(f"{T}/level-hierarchy/category", headers=platform, json={
        "level": "UG", "category": "Science", "new_name": "B.Sc",
    })
    assert resp.status_code == 200, resp.text
    lh = resp.json()["level_hierarchy"]
    assert "B.Sc" in lh["UG"] and "Science" not in lh["UG"]
    assert "Science" in lh["PG"]  # untouched

    resp = await app_client.patch(f"{T}/level-hierarchy/subcategory", headers=platform, json={
        "level": "PG", "category": "Science", "subcategory": "Physics", "new_name": "Astrophysics",
    })
    assert resp.json()["level_hierarchy"]["PG"]["Science"] == ["Astrophysics"]
    assert resp.json()["level_hierarchy"]["UG"]["B.Sc"] == ["Physics"]

    resp = await app_client.delete(f"{T}/level-hierarchy/category", headers=platform,
                                   params={"level": "PG", "category": "Science"})
    assert "Science" not in resp.json()["level_hierarchy"]["PG"]
    assert "B.Sc" in resp.json()["level_hierarchy"]["UG"]


@pytest.mark.asyncio
async def test_rename_level_and_collisions(app_client, world):
    platform = world["platform"]
    await add(app_client, platform, ["Foundation"], "Bridge", ["Maths"])
    await add(app_client, platform, ["Foundation"], "Olympiad")

    resp = await app_client.patch(f"{T}/level-hierarchy/level", headers=platform, json={
        "level": "Foundation", "new_name": "Pre-University",
    })
    data = resp.json()
    assert "Pre-University" in data["course_levels"] and "Foundation" not in data["course_levels"]
    assert data["level_hierarchy"]["Pre-University"]["Bridge"] == ["Maths"]

    # Names already taken within the level are refused.
    assert (await app_client.patch(f"{T}/level-hierarchy/category", headers=platform, json={
        "level": "Pre-University", "category": "Bridge", "new_name": "olympiad",
    })).status_code == 409
    assert (await app_client.post(f"{T}/level-hierarchy/subcategory", headers=platform, json={
        "level": "Pre-University", "category": "Bridge", "subcategory": "maths",
    })).status_code == 409
    assert (await app_client.patch(f"{T}/level-hierarchy/category", headers=platform, json={
        "level": "Nope", "category": "Bridge", "new_name": "X",
    })).status_code == 404


@pytest.mark.asyncio
async def test_deleting_a_level_drops_its_items_and_writes_need_main_admin(app_client, world):
    platform, admin_a = world["platform"], world["admin_a"]
    await add(app_client, platform, ["Certificate"], "Tally", ["GST"])
    resp = await app_client.delete(f"{T}/level", headers=platform, params={"level": "Certificate"})
    assert "Certificate" not in resp.json()["level_hierarchy"]

    assert (await app_client.post(f"{T}/level-hierarchy/items", headers=admin_a, json={
        "levels": ["UG"], "category": "Nope",
    })).status_code == 403
    assert (await app_client.get(T)).status_code == 200  # public read


# ---------------------------------------------------------------------------
# Serviced locations and affiliations
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_locations_add_rename_delete(app_client, world):
    platform, admin_a = world["platform"], world["admin_a"]
    resp = await app_client.post(f"{T}/locations", headers=platform, json={"name": "  Raipur "})
    assert resp.status_code == 200, resp.text
    assert "Raipur" in resp.json()["locations"]
    assert (await app_client.post(f"{T}/locations", headers=platform, json={"name": "raipur"})).status_code == 409

    resp = await app_client.patch(f"{T}/locations", headers=platform, json={"name": "Raipur", "new_name": "Nava Raipur"})
    locs = resp.json()["locations"]
    assert "Nava Raipur" in locs and "Raipur" not in locs
    # Renaming onto an existing entry is refused.
    assert (await app_client.patch(f"{T}/locations", headers=platform, json={
        "name": "Nava Raipur", "new_name": "Indore",
    })).status_code == 409

    resp = await app_client.delete(f"{T}/locations", headers=platform, params={"name": "nava raipur"})
    assert "Nava Raipur" not in resp.json()["locations"]
    assert (await app_client.post(f"{T}/locations", headers=admin_a, json={"name": "X"})).status_code == 403


@pytest.mark.asyncio
async def test_affiliations_are_per_institute_type(app_client, world):
    platform = world["platform"]
    resp = await app_client.post(f"{T}/affiliations", headers=platform, json={
        "institute_type": "Coaching", "name": "ISO 9001",
    })
    assert resp.status_code == 200, resp.text
    aff = resp.json()["affiliations"]
    assert aff["Coaching"] == ["ISO 9001"]
    assert "ISO 9001" not in aff["School"]

    resp = await app_client.patch(f"{T}/affiliations", headers=platform, json={
        "institute_type": "School", "name": "CBSE", "new_name": "CBSE (Central Board)",
    })
    assert "CBSE (Central Board)" in resp.json()["affiliations"]["School"]

    resp = await app_client.delete(f"{T}/affiliations", headers=platform,
                                   params={"institute_type": "Coaching", "name": "ISO 9001"})
    assert resp.json()["affiliations"]["Coaching"] == []
    assert (await app_client.post(f"{T}/affiliations", headers=platform, json={
        "institute_type": "Hospital", "name": "NABH",
    })).status_code == 422
