# jobs4u — Claude Code Guidelines

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
- Alembic for DB migrations. Never run migrations from the main app process — use a separate migration step.
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
**Earth-tone palette — always use these values:**
| Token | Hex | Use |
|-------|-----|-----|
| Primary (CTA) | `#C2703E` | Buttons, active states |
| Secondary | `#2D5F3A` | Headers, important text |
| Background | `#FAF7F2` | Page background |
| Surface | `#F0EBE1` | Card backgrounds |
| Text Primary | `#2C2825` | Main text |
| Text Secondary | `#7A7067` | Muted text |
| Accent | `#8BA888` | Tags, badges |
| Border | `#DDD5C8` | Dividers, input borders |

**Typography:**
- Body: Inter (sans-serif)
- Headings: Lora (serif) — gives warmth without feeling corporate

**Design principles:** Minimalistic, lightweight, easy to browse. No generic AI aesthetics. Subtle earth textures/tones only.

## Deployment Architecture
- **Frontend (Vercel):** Root directory = `frontend/`, env: `NEXT_PUBLIC_API_URL`
- **Backend (Cloud Run):** Docker image from `backend/`, port 8080, scale-to-zero
- **Database (CloudSQL):** PostgreSQL 16, connected via Cloud SQL connector
- **Storage (GCS):** Bucket `jobs4u-resumes`, paths: `resumes/{profile_code}/{nanoid}.pdf`
- **Alembic migrations:** Run as separate Cloud Run job before deploy, never on app startup

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
