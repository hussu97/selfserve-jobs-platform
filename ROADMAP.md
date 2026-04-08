# jobs4u Platform Roadmap

Prioritized list of issues and improvements identified from a full codebase audit (April 2026).

---

## Phase 1 — Security & Silent Failures

> Critical items. Address before any feature work.

- [ ] **Delete `resend_api.key` from disk** — Real Resend API key sitting in repo root. Already gitignored via `*.key` but should not exist locally. Revoke key in Resend dashboard and rotate.
- [ ] **Handle email send failures in routers** — `send_verification_email()` returns `False` on failure but callers in `jobs.py` and `profiles.py` routers ignore it. Users get 201 Created but never receive their verification email. Check return value; raise HTTP 503 on failure.
- [ ] **Make Resend SDK calls non-blocking** — `resend.Emails.send()` is synchronous, called inside `async` functions in `email_service.py`. Blocks the event loop. Wrap in `asyncio.to_thread()`.
- [ ] **Tighten CORS `allow_methods`** — `main.py` uses `allow_methods=["*"]` with `allow_credentials=True`. Change to `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`.
- [ ] **Remove hardcoded dev DB URL from `alembic.ini`** — Contains `postgresql+asyncpg://jobs4u:jobs4u_dev@localhost:5432/jobs4u`. Replace with placeholder `driver://`. Runtime override in `env.py` already works.

---

## Phase 2 — Bug Fixes & Expiry Cron

> Correctness issues affecting users now.

- [ ] **Implement auto-expiry cron for listings** — `expires_at` is set on creation but nothing transitions listings to `expired` status. Add `POST /api/v1/internal/expire-listings` endpoint (protected by shared secret). SQL: `UPDATE job SET status='expired' WHERE status='active' AND expires_at < now()` (same for profile). Wire to Cloud Scheduler.
- [ ] **Fix stale view count in detail responses** — `get_job_detail()` and `get_profile_detail()` increment view count AFTER fetching the object. Response always shows count 1 behind. Increment first, then bump the Python object before returning.
- [ ] **Add contact_method validator to `JobUpdate` / `ProfileUpdate`** — `JobCreate` has a `@model_validator` ensuring `contact_method` matches `contact_email`/`contact_url`, but update schemas lack it. Can create invalid state (e.g. `contact_method="email"` with `contact_email=None`).
- [ ] **Clarify detail view status filtering** — `get_job_detail()` allows `pending_verification` status but `list_jobs()` only returns `active`. Either document this as intentional preview behavior or gate pending listings behind `X-Edit-Token`.

---

## Phase 3 — Infrastructure Hardening

> Production readiness and operational safety.

- [ ] **Fix deploy workflow env vars** — `deploy-api.yml` calls `gcloud run deploy` without `--set-env-vars`. Add secrets refs for `DATABASE_URL`, `RESEND_API_KEY`, `FRONTEND_URL`, `GCS_BUCKET_NAME`, `ENVIRONMENT`.
- [ ] **Restrict GCS CORS** — Current config allows `origin: ["*"]`. Replace with actual frontend domain(s).
- [ ] **Harden Dockerfile** — Add non-root user (`adduser appuser` + `USER appuser`) and `HEALTHCHECK` pointing to `/api/v1/health`.
- [ ] **Add HTTP rate limiting** — CLAUDE.md specifies rate limiting on create/verify/resend endpoints but only service-level listing limits exist. Add `slowapi` middleware on `POST /jobs`, `POST /profiles`, `POST /verify`, `POST /verify/resend`.
- [ ] **Index email columns** — `email` field on Job and Profile models is used in many queries (rate limiting, management links, verification) but has no index. Add `index=True` + Alembic migration.
- [ ] **Restrict Next.js `remotePatterns`** — `next.config.ts` allows wildcard `hostname: '**'` for images. Restrict to specific domains (GCS bucket, CDN).

---

## Phase 4 — Frontend Polish & Test Coverage

> Quality, SEO, and developer confidence.

- [ ] **Add error boundaries** — No `error.tsx` files exist. Create in `app/`, `app/jobs/`, `app/profiles/` with user-friendly fallback UI.
- [ ] **Expand test coverage** — 11 backend tests, 5 frontend test files. Missing: verification flow, email failure handling, update validators, view count, form components, error boundaries.
- [ ] **Add OG images for social sharing** — No `opengraph-image.tsx` files. Use Next.js `ImageResponse` for dynamic social cards on job and profile detail pages.
- [ ] **Paginate sitemap** — `sitemap.ts` fetches max 500 items with no pagination. Refactor to use `generateSitemaps()` for sitemap index with paginated children.
- [ ] **Replace hardcoded color values** — Some components (e.g. `verify/page.tsx`) use raw hex like `hover:bg-[#2D5F3A]` instead of design tokens. Audit and replace with CSS custom properties.
- [ ] **Add frontend file upload size validation** — Only checks MIME type. Add 5MB size check before upload begins (backend already validates server-side).

---

## Dependency Notes

- **Auto-expiry cron** (Phase 2) needs **deploy workflow env vars** (Phase 3) to work in production — develop locally first, deploy after Phase 3.
- **Email index** (Phase 3) should land before expiry cron goes live (cron queries benefit from it).
- **Test expansion** (Phase 4) should cover all changes from Phases 1–3.
