# jobs4u — Codex Guidelines

## Git Rules
- **After every change, commit immediately** with an appropriate, descriptive message.
- **Commit author:** Hussain Abbasi <h_abbasi97@hotmail.com> — do NOT add `Co-Authored-By` or any other author lines.

## Project Overview
A free-to-use jobs platform with two core entities: **Jobs** (company listings) and **Profiles** (candidate listings). No signup/login — email verification prevents fraud. Desktop + responsive mobile web.

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + TypeScript — deployed on Vercel
- **Backend:** FastAPI + Python — deployed on Google Cloud Run via Docker
- **Database:** PostgreSQL on Google CloudSQL
- **Storage:** GCS bucket for resume PDFs
- **Email:** Resend for transactional emails

## Database Conventions (STRICT)
- **No foreign keys in the DB.** All referential integrity and constraint validation must be handled in the service layer (business logic), never as DB-level FK constraints.
- **Singular table names** in snake_case: `job`, `profile`, `email_verification`, `report` — NOT `jobs`, `profiles`, `email_verifications`, `reports`
- **Auto-generated public codes** (nanoid, 12 chars) instead of exposing integer IDs: `job_code`, `profile_code`, `report_code`. Internal `id` (BIGINT PK) is never exposed in APIs.
- **Timestamps on every table:** `created_at` and `updated_at` (TIMESTAMPTZ, auto-set)
- **Status fields** use lowercase snake_case string values: `pending_verification`, `active`, `expired`, `archived`, `removed`, `under_review`
- **JSONB for arrays** (e.g., `key_skills`) rather than normalized junction tables for simple tag/skill arrays

## Backend Patterns
- **Router → Service → Model** layering. Business logic lives exclusively in `services/`, never in routers.
- Use async SQLAlchemy 2.0 with asyncpg driver.
- Pydantic v2 for all request/response schemas (separate from SQLAlchemy models).
- Alembic for DB migrations. Migrations run automatically on app startup via the lifespan handler.
- Environment config via `pydantic-settings` (`app/config.py`). All secrets from env vars.
- Edit/delete operations authenticated via `X-Edit-Token` header (64-char nanoid stored in DB).
- Code generation: nanoid 12-char for public codes, 64-char for tokens and verification codes.
- API versioning: all routes prefixed `/api/v1/`.
- Rate limiting on create/verify/resend endpoints.
- Resume uploads: max 5MB, PDF only, validate `%PDF` magic bytes server-side. Store GCS path, never the blob.
- View count increments must be atomic SQL updates (`view_count = view_count + 1`).

## Frontend Patterns
- **Next.js 15 App Router** — use Server Components for SEO-critical pages (browse, detail), Client Components for interactive forms and filters.
- `generateMetadata()` on all dynamic pages (job/profile detail).
- JSON-LD `JobPosting` structured data on job detail pages.
- Dynamic `sitemap.ts` + `robots.ts` from active listings.
- API client lives in `src/lib/api.ts` (centralized fetch wrapper).
- **Custom component library** — do NOT use shadcn/ui, Material UI, or other pre-built component libraries. Build lightweight custom components to maintain uniqueness.
- Render user-provided content (descriptions, briefs) via `react-markdown` with no raw HTML passthrough (XSS prevention).
- Local bookmarks via `localStorage` (no auth needed).
- Client-side session dedup for view counts.

## Design System
Full spec: `design-system/DESIGN.md`. HTML mockups: `design-system/DESKTOP_WEB.html` and `design-system/MOBILE_WEB.html`.

