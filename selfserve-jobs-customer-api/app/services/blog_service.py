import math
import re
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser

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


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:120].strip("-") or _generate_code().lower()


async def _unique_slug(db: AsyncSession, preferred_slug: str, source_guid: str | None = None) -> str:
    slug = preferred_slug
    suffix = _slugify(source_guid[-24:])[-8:] if source_guid else _generate_code().lower()
    i = 1
    while True:
        result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
        if result.scalar_one_or_none() is None:
            return slug
        slug = f"{preferred_slug[:110].strip('-')}-{suffix if i == 1 else f'{suffix}-{i}'}"
        i += 1


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
        published_at=datetime.now(UTC),
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
    fields_set = data.model_fields_set

    if "featured_image_url" in fields_set:
        post.featured_image_url = data.featured_image_url
    if data.reading_minutes is not None:
        post.reading_minutes = max(1, data.reading_minutes)

    if "link_preview_url" in fields_set:
        if not data.link_preview_url:
            post.link_preview = None
        else:
            preview = await fetch_link_preview(data.link_preview_url)
            post.link_preview = preview.model_dump() if preview else None
    elif "link_preview" in fields_set:
        post.link_preview = data.link_preview.model_dump() if data.link_preview else None

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

    if tag:
        result = await db.execute(query.order_by(BlogPost.published_at.desc(), BlogPost.created_at.desc()))
        all_posts = result.scalars().all()
        tag_lower = tag.lower()
        filtered_posts = [p for p in all_posts if any(t.lower() == tag_lower for t in (p.tags or []))]
        total = len(filtered_posts)
        offset = (page - 1) * per_page
        posts = filtered_posts[offset : offset + per_page]
    else:
        total = all_total
        offset = (page - 1) * per_page
        result = await db.execute(
            query.order_by(BlogPost.published_at.desc(), BlogPost.created_at.desc()).offset(offset).limit(per_page)
        )
        posts = result.scalars().all()

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
    result = await db.execute(
        query.order_by(BlogPost.published_at.desc(), BlogPost.created_at.desc()).offset(offset).limit(per_page)
    )
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


class _MarkdownHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.link_stack: list[str | None] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        attrs_dict = dict(attrs)
        if tag in {"p", "div", "section", "article"}:
            self.parts.append("\n\n")
        elif tag == "br":
            self.parts.append("\n")
        elif tag in {"h1", "h2"}:
            self.parts.append("\n\n## ")
        elif tag == "h3":
            self.parts.append("\n\n### ")
        elif tag == "li":
            self.parts.append("\n- ")
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "a":
            self.link_stack.append(attrs_dict.get("href"))
            self.parts.append("[")
        elif tag == "blockquote":
            self.parts.append("\n\n> ")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if self.skip_depth:
            return
        if tag in {"h1", "h2", "h3", "p", "div", "section", "article", "blockquote", "ul", "ol"}:
            self.parts.append("\n\n")
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "a":
            href = self.link_stack.pop() if self.link_stack else None
            self.parts.append(f"]({href})" if href else "]")

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        text = unescape(data)
        if text:
            self.parts.append(text)

    def markdown(self) -> str:
        value = "".join(self.parts)
        value = re.sub(r"[ \t]+\n", "\n", value)
        value = re.sub(r"\n{3,}", "\n\n", value)
        value = re.sub(r" +", " ", value)
        return value.strip()


def _html_to_markdown(html: str) -> str:
    parser = _MarkdownHTMLParser()
    parser.feed(html)
    return parser.markdown()


def _plain_text(value: str) -> str:
    parser = _MarkdownHTMLParser()
    parser.feed(value)
    text = re.sub(r"\[(.*?)\]\([^)]*\)", r"\1", parser.markdown())
    return re.sub(r"\s+", " ", text).strip()


