from datetime import datetime

from pydantic import BaseModel, field_validator


class LinkPreview(BaseModel):
    url: str
    title: str | None = None
    description: str | None = None
    image: str | None = None
    domain: str | None = None


class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    tags: list[str] = []
    status: str = "draft"
    featured_image_url: str | None = None
    reading_minutes: int = 1
    link_preview_url: str | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ("draft", "published", "archived")
        if v not in allowed:
            raise ValueError(f"status must be one of: {', '.join(allowed)}")
        return v

    @field_validator("reading_minutes", mode="before")
    @classmethod
    def clamp_reading_minutes(cls, v: int) -> int:
        return max(1, int(v))


class BlogPostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    author: str | None = None
    tags: list[str] | None = None
    status: str | None = None
    featured_image_url: str | None = None
    reading_minutes: int | None = None
    link_preview_url: str | None = None
    link_preview: LinkPreview | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return v.strip().lower()

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = ("draft", "published", "archived")
        if v not in allowed:
            raise ValueError(f"status must be one of: {', '.join(allowed)}")
        return v


class BlogPostListItem(BaseModel):
    post_code: str
    title: str
    slug: str
    excerpt: str
    author: str
    tags: list[str]
    status: str
    featured_image_url: str | None
    reading_minutes: int
    source: str = "internal"
    external_url: str | None = None
    published_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BlogPostResponse(BaseModel):
    post_code: str
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    tags: list[str]
    status: str
    featured_image_url: str | None
    reading_minutes: int
    view_count: int
    link_preview: LinkPreview | None
    source: str = "internal"
    external_url: str | None = None
    published_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminBlogPostItem(BaseModel):
    post_code: str
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    tags: list[str]
    status: str
    featured_image_url: str | None
    reading_minutes: int
    view_count: int
    link_click_count: int
    link_preview: LinkPreview | None
    source: str = "internal"
    source_guid: str | None = None
    external_url: str | None = None
    published_at: datetime
    source_synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BlogListResponse(BaseModel):
    items: list[BlogPostListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class AdminBlogListResponse(BaseModel):
    items: list[AdminBlogPostItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class LinkPreviewRequest(BaseModel):
    url: str