**"Sage & Stone" palette — always use these values:**
| Token | CSS Var | Hex | Use |
|-------|---------|-----|-----|
| Primary (CTA) | `--color-primary` | `#384B3B` | Buttons, active states, headings |
| Primary Hover | `--color-primary-hover` | `#2d3e2f` | Button/link hover |
| Secondary | `--color-secondary` | `#8C4E32` | Accent text, secondary CTAs, company names |
| Secondary Hover | `--color-secondary-hover` | `#6e3d27` | Secondary hover |
| Background | `--color-bg` | `#fcf9f5` | Page background |
| Surface | `--color-surface` | `#f6f3ef` | Section backgrounds, input fills |
| Surface Lowest | `--color-surface-lowest` | `#ffffff` | Card backgrounds (white on cream) |
| Text Primary | `--color-text-main` | `#1c1c1a` | Main body text |
| Text Muted | `--color-text-muted` | `#434843` | Secondary/muted text |
| Accent | `--color-accent` | `#8BA888` | Tags, badges (sage green) |
| Accent Dark | `--color-accent-dark` | `#4a7547` | Accent hover/text |
| Border | `--color-border` | `#c3c8c0` | Minimal use — focus rings, form errors only |

**Typography:**
- Body/UI: Manrope (sans-serif) — clean, modern
- Headings: Newsreader (serif) — editorial, italic-capable

**Editorial typography patterns (ALWAYS follow):**
- Headlines: Use italic Newsreader for one emphasis word (e.g., `Find <em>Extraordinary</em> Talent`)
- Section labels/eyebrows: Uppercase, `tracking-widest`, tiny font size (`text-xs`), Manrope
- Numbered form sections: `01`, `02`, `03` in large italic serif numerals with left accent border
- Logo: Newsreader italic

**Surface Hierarchy — "No-Line Rule" (CRITICAL):**
- **NO** `1px` solid borders for sectioning cards or layout regions
- Differentiate surfaces by background color: `bg (#fcf9f5)` → `surface (#f6f3ef)` → `surface-lowest (#ffffff)`
- Use ambient dual-layer shadows for card elevation: `box-shadow: 0 1px 3px rgba(28,28,26,0.03), 0 8px 16px rgba(28,28,26,0.02)`
- Borders **only** allowed for: form focus rings, error state inputs, horizontal rules inside markdown prose, explicit `<hr>` elements
- Use `.shadow-ambient` / `.shadow-ambient-hover` CSS classes (defined in globals.css)

**Component patterns:**
- Buttons: Pill-shaped (`rounded-full`), primary = forest green, secondary = outline terracotta
- Cards: White on cream (`bg-surface-lowest`), `rounded-2xl`, ambient shadow, `hover:-translate-y-1`
- Inputs: Borderless (`border-0 bg-surface`), `rounded-xl`, uppercase `tracking-[0.1em]` labels
- Tags/skills: Pill-shaped (`rounded-full`), `uppercase tracking-wider`, sage green background
- Shadows: Always dual-layer ambient — never hard `drop-shadow` or `box-shadow` with dark color/opacity

**Design principles:** Editorial, high-contrast serif/sans pairing, intentional whitespace, asymmetric grids (7/5 or 8/4 spans). No generic AI aesthetics.

## Deployment Architecture
- **Frontend (Vercel):** Root directory = `selfserve-jobs-customer-web/`, env: `NEXT_PUBLIC_API_URL`
- **Backend (Cloud Run):** Docker image from `selfserve-jobs-customer-api/`, port 8080, scale-to-zero
- **Database (CloudSQL):** PostgreSQL 16, connected via Cloud SQL connector
- **Storage (GCS):** Bucket `jobs4u-resumes`, paths: `resumes/{profile_code}/{nanoid}.pdf`
- **Alembic migrations:** Run automatically on app startup (lifespan handler in `app/main.py`)

## Email Verification Flow (reference)
1. User creates job/profile → entity created with `status='pending_verification'`
2. Backend generates `verification_code` (64-char) + `edit_token` (64-char), stores in DB
3. Verification email sent via Resend: `{FRONTEND_URL}/verify?code={verification_code}`
4. Email also includes management link: `{FRONTEND_URL}/manage/{type}/{code}?token={edit_token}` (user bookmarks)
5. User clicks verify → `POST /api/v1/verify` → entity set to `active`
6. Verification codes expire after 24h. Resend limited to 3/entity/day.

## Status State Machine
`pending_verification` → `active` (on email verify)
`active` → `expired` (auto, via cron after `expires_at`)
`active` → `removed` (user deletes via magic link)
`active` → `under_review` (3+ reports trigger auto-hide)
`under_review` → `active` or `removed` (manual admin review)

