"""Seed Mal careers blog post

Revision ID: 0016
Revises: 0015
Create Date: 2026-05-05
"""

from datetime import UTC, datetime

import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP

from alembic import op

revision = "0016"
down_revision = "0015"
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
    "post_code": "blog00000008",
    "title": "Why Mal Should Be on Your UAE Fintech Job Watchlist",
    "slug": "mal-careers-uae-fintech-job-watchlist",
    "excerpt": (
        "Mal is building an AI-native Islamic digital banking platform from Abu Dhabi. "
        "Here is what UAE candidates can learn from its careers page and how to stay ready."
    ),
    "author": "Hussain Abbasi",
    "tags": ["Mal", "Fintech Jobs", "Abu Dhabi"],
    "status": "published",
    "reading_minutes": 7,
    "created_at": "2026-05-05T00:00:00+00:00",
    "link_preview": {
        "url": "https://careers.mal.ai/roles",
        "title": "Open Roles | Mal Careers",
        "description": "Explore roles where AI engineering, Islamic finance, and meaningful work meet.",
        "domain": "careers.mal.ai",
    },
    "content": """\
Mal is one of the most interesting names to watch in the UAE fintech market right now. The Abu Dhabi company describes itself as an AI-native Islamic digital banking platform, and its careers site frames the mission clearly: build the future of Islamic banking with a team of engineers, researchers, operators, and finance specialists.

That combination matters. The UAE already has strong demand for fintech, data, product, compliance, and operations talent. Mal adds a sharper angle: AI-native infrastructure, Shariah-compliant financial services, and a mobile-first platform being built from Abu Dhabi for a much wider market.

If you are exploring fintech jobs in the UAE, Mal should be on your watchlist even if the exact role you want is not open today.

## What Mal Is Building

Mal's public website positions the company as a new digital financial platform built around how people live, earn, and grow. The company talks about AI that understands goals, anticipates needs, and helps people move through their financial world with less friction.

Its careers site is more specific about the talent story. Mal says it is building more than a bank: it is building a team around ethical, intelligent, and accessible finance. The careers page highlights three signals candidates should notice:

1. Purpose-driven work around ethical banking.
2. Early-stage impact, with the language of "Day 0" and ground-floor ownership.
3. A people-first culture where respect is treated as non-negotiable.

That is not just employer branding. It tells you the kind of people Mal will likely need: builders who can handle ambiguity, understand regulated financial products, and care about the social context of money.

## What the Roles Page Shows Today

Mal's roles page is clean and direct. It invites candidates to search by role, team, or keyword, then filter by department, location, type, and level. At the time of writing, the public roles page shows 0 open roles, but the careers site also includes a talent pool option and says the company is growing across the UAE.

That is an important job-search lesson. For early-stage or pre-launch companies, hiring windows can be uneven. Roles may open in bursts, close quickly, or be sourced through networks before they sit publicly for long.

So the right move is not to check once and forget. If Mal is relevant to your background, bookmark [careers.mal.ai/roles](https://careers.mal.ai/roles), join the talent pool if it fits your situation, and keep your own profile ready before the next hiring window appears.

## Why Candidates Should Pay Attention

Mal has attracted attention because it is aiming at a large and underserved financial category: Islamic finance and underbanked communities. Regional coverage has reported a major funding round and a phased rollout plan beginning in the UAE before broader Middle East and Asia expansion.

For candidates, the exact funding headline is less important than what it implies about the work ahead. A company trying to build an AI-native financial platform needs more than app developers. It needs product thinkers, risk and compliance operators, data people, infrastructure engineers, customer experience specialists, content and brand teams, financial operations, and people who can translate complex financial needs into simple user journeys.

The strongest applicants will understand both sides of the problem:

- The technology side: AI systems, secure infrastructure, product engineering, mobile experience, data quality, automation, and reliability.
- The finance side: trust, compliance, Islamic finance principles, customer protection, regulatory readiness, and clear communication.

That mix is rare. If you can show it, say it directly.

## How to Prepare for Future Mal Roles

If you want to be ready for Mal or similar UAE fintech companies, do not wait for a job description to tell you who to become. Start shaping your profile around the problems these companies are likely solving.

For engineering and AI roles, show more than tool names. Mention the systems you have built, the scale you handled, the data problems you solved, and how your work improved user experience, risk controls, cost, speed, or reliability.

For product and design roles, focus on trust and clarity. Fintech users need interfaces that make complex money decisions feel understandable. If you have worked on onboarding, KYC, payments, lending, savings, wallets, subscriptions, dashboards, or support tooling, make that visible.

For operations, compliance, and finance roles, show that you can work with detail and pace. Early teams need people who can build processes without turning the company into a slow machine. Mention regulatory coordination, internal controls, reconciliations, fraud workflows, vendor operations, audit readiness, or customer resolution experience.

For growth and content roles, connect the mission to audience understanding. A values-led financial platform needs communication that is accurate, simple, and culturally aware.

## Use Direct Careers Pages and a Public Talent Profile

Direct company careers pages are still the best source of truth for active roles. For Mal, that means checking [careers.mal.ai/roles](https://careers.mal.ai/roles) and keeping an eye on its broader careers site.

But direct applications are only one part of a modern UAE job search. A public talent profile on hirebridge helps hiring teams find you even before the perfect job post appears. This is especially useful when companies are building early teams, mapping talent pools, or searching across adjacent titles.

Use both channels:

1. Follow Mal's roles page and talent pool for direct opportunities.
2. Keep your hirebridge profile updated with your strongest title, skills, location, notice period, and work preferences.
3. Make your profile searchable for the terms UAE fintech teams actually use: product engineering, AI, machine learning, data, payments, compliance, KYC, operations, risk, customer experience, mobile, and Islamic finance.
4. Revisit your profile every two weeks so it reflects the roles you want now, not the role you wanted last year.

## A Simple Positioning Checklist

Before applying to Mal or any AI-fintech company in the UAE, check your CV and profile for five things:

1. A clear headline that says what you do.
2. Evidence of scale, ownership, or measurable impact.
3. Relevant fintech, banking, AI, product, operations, or compliance keywords.
4. A short explanation of why UAE or regional work fits you.
5. Consistent details across your CV, LinkedIn, and hirebridge profile.

The UAE market moves quickly, but it rewards clarity. If a hiring team can understand your value in 30 seconds, you are already ahead.

Mal's public roles page may be quiet today, but the company is a strong signal of where the regional fintech market is going: AI-native, values-led, mobile-first, and built from the UAE for a broader world. If that direction matches your skills, start preparing now.""",
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
