from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_session
from app.models.auth_session import AuthSession
from app.routers.admin import _get_admin_session
from app.schemas.blog import (
    AdminBlogListResponse,
    AdminBlogPostItem,
    BlogListResponse,
    BlogPostCreate,
    BlogPostResponse,
    BlogPostUpdate,
    LinkPreview,
    LinkPreviewRequest,
)
from app.services import blog_service

router = APIRouter(prefix="/api/v1", tags=["blog"])


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------


@router.get("/blog/posts", response_model=BlogListResponse)
async def list_blog_posts(
    search: str | None = Query(None),
    tag: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
) -> BlogListResponse:
    """List published blog posts with optional search and tag filter."""
    return await blog_service.list_blog_posts(db, search=search, tag=tag, page=page, per_page=per_page)


@router.get("/blog/tags", response_model=list[str])
async def list_blog_tags(
    db: AsyncSession = Depends(get_session),
) -> list[str]:
    """Return all unique tags from published posts."""
    return await blog_service.list_blog_posts_all_tags(db)


@router.get("/blog/posts/{slug}", response_model=BlogPostResponse)
async def get_blog_post(
    slug: str,
    db: AsyncSession = Depends(get_session),
) -> BlogPostResponse:
    """Get a single published blog post by slug."""
    post = await blog_service.get_blog_post_by_slug(db, slug)
    if not post or post.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    return BlogPostResponse.model_validate(post)


@router.post("/blog/posts/{post_code}/track-view", status_code=status.HTTP_204_NO_CONTENT)
async def track_blog_view(
    post_code: str,
    db: AsyncSession = Depends(get_session),
) -> None:
    """Atomically increment the view count for a blog post."""
    await blog_service.increment_view_count(db, post_code)


@router.post("/blog/posts/{post_code}/track-link-click", status_code=status.HTTP_204_NO_CONTENT)
async def track_link_click(
    post_code: str,
    db: AsyncSession = Depends(get_session),
) -> None:
    """Atomically increment the link click count for a blog post."""
    await blog_service.increment_link_click_count(db, post_code)


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@router.get("/admin/blog/posts", response_model=AdminBlogListResponse)
async def admin_list_blog_posts(
    search: str | None = Query(None),
    filter_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminBlogListResponse:
    """Admin: list all blog posts with metrics."""
    return await blog_service.list_admin_blog_posts(
        db, search=search, filter_status=filter_status, page=page, per_page=per_page
    )


@router.post("/admin/blog/posts", response_model=AdminBlogPostItem, status_code=status.HTTP_201_CREATED)
async def admin_create_blog_post(
    body: BlogPostCreate,
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminBlogPostItem:
    """Admin: create a new blog post."""
    post = await blog_service.create_blog_post(db, body)
    return AdminBlogPostItem.model_validate(post)


@router.put("/admin/blog/posts/{post_code}", response_model=AdminBlogPostItem)
async def admin_update_blog_post(
    post_code: str,
    body: BlogPostUpdate,
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminBlogPostItem:
    """Admin: update an existing blog post."""
    post = await blog_service.update_blog_post(db, post_code, body)
    return AdminBlogPostItem.model_validate(post)


@router.delete("/admin/blog/posts/{post_code}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_blog_post(
    post_code: str,
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> None:
    """Admin: permanently delete a blog post."""
    await blog_service.delete_blog_post(db, post_code)


@router.post("/admin/blog/link-preview", response_model=LinkPreview)
async def admin_fetch_link_preview(
    body: LinkPreviewRequest,
    _session: AuthSession = Depends(_get_admin_session),
) -> LinkPreview:
    """Admin: fetch OG metadata for a URL to populate a link preview."""
    preview = await blog_service.fetch_link_preview(body.url)
    if not preview:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not fetch link preview")
    return preview
