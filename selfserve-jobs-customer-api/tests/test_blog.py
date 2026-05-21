"""Tests for blog public endpoints and admin blog management endpoints."""

import os

os.environ.setdefault("ADMIN_EMAILS", "admin@example.com")

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.models.auth_session import AuthSession
from app.models.blog_post import BlogPost
from app.routers import internal
from app.services import blog_service
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


async def _make_blog_post(
    db_session,
    *,
    title: str = "Test Post",
    status: str = "published",
    slug: str | None = None,
    published_at: datetime | None = None,
) -> BlogPost:
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
        published_at=published_at or datetime.now(UTC),
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
    await _make_blog_post(db_session, title="UAE Visa Tips", status="published", slug="uae-visa-tips")
    await db_session.commit()

    resp = await client.get("/api/v1/blog/posts/uae-visa-tips")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "uae-visa-tips"
    assert data["title"] == "UAE Visa Tips"
    assert "content" in data
    assert data["source"] == "internal"
    assert data["external_url"] is None
    assert "published_at" in data


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


@pytest.mark.asyncio
async def test_list_blog_posts_orders_by_published_at(client, db_session):
    await _make_blog_post(
        db_session,
        title="Older Published",
        status="published",
        slug="older-published",
        published_at=datetime(2026, 1, 1, tzinfo=UTC),
    )
    await _make_blog_post(
        db_session,
        title="Newer Published",
        status="published",
        slug="newer-published",
        published_at=datetime(2026, 2, 1, tzinfo=UTC),
    )
    await db_session.commit()

    resp = await client.get("/api/v1/blog/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert [item["title"] for item in data["items"]] == ["Newer Published", "Older Published"]
    assert data["items"][0]["source"] == "internal"
    assert "published_at" in data["items"][0]


@pytest.mark.asyncio
async def test_sync_substack_endpoint_noops_when_feed_missing(client, db_session, monkeypatch):
    monkeypatch.setattr(internal.settings, "internal_api_secret", "secret")
    monkeypatch.setattr(internal.settings, "substack_feed_url", "")

    resp = await client.post("/api/v1/internal/sync-substack", headers={"X-Internal-Secret": "secret"})

    assert resp.status_code == 200
    assert resp.json()["skipped"] is True


class _MockRssResponse:
    def __init__(self, content: bytes):
        self.content = content

    def raise_for_status(self) -> None:
        return None


class _MockAsyncClient:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def get(self, url, headers=None):
        return _MockRssResponse(
            b"""<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0"
              xmlns:content="http://purl.org/rss/1.0/modules/content/"
              xmlns:dc="http://purl.org/dc/elements/1.1/">
              <channel>
                <item>
                  <title>How to Get Hired in Dubai</title>
                  <link>https://hirebridge.substack.com/p/get-hired-dubai</link>
                  <guid>substack-guid-1</guid>
                  <pubDate>Fri, 01 May 2026 08:00:00 GMT</pubDate>
                  <dc:creator>hirebridge</dc:creator>
                  <category>Job Search</category>
                  <category>Dubai</category>
                  <description><![CDATA[<p>A practical guide for candidates.</p>]]></description>
                  <content:encoded><![CDATA[
                    <h2>Start with the market</h2>
                    <p>Use your profile to show proof.</p>
                    <p><a href="https://example.com">Read more</a></p>
                  ]]></content:encoded>
                </item>
              </channel>
            </rss>"""
        )


@pytest.mark.asyncio
async def test_sync_substack_imports_and_updates_idempotently(db_session, monkeypatch):
    import httpx

    monkeypatch.setattr(httpx, "AsyncClient", _MockAsyncClient)

    first = await blog_service.sync_substack_posts(
        db_session,
        feed_url="https://hirebridge.substack.com/feed",
        publication_url="https://hirebridge.substack.com",
        publication_name="hirebridge Field Notes",
    )
    second = await blog_service.sync_substack_posts(
        db_session,
        feed_url="https://hirebridge.substack.com/feed",
        publication_url="https://hirebridge.substack.com",
        publication_name="hirebridge Field Notes",
    )
    await db_session.commit()

    assert first == {"skipped": False, "created": 1, "updated": 0, "seen": 1}
    assert second == {"skipped": False, "created": 0, "updated": 1, "seen": 1}

    result = await db_session.execute(select(BlogPost).where(BlogPost.source == "substack"))
    posts = result.scalars().all()
    assert len(posts) == 1
    post = posts[0]
    assert post.source_guid == "substack-guid-1"
    assert post.external_url == "https://hirebridge.substack.com/p/get-hired-dubai"
    assert post.slug == "how-to-get-hired-in-dubai"
    assert post.published_at.replace(tzinfo=UTC) == datetime(2026, 5, 1, 8, 0, tzinfo=UTC)
    assert "## Start with the market" in post.content
    assert "<p>" not in post.content


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
    assert data["content"] == payload["content"]
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
async def test_admin_blog_form_lifecycle_saves_and_retrieves_all_fields(client, db_session):
    await _make_admin_session(db_session)
    await db_session.commit()

    create_payload = {
        "title": "Lifecycle Post",
        "slug": "lifecycle-post",
        "excerpt": "Initial excerpt.",
        "content": "## Initial\n\nThis content should reopen in the editor.",
        "author": "Lifecycle Author",
        "tags": ["admin", "lifecycle"],
        "status": "draft",
        "featured_image_url": "https://example.com/image.jpg",
        "reading_minutes": 4,
    }
    create_resp = await client.post(
        "/api/v1/admin/blog/posts",
        json=create_payload,
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["content"] == create_payload["content"]
    assert created["featured_image_url"] == create_payload["featured_image_url"]
    assert created["tags"] == create_payload["tags"]

    list_resp = await client.get(
        "/api/v1/admin/blog/posts?search=Lifecycle",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert list_resp.status_code == 200
    listed = list_resp.json()["items"][0]
    assert listed["post_code"] == created["post_code"]
    assert listed["content"] == create_payload["content"]

    update_payload = {
        "title": "Lifecycle Post Updated",
        "slug": "lifecycle-post-updated",
        "excerpt": "Updated excerpt.",
        "content": "## Updated\n\nThis edited content should be saved and retrieved.",
        "author": "Updated Author",
        "tags": ["updated", "blog"],
        "status": "published",
        "featured_image_url": None,
        "reading_minutes": 7,
        "link_preview": {
            "url": "https://example.com/careers",
            "title": "Example Careers",
            "description": "Example description",
            "domain": "example.com",
        },
    }
    update_resp = await client.put(
        f"/api/v1/admin/blog/posts/{created['post_code']}",
        json=update_payload,
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["title"] == update_payload["title"]
    assert updated["slug"] == update_payload["slug"]
    assert updated["excerpt"] == update_payload["excerpt"]
    assert updated["content"] == update_payload["content"]
    assert updated["author"] == update_payload["author"]
    assert updated["tags"] == update_payload["tags"]
    assert updated["status"] == update_payload["status"]
    assert updated["featured_image_url"] is None
    assert updated["reading_minutes"] == update_payload["reading_minutes"]
    assert updated["link_preview"]["url"] == "https://example.com/careers"

    clear_resp = await client.put(
        f"/api/v1/admin/blog/posts/{created['post_code']}",
        json={"link_preview": None, "featured_image_url": None},
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert clear_resp.status_code == 200
    cleared = clear_resp.json()
    assert cleared["content"] == update_payload["content"]
    assert cleared["link_preview"] is None
    assert cleared["featured_image_url"] is None


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