def _excerpt(value: str, max_chars: int = 220) -> str:
    text = _plain_text(value)
    if len(text) <= max_chars:
        return text or "Latest regional job market notes from hirebridge."
    return text[: max_chars - 1].rsplit(" ", 1)[0].rstrip(".,;:") + "…"


def _find_child_text(item: ET.Element, local_name: str) -> str | None:
    for child in item:
        if child.tag.split("}")[-1] == local_name and child.text:
            return child.text.strip()
    return None


def _parse_rss_date(value: str | None) -> datetime:
    if not value:
        return datetime.now(UTC)
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=UTC)
        return parsed.astimezone(UTC)
    except Exception:
        return datetime.now(UTC)


def _extract_image(item: ET.Element, html: str) -> str | None:
    for child in item:
        tag = child.tag.split("}")[-1]
        if tag in {"content", "thumbnail"} and child.attrib.get("url"):
            return child.attrib["url"]
        if tag == "enclosure" and child.attrib.get("url") and child.attrib.get("type", "").startswith("image/"):
            return child.attrib["url"]
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
    return match.group(1) if match else None


async def sync_substack_posts(
    db: AsyncSession,
    *,
    feed_url: str,
    publication_url: str,
    publication_name: str,
) -> dict[str, int | str | bool]:
    """Fetch Substack RSS and upsert posts into blog_post.

    Missing feed items are intentionally not archived; Substack remains an
    ingestion source, not an instruction to delete local article history.
    """
    if not feed_url:
        return {"skipped": True, "created": 0, "updated": 0, "seen": 0, "reason": "substack_feed_url_not_configured"}

    import httpx

    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
        response = await client.get(feed_url, headers={"User-Agent": "Mozilla/5.0 (compatible; hirebridge-bot/1.0)"})
        response.raise_for_status()

    root = ET.fromstring(response.content)
    items = root.findall(".//item")
    now = datetime.now(UTC)
    created = 0
    updated = 0

    for item in items:
        title = _find_child_text(item, "title")
        link = _find_child_text(item, "link")
        guid = _find_child_text(item, "guid") or link
        if not title or not guid:
            continue

        raw_content = _find_child_text(item, "encoded") or _find_child_text(item, "description") or ""
        content = _html_to_markdown(raw_content) or _plain_text(raw_content) or title
        description = _find_child_text(item, "description") or raw_content
        published_at = _parse_rss_date(_find_child_text(item, "pubDate"))
        author = _find_child_text(item, "creator") or publication_name or "hirebridge"
        tags = sorted(
            {
                (child.text or "").strip()
                for child in item
                if child.tag.split("}")[-1] == "category" and (child.text or "").strip()
            }
        )
        if not tags:
            tags = ["Job market"]

        existing_result = await db.execute(
            select(BlogPost).where(BlogPost.source == "substack", BlogPost.source_guid == guid)
        )
        post = existing_result.scalar_one_or_none()
        is_new = post is None

        if post is None:
            slug = await _unique_slug(db, _slugify(title), guid)
            post = BlogPost(
                post_code=_generate_code(),
                slug=slug,
                source="substack",
                source_guid=guid,
                view_count=0,
                link_click_count=0,
            )
            db.add(post)

        post.title = title
        post.excerpt = _excerpt(description)
        post.content = content
        post.author = author
        post.tags = tags
        post.status = "published"
        post.featured_image_url = _extract_image(item, raw_content)
        post.reading_minutes = _calculate_reading_minutes(content)
        post.external_url = link or publication_url or feed_url
        post.published_at = published_at
        post.source_synced_at = now
        post.updated_at = now
        if post.link_preview is None and post.external_url:
            parsed = urllib.parse.urlparse(post.external_url)
            post.link_preview = {
                "url": post.external_url,
                "title": title,
                "description": post.excerpt,
                "image": post.featured_image_url,
                "domain": parsed.netloc,
            }

        if is_new:
            created += 1
        else:
            updated += 1

    await db.flush()
    return {"skipped": False, "created": created, "updated": updated, "seen": len(items)}


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