## Naming Conventions
- Python: `snake_case` for everything
- TypeScript: `camelCase` for variables/functions, `PascalCase` for components/types
- DB columns: `snake_case`
- API routes: `kebab-case` where multi-word (e.g., `/verify/resend`)
- File names: `snake_case` for Python, `kebab-case` for Next.js pages, `PascalCase.tsx` for components

## Additional Notes
- Listing limits: max 5 active jobs + 2 active profiles per email address
- Listings expire after 60 days (auto-archived)
- Bot protection: honeypot fields + IP rate limiting on creation endpoints
- Never expose internal `id` columns in API responses — only `*_code` fields
- Email normalization: lowercase + trim on ingestion

## Directory Conventions
- **API directory:** `selfserve-jobs-customer-api/` (FastAPI backend)
- **Web directory:** `selfserve-jobs-customer-web/` (Next.js frontend)
- **Naming pattern for new services:** `selfserve-jobs-{audience}-{type}` (e.g. `selfserve-jobs-admin-api`, `selfserve-jobs-admin-web`)
- When referencing these directories in code, configs, or documentation, always use the full directory name — never abbreviate to "backend" or "frontend" as a folder path

## CI/CD Conventions
- Workflow files named `test-{app}.yml` and `deploy-{app}.yml` (e.g. `test-api.yml`, `deploy-web.yml`)
- Every deploy workflow must call its corresponding test workflow via `uses:` (reusable workflow) — never deploy without tests passing
- Path filters: API workflows trigger on `selfserve-jobs-customer-api/**`; web workflows trigger on `selfserve-jobs-customer-web/**`
- Do NOT trigger workflows on doc-only changes (CHANGELOG.md, PRODUCTION.md, AGENTS.md)
- **Do** trigger all workflows on changes to `.github/workflows/**` or `README.md` — workflow/infra changes should always be validated
- Required secrets for API deploy: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `GCP_PROJECT_ID`, `GCP_REGION`
- Required secrets for web deploy: `VERCEL_TOKEN`

## Testing Conventions
- **API tests:** pytest + pytest-asyncio, test files in `selfserve-jobs-customer-api/tests/`, named `test_*.py`
- **Web tests:** Vitest + @testing-library/react, test files colocated as `src/**/__tests__/*.test.{ts,tsx}`
- **API test DB:** SQLite in-memory via aiosqlite — no Postgres required in CI or local test runs
- **Mock external services** (email, GCS storage) in all tests — never call real APIs in tests
- **Do NOT test** Postgres-specific features (JSONB `contains()`, GIN indexes, full-text search) with the SQLite test DB — these are integration-test-only concerns
- Test priorities: endpoint HTTP contracts (status codes, response shapes), service business logic, pure utility functions, and key component rendering

## Pre-commit Hook Rules
- Pre-commit hooks managed by Husky (root `package.json`) — do NOT use the `pre-commit` Python framework
- When Python files are staged: run `ruff check` + `ruff format --check`
- When TypeScript files are staged: run `eslint`
- When API files are staged: run `pytest tests/ -x -q`
- When web files are staged: run `vitest run`
- Hook file: `.husky/pre-commit`

## Documentation Maintenance

**CRITICAL: CHANGELOG.md must be updated in the same commit as every change — no exceptions.**
- Use [Keep a Changelog](https://keepachangelog.com) format: Added, Changed, Fixed, Removed sections under `## [Unreleased]`
- Every code change, bug fix, CI/infrastructure fix, and behavioural change gets an entry — even if it's internal or not end-user-facing
- Write the entry before committing, not after
- Do NOT batch changelog entries across multiple commits — each commit's changelog entry describes only that commit's changes

**Other docs:**
- **PRODUCTION.md:** Update in the same commit whenever deployment steps, infrastructure setup, IAM grants, or required secrets change
- **README.md:** Update when architecture, local dev setup, or project structure changes materially
- **AGENTS.md:** Update when adding new conventions, changing tech stack, or when given new directions that should apply to future sessions

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
