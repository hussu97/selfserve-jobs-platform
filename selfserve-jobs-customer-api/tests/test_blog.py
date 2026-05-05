"""Tests for blog public endpoints and admin blog management endpoints."""

import os

os.environ.setdefault("ADMIN_EMAILS", "admin@example.com")

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select

from app.models.auth_session import AuthSession
from app.models.blog_post import BlogPost
from app.services.code_generator import generate_code


ADMIN_TOKEN = "admin-blog-test-token"
ADMIN_EMAIL = "admin@example.com"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _make_admin_session(db_session) -> AuthSession:
    session = AuthSession(
        session_token=ADMIN_TOKEN,
        email=ADMIN_EMAIL,
        user_type="admin",
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    db_session.add(session)
    await db_session.flush()
    return session


async def _make_blog_post(db_session, *, title: str = "Test Post", status: str = "published", slug: str | None = None) -> BlogPost:
    post = BlogPost(
        post_code=generate_code(12),
        title=title,
        slug=slug or title.lower().replace(" ", "-"),
        excerpt="A test excerpt for the blog post.",
        content="## Introduction\n\nThis is test content.",
        author="Test Author",
        tags=["test", "uae"],
        status=status,
        reading_minutes=2,
        view_count=0,
        link_click_count=0,
    )
    db_session.add(post)
    await db_session.flush()
    return post


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_blog_posts_empty(client):
    resp = await client.get("/api/v1/blog/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_blog_posts_only_published(client, db_session):
    await _make_blog_post(db_session, title="Draft Post", status="draft", slug="draft-post")
    await _make_blog_post(db_session, title="Archived Post", status="archived", slug="archived-post")
    await _make_blog_post(db_session, title="Published Post", status="published", slug="published-post")
    await db_session.commit()

    resp = await client.get("/api/v1/blog/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Published Post"


@pytest.mark.asyncio
async def test_list_blog_posts_search(client, db_session):
    await _make_blog_post(db_session, title="Dubai Jobs Guide", status="published", slug="dubai-jobs-guide")
    await _make_blog_post(db_session, title="Abu Dhabi Tech Scene", status="published", slug="abudhabi-tech")
    await db_session.commit()

    resp = await client.get("/api/v1/blog/posts?search=Dubai")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Dubai Jobs Guide"


@pytest.mark.asyncio
async def test_get_blog_post_by_slug(client, db_session):
    post = await _make_blog_post(db_session, title="UAE Visa Tips", status="published", slug="uae-visa-tips")
    await db_session.commit()

    resp = await client.get("/api/v1/blog/posts/uae-visa-tips")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "uae-visa-tips"
    assert data["title"] == "UAE Visa Tips"
    assert "content" in data


@pytest.mark.asyncio
async def test_get_blog_post_draft_returns_404(client, db_session):
    await _make_blog_post(db_session, title="Hidden Draft", status="draft", slug="hidden-draft")
    await db_session.commit()

    resp = await client.get("/api/v1/blog/posts/hidden-draft")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_track_view(client, db_session):
    post = await _make_blog_post(db_session, title="Track View Post", status="published", slug="track-view-post")
    await db_session.commit()

    resp = await client.post(f"/api/v1/blog/posts/{post.post_code}/track-view")
    assert resp.status_code == 204

    await db_session.refresh(post)
    assert post.view_count == 1


@pytest.mark.asyncio
async def test_track_link_click(client, db_session):
    post = await _make_blog_post(db_session, title="Track Click Post", status="published", slug="track-click-post")
    await db_session.commit()

    resp = await client.post(f"/api/v1/blog/posts/{post.post_code}/track-link-click")
    assert resp.status_code == 204

    await db_session.refresh(post)
    assert post.link_click_count == 1


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_list_blog_posts_requires_auth(client):
    resp = await client.get("/api/v1/admin/blog/posts")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_list_blog_posts(client, db_session):
    await _make_admin_session(db_session)
    await _make_blog_post(db_session, title="Admin Post 1", status="published", slug="admin-post-1")
    await _make_blog_post(db_session, title="Admin Post 2", status="draft", slug="admin-post-2")
    await db_session.commit()

    resp = await client.get(
        "/api/v1/admin/blog/posts",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    titles = {item["title"] for item in data["items"]}
    assert "Admin Post 1" in titles
    assert "Admin Post 2" in titles


@pytest.mark.asyncio
async def test_admin_create_blog_post(client, db_session):
    await _make_admin_session(db_session)
    await db_session.commit()

    payload = {
        "title": "New Admin Blog Post",
        "slug": "new-admin-blog-post",
        "excerpt": "A short excerpt for the post.",
        "content": "## Heading\n\nSome content here.",
        "author": "Admin Author",
        "tags": ["uae", "jobs"],
        "status": "draft",
        "reading_minutes": 3,
    }
    resp = await client.post(
        "/api/v1/admin/blog/posts",
        json=payload,
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "New Admin Blog Post"
    assert data["slug"] == "new-admin-blog-post"
    assert data["status"] == "draft"
    assert "post_code" in data
    assert "view_count" in data
    assert "link_click_count" in data


@pytest.mark.asyncio
async def test_admin_create_blog_post_duplicate_slug(client, db_session):
    await _make_admin_session(db_session)
    await _make_blog_post(db_session, title="Existing Post", status="published", slug="my-slug")
    await db_session.commit()

    payload = {
        "title": "Another Post",
        "slug": "my-slug",
        "excerpt": "Excerpt.",
        "content": "Content.",
        "author": "Author",
        "tags": [],
        "status": "draft",
        "reading_minutes": 1,
    }
    resp = await client.post(
        "/api/v1/admin/blog/posts",
        json=payload,
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_admin_update_blog_post(client, db_session):
    await _make_admin_session(db_session)
    post = await _make_blog_post(db_session, title="Original Title", status="draft", slug="original-slug")
    await db_session.commit()

    resp = await client.put(
        f"/api/v1/admin/blog/posts/{post.post_code}",
        json={"title": "Updated Title", "status": "published"},
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated Title"
    assert data["status"] == "published"


@pytest.mark.asyncio
async def test_admin_delete_blog_post(client, db_session):
    await _make_admin_session(db_session)
    post = await _make_blog_post(db_session, title="Post to Delete", status="draft", slug="post-to-delete")
    await db_session.commit()

    resp = await client.delete(
        f"/api/v1/admin/blog/posts/{post.post_code}",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert resp.status_code == 204

    result = await db_session.execute(select(BlogPost).where(BlogPost.post_code == post.post_code))
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_admin_delete_nonexistent_post(client, db_session):
    await _make_admin_session(db_session)
    await db_session.commit()

    resp = await client.delete(
        "/api/v1/admin/blog/posts/nonexistent00",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_blog_tags(client, db_session):
    await _make_blog_post(db_session, title="Post A", status="published", slug="post-a")
    await db_session.commit()

    resp = await client.get("/api/v1/blog/tags")
    assert resp.status_code == 200
    tags = resp.json()
    assert "test" in tags
    assert "uae" in tags
