"""Seed noon and hirebridge blog post

Revision ID: 0015
Revises: 0014
Create Date: 2026-05-05
"""

from datetime import UTC, datetime

import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP

from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BLOG_POST_TABLE = sa.table(
    "blog_post",
    sa.column("post_code", sa.VARCHAR(12)),
    sa.column("title", sa.VARCHAR(500)),
    sa.column("slug", sa.VARCHAR(500)),
    sa.column("excerpt", sa.Text()),
    sa.column("content", sa.Text()),
    sa.column("author", sa.VARCHAR(200)),
    sa.column("tags", JSONB()),
    sa.column("status", sa.VARCHAR(20)),
    sa.column("reading_minutes", sa.Integer()),
    sa.column("view_count", sa.Integer()),
    sa.column("link_click_count", sa.Integer()),
    sa.column("link_preview", JSONB()),
    sa.column("created_at", TIMESTAMPTZ),
    sa.column("updated_at", TIMESTAMPTZ),
)

POST = {
    "post_code": "blog00000007",
    "title": "What noon's Careers Site Means for UAE Job Seekers",
    "slug": "noon-careers-site-uae-job-seekers-hirebridge",
    "excerpt": (
        "noon's new careers experience is a useful signal for UAE talent: fast-moving companies are investing "
        "in clearer hiring journeys. Here's how to use joinnoon.com and hirebridge together."
    ),
    "author": "Hussain Abbasi",
    "tags": ["noon", "UAE Jobs", "Career Platforms"],
    "status": "published",
    "reading_minutes": 6,
    "created_at": "2026-05-05T00:00:00+00:00",
    "link_preview": {
        "url": "https://joinnoon.com/jobs",
        "title": "Browse Jobs | noon Careers",
        "description": "Explore open roles across noon teams, countries, cities, and employment types.",
        "domain": "joinnoon.com",
    },
    "content": """\
noon has launched a refreshed careers experience at [joinnoon.com/jobs](https://joinnoon.com/jobs), and it is worth paying attention to if you are exploring work in the UAE. The signal is bigger than a new jobs page: one of the region's most visible digital companies is making its hiring journey clearer, faster, and easier to browse.

The LinkedIn announcement framed the site around people who "move fast and build things that matter." That is a useful lens for candidates too. Strong job search is not only about finding a vacancy. It is about understanding where a company is building, what kinds of teams are expanding, and how your own profile fits into that motion.

## What noon's Careers Page Shows

At the time of writing, noon's careers page lists 99 open positions across multiple teams and markets. The filters alone tell a story: Tech & Product, Operations & Logistics, Marketing & Growth, Commercial, Creative & Brand, Ads, Finance & Legal, People & Culture, Strategy, Procurement, Facilities, Security, Growth & Analytics, and Customer & Seller Support.

The country and city filters span the UAE, KSA, Egypt, Bahrain, Lebanon, India, Sri Lanka, and China, with UAE locations including Dubai, Abu Dhabi, Al Ain, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah, and remote roles. That breadth matters. noon is not hiring for one narrow function; it is hiring across a regional operating system.

For UAE-based professionals, a few visible roles stand out:

- Machine Learning Engineer 3 in Dubai
- Head of Applied ML, Search & Ad Monetization in Dubai
- Head of Engineering - Finance in Dubai
- Head of Engineering - Customer Experience in Dubai
- Senior Internal Auditor in Dubai
- Logistics, compliance, customer service, operations, and business analyst roles across Dubai, Abu Dhabi, and Gurugram

If you work in software, data, logistics, commercial operations, finance, audit, growth, support, or marketplace execution, noon's careers site is now one of the places you should check directly.

## Why Direct Careers Sites Still Matter

LinkedIn is useful, but direct careers sites often carry the cleanest version of a company's hiring intent. They show how the company groups roles, which locations are active, whether remote options exist, and what functions the business is prioritising.

For a company like noon, that context is especially useful because the business is not just an e-commerce storefront. It touches logistics, payments, advertising, customer experience, seller tools, quick commerce, fulfilment, analytics, and consumer product. A candidate who only searches for one job title may miss adjacent roles that fit their experience.

Direct application also removes a layer of ambiguity. You are applying into the company's own hiring system, not hoping a scraped listing or reposted vacancy is still current.

## Where hirebridge Fits

hirebridge is not a replacement for noon's careers site. If you want to work at noon, start with [joinnoon.com/jobs](https://joinnoon.com/jobs) and apply directly to roles that match you.

hirebridge solves a different problem: discoverability.

Most candidates only become visible when they apply to a specific opening. That works when your target role is obvious. It works less well when your background could fit several teams, when a hiring manager is searching before a role is publicly posted, or when your timing does not line up neatly with a job opening.

Creating a talent profile on hirebridge gives UAE hiring teams a simple way to find you by title, skills, location, availability, and professional brief. It is especially useful if:

- You are open to UAE opportunities but not actively applying every day
- Your skills fit more than one function or company type
- You want approved hiring teams to discover you without exposing your contact details publicly
- You prefer a lightweight profile instead of another full account to manage

In practical terms, use both channels:

1. Apply directly on noon's site for roles that clearly match your experience.
2. Keep a hirebridge profile live so other UAE hiring teams can discover you.
3. Make the language in both places consistent: title, core skills, location, notice period, and the kind of work you want next.

## How to Position Yourself for noon-Style Roles

noon's public roles suggest a company that values execution across engineering, machine learning, operations, fulfilment, analytics, commercial growth, and customer experience. If you are applying there, your profile should make your operating context clear.

For technical roles, show the scale and product surface you have worked on. Instead of only listing Python, React, SQL, or cloud tools, explain what those tools supported: search quality, ads ranking, payments, fulfilment, internal tooling, pricing, warehouse systems, dashboards, experimentation, or customer-facing product.

For operations and logistics roles, quantify the environment. Mention order volumes, fulfilment centres, fleet coordination, inventory accuracy, SLA ownership, compliance processes, cost optimisation, or control tower experience.

For business, growth, and analytics roles, connect analysis to decisions. Hiring teams want to know whether your work changed pricing, conversion, retention, category performance, seller performance, acquisition, or cost.

The best profile does not try to sound impressive everywhere. It makes the hiring team think: this person understands our kind of work.

## A Simple Job Search Workflow

If noon is on your target list, try this workflow:

1. Visit [joinnoon.com/jobs](https://joinnoon.com/jobs) weekly and filter by your function, country, and city.
2. Save roles that are adjacent to your experience, not only exact title matches.
3. Tailor your CV around the operating problem in the job description.
4. Keep your hirebridge profile updated with the same strongest keywords.
5. Track where you applied and revisit your profile every two weeks.

The UAE job market rewards clarity. Companies move quickly when they can understand who you are, what you have done, where you are based, and what kind of role you are ready for.

noon's new careers site is a good step for direct applications. hirebridge is the layer beside it: a simple public talent signal that helps the right hiring teams find you before the perfect job post appears.""",
}


def upgrade() -> None:
    conn = op.get_bind()
    exists = conn.execute(
        text("SELECT 1 FROM blog_post WHERE slug = :slug"),
        {"slug": POST["slug"]},
    ).scalar()
    if exists:
        return

    now = datetime.now(UTC)
    conn.execute(
        BLOG_POST_TABLE.insert(),
        {
            "post_code": POST["post_code"],
            "title": POST["title"],
            "slug": POST["slug"],
            "excerpt": POST["excerpt"],
            "content": POST["content"],
            "author": POST["author"],
            "tags": POST["tags"],
            "status": POST["status"],
            "reading_minutes": POST["reading_minutes"],
            "view_count": 0,
            "link_click_count": 0,
            "link_preview": POST["link_preview"],
            "created_at": datetime.fromisoformat(POST["created_at"]),
            "updated_at": now,
        },
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        text("DELETE FROM blog_post WHERE post_code = :post_code"),
        {"post_code": POST["post_code"]},
    )
