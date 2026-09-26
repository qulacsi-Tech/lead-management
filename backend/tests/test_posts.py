"""
Member posts and replies.

The rules under test:
  * any signed-in member can post — a student included, with no page of their own;
  * an institute admin can reply as their institute, and ONLY their institute;
  * the post's author is notified of replies, but not of their own;
  * only the author (or a Main Admin) can delete a post; a reply can also be
    removed by the author of the post it is on.

Run:
    cd backend
    py -m pytest tests/ -v
"""

import pytest

from tests.test_isolation import app_client, world, login  # noqa: F401


async def make_post(client, headers, body="Looking for JEE coaching in Indore", kind="requirement"):
    resp = await client.post("/api/posts", headers=headers, json={"kind": kind, "body": body})
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.mark.asyncio
async def test_a_student_can_post_and_everyone_signed_in_sees_it(app_client, world):
    student, admin_a = world["user"], world["admin_a"]
    post = await make_post(app_client, student)
    assert post["author"]["name"] == "normal"
    assert post["kind"] == "requirement"
    assert post["can_delete"] is True
    # Nothing about the author beyond their public card.
    assert "email" not in post["author"]

    feed = (await app_client.get("/api/posts", headers=admin_a)).json()
    mine = next(p for p in feed if p["id"] == post["id"])
    assert mine["can_delete"] is False


@pytest.mark.asyncio
async def test_posts_need_a_session_and_valid_input(app_client, world):
    student = world["user"]
    assert (await app_client.get("/api/posts")).status_code == 401
    assert (await app_client.post("/api/posts", json={"body": "hi"})).status_code == 401
    assert (await app_client.post("/api/posts", headers=student, json={"kind": "advert", "body": "x"})).status_code == 422
    assert (await app_client.post("/api/posts", headers=student, json={"body": "   "})).status_code == 422


@pytest.mark.asyncio
async def test_like_is_idempotent(app_client, world):
    student, admin_b = world["user"], world["admin_b"]
    post = await make_post(app_client, student, kind="update", body="Cleared my 12th boards!")

    first = await app_client.post(f"/api/posts/{post['id']}/like", headers=admin_b)
    again = await app_client.post(f"/api/posts/{post['id']}/like", headers=admin_b)
    assert first.json()["likes_count"] == 1
    assert again.json()["likes_count"] == 1

    unliked = await app_client.delete(f"/api/posts/{post['id']}/like", headers=admin_b)
    assert unliked.json() == {"post_id": post["id"], "liked": False, "likes_count": 0}


@pytest.mark.asyncio
async def test_institute_admin_replies_as_their_institute_and_author_is_notified(app_client, world):
    student, admin_a, page_a = world["user"], world["admin_a"], world["page_a"]
    post = await make_post(app_client, student)

    reply = await app_client.post(
        f"/api/posts/{post['id']}/comments", headers=admin_a,
        json={"body": "We have a new JEE batch starting Monday.", "as_page_id": page_a["id"]},
    )
    assert reply.status_code == 201, reply.text
    assert reply.json()["page"]["name"] == "Institute A"
    assert reply.json()["page"]["public_path"].startswith("/")

    listed = (await app_client.get(f"/api/posts/{post['id']}/comments", headers=student)).json()
    assert [c["page"]["name"] for c in listed] == ["Institute A"]
    # The post's author may clear replies from their own thread.
    assert listed[0]["can_delete"] is True

    feed = (await app_client.get("/api/posts", headers=student)).json()
    assert next(p for p in feed if p["id"] == post["id"])["comments_count"] == 1

    notes = (await app_client.get("/api/notifications", headers=student)).json()
    assert any(n["type"] == "post_comment" and n["ref_id"] == post["id"] for n in notes)


@pytest.mark.asyncio
async def test_cannot_reply_as_someone_elses_institute(app_client, world):
    student, admin_b, platform, page_a = world["user"], world["admin_b"], world["platform"], world["page_a"]
    post = await make_post(app_client, student)

    for headers in (admin_b, student, platform):
        resp = await app_client.post(
            f"/api/posts/{post['id']}/comments", headers=headers,
            json={"body": "Pretending to be Institute A", "as_page_id": page_a["id"]},
        )
        assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_own_reply_does_not_notify_yourself(app_client, world):
    admin_b = world["admin_b"]
    post = await make_post(app_client, admin_b, kind="question", body="Best board for class 11?")
    before = len((await app_client.get("/api/notifications", headers=admin_b)).json())
    await app_client.post(f"/api/posts/{post['id']}/comments", headers=admin_b, json={"body": "Answering myself"})
    after = len((await app_client.get("/api/notifications", headers=admin_b)).json())
    assert after == before


@pytest.mark.asyncio
async def test_delete_permissions(app_client, world):
    student, admin_a, admin_b, platform = world["user"], world["admin_a"], world["admin_b"], world["platform"]
    post = await make_post(app_client, student)

    reply = (await app_client.post(
        f"/api/posts/{post['id']}/comments", headers=admin_a, json={"body": "A plain reply"},
    )).json()
    # A bystander can delete neither the post nor the reply.
    assert (await app_client.delete(f"/api/posts/{post['id']}", headers=admin_b)).status_code == 403
    assert (await app_client.delete(
        f"/api/posts/{post['id']}/comments/{reply['id']}", headers=admin_b,
    )).status_code == 403
    # The post's author can remove the reply from their thread.
    assert (await app_client.delete(
        f"/api/posts/{post['id']}/comments/{reply['id']}", headers=student,
    )).status_code == 204

    # A Main Admin can moderate any post.
    other = await make_post(app_client, admin_b, kind="update", body="Something to moderate")
    assert (await app_client.delete(f"/api/posts/{other['id']}", headers=platform)).status_code == 204
    assert (await app_client.delete(f"/api/posts/{post['id']}", headers=student)).status_code == 204
    assert (await app_client.get(f"/api/posts/{post['id']}/comments", headers=student)).status_code == 404
