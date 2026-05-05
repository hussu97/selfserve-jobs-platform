import math
import re
import urllib.parse
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog_post import BlogPost
from app.schemas.blog import (
    AdminBlogListResponse,
    AdminBlogPostItem,
    BlogListResponse,
    BlogPostCreate,
    BlogPostListItem,
    BlogPostUpdate,
    LinkPreview,
)


def _generate_code() -> str:
    from nanoid import generate

    return generate(size=12)


def _calculate_reading_minutes(content: str) -> int:
    words = len(content.split())
    return max(1, round(words / 200))


async def create_blog_post(db: AsyncSession, data: BlogPostCreate) -> BlogPost:
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A post with this slug already exists")

    reading_minutes = data.reading_minutes or _calculate_reading_minutes(data.content)

    post = BlogPost(
        post_code=_generate_code(),
        title=data.title,
        slug=data.slug,
        excerpt=data.excerpt,
        content=data.content,
        author=data.author,
        tags=data.tags,
        status=data.status,
        featured_image_url=data.featured_image_url,
        reading_minutes=reading_minutes,
    )

    if data.link_preview_url:
        preview = await fetch_link_preview(data.link_preview_url)
        post.link_preview = preview.model_dump() if preview else None

    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def update_blog_post(db: AsyncSession, post_code: str, data: BlogPostUpdate) -> BlogPost:
    result = await db.execute(select(BlogPost).where(BlogPost.post_code == post_code))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    if data.slug is not None and data.slug != post.slug:
        conflict = await db.execute(select(BlogPost).where(BlogPost.slug == data.slug, BlogPost.post_code != post_code))
        if conflict.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A post with this slug already exists")
        post.slug = data.slug

    if data.title is not None:
        post.title = data.title
    if data.excerpt is not None:
        post.excerpt = data.excerpt
    if data.content is not None:
        post.content = data.content
        if data.reading_minutes is None:
            post.reading_minutes = _calculate_reading_minutes(data.content)
    if data.author is not None:
        post.author = data.author
    if data.tags is not None:
        post.tags = data.tags
    if data.status is not None:
        post.status = data.status
    if data.featured_image_url is not None:
        post.featured_image_url = data.featured_image_url
    if data.reading_minutes is not None:
        post.reading_minutes = max(1, data.reading_minutes)

    if data.link_preview_url is not None:
        if data.link_preview_url == "":
            post.link_preview = None
        else:
            preview = await fetch_link_preview(data.link_preview_url)
            post.link_preview = preview.model_dump() if preview else None
    elif data.link_preview is not None:
        post.link_preview = data.link_preview.model_dump()

    post.updated_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(post)
    return post


async def delete_blog_post(db: AsyncSession, post_code: str) -> None:
    result = await db.execute(select(BlogPost).where(BlogPost.post_code == post_code))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    await db.delete(post)
    await db.flush()


async def get_blog_post_by_slug(db: AsyncSession, slug: str) -> BlogPost | None:
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    return result.scalar_one_or_none()


async def get_blog_post_by_code(db: AsyncSession, post_code: str) -> BlogPost | None:
    result = await db.execute(select(BlogPost).where(BlogPost.post_code == post_code))
    return result.scalar_one_or_none()


async def list_blog_posts(
    db: AsyncSession,
    search: str | None = None,
    tag: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> BlogListResponse:
    query = select(BlogPost).where(BlogPost.status == "published")

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                BlogPost.title.ilike(term),
                BlogPost.excerpt.ilike(term),
                BlogPost.author.ilike(term),
            )
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    all_total = count_result.scalar_one()

    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(BlogPost.created_at.desc()).offset(offset).limit(per_page))
    posts = result.scalars().all()

    # Tag filtering is done in Python to stay SQLite-compatible (PostgreSQL uses JSONB @>)
    if tag:
        tag_lower = tag.lower()
        posts = [p for p in posts if any(t.lower() == tag_lower for t in (p.tags or []))]

    total = len(posts) if tag else all_total

    return BlogListResponse(
        items=[BlogPostListItem.model_validate(p) for p in posts],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 1,
    )


async def list_blog_posts_all_tags(db: AsyncSession) -> list[str]:
    """Return all unique tags across published posts."""
    result = await db.execute(select(BlogPost.tags).where(BlogPost.status == "published"))
    rows = result.scalars().all()
    seen: set[str] = set()
    for tag_list in rows:
        if isinstance(tag_list, list):
            for t in tag_list:
                if t:
                    seen.add(t)
    return sorted(seen)


async def list_admin_blog_posts(
    db: AsyncSession,
    search: str | None = None,
    filter_status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> AdminBlogListResponse:
    query = select(BlogPost)

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                BlogPost.title.ilike(term),
                BlogPost.author.ilike(term),
                BlogPost.slug.ilike(term),
            )
        )

    if filter_status:
        query = query.where(BlogPost.status == filter_status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(BlogPost.created_at.desc()).offset(offset).limit(per_page))
    posts = result.scalars().all()

    return AdminBlogListResponse(
        items=[AdminBlogPostItem.model_validate(p) for p in posts],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 1,
    )


async def increment_view_count(db: AsyncSession, post_code: str) -> None:
    await db.execute(update(BlogPost).where(BlogPost.post_code == post_code).values(view_count=BlogPost.view_count + 1))
    await db.flush()


async def increment_link_click_count(db: AsyncSession, post_code: str) -> None:
    await db.execute(
        update(BlogPost).where(BlogPost.post_code == post_code).values(link_click_count=BlogPost.link_click_count + 1)
    )
    await db.flush()


async def fetch_link_preview(url: str) -> LinkPreview | None:
    """Fetch OG/meta tags from a URL and return a LinkPreview. Returns None on failure."""
    try:
        import httpx

        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc or parsed.path

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; hirebridge-bot/1.0)"})
            if response.status_code >= 400:
                return LinkPreview(url=url, domain=domain)
            html = response.text

        og_title = _extract_meta(html, "og:title") or _extract_title(html)
        og_desc = _extract_meta(html, "og:description") or _extract_meta(html, "description")
        og_image = _extract_meta(html, "og:image")

        return LinkPreview(
            url=url,
            title=og_title,
            description=og_desc,
            image=og_image,
            domain=domain,
        )
    except Exception:
        try:
            parsed = urllib.parse.urlparse(url)
            return LinkPreview(url=url, domain=parsed.netloc)
        except Exception:
            return None


def _extract_meta(html: str, name: str) -> str | None:
    patterns = [
        rf'<meta\s+(?:property|name)=["\']{{0,1}}{re.escape(name)}["\']{{0,1}}\s+content=["\']([^"\']+)["\']',
        rf'<meta\s+content=["\']([^"\']+)["\']\s+(?:property|name)=["\']{{0,1}}{re.escape(name)}["\']{{0,1}}',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def _extract_title(html: str) -> str | None:
    match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
    return match.group(1).strip() if match else None
