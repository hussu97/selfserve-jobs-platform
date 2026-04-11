# jobs4u Platform Roadmap

Prioritized list of issues and improvements from a full-system audit (April 2026).
Organized into phases by criticality. Each phase should be completed before starting the next unless otherwise noted.

---

## Phase 1 — Critical Security & Silent Failures

> Fix before any feature work. These items expose data, enable abuse, or silently break core flows.

### Security

- [x] **Delete `resend_api.key` from disk** — File did not exist locally; confirmed clean.
- [x] **Remove hardcoded dev DB URL from `alembic.ini`** — Replaced with placeholder `driver://`. Runtime override in `env.py` already works.
- [x] **Remove default DB URL from `app/config.py`** — Default value removed; startup fails loudly if `DATABASE_URL` env var is not set.
- [x] **Tighten CORS `allow_methods`** — Changed to `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`; `allow_headers` restricted to explicit whitelist.
- [x] **Add security response headers middleware** — Added `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Content-Security-Policy: default-src 'none'`.
- [x] **Validate `contact_url` scheme** — Added `field_validator` to both `JobCreate` and `JobUpdate` rejecting non-http/https schemes.
- [x] **Restrict Next.js `remotePatterns`** — Restricted to `storage.googleapis.com` (https only).
- [x] **Sanitize ReactMarkdown rendering** — `allowedElements` whitelist added to `JobDetail.tsx` and `ProfileDetail.tsx`.
- [x] **Add request body size limit** — Middleware added rejecting payloads > 10MB with HTTP 413.

### Silent Failures

- [x] **Handle email send failures in routers** — All callsites now check return value and raise HTTP 503 on failure (profiles.py, verification.py, auth.py, recruiters.py).
- [x] **Make Resend SDK calls non-blocking** — `resend.Emails.send()` now wrapped in `asyncio.to_thread()` in `email_service.py`.

---

## Phase 2 — Bug Fixes, Rate Limiting & Auth Hardening

> Correctness issues affecting users now, plus rate limiting to prevent abuse.

### Bug Fixes

- [x] **Fix stale view count in detail responses** — `get_job_detail()` and `get_profile_detail()` now do atomic `UPDATE view_count+1` before SELECT; removed separate POST /view endpoints and ViewTracker; GET detail now always returns accurate count.
- [x] **Add contact_method validator to `JobUpdate` / `ProfileUpdate`** — `model_validator` added to `JobUpdate`; `ProfileUpdate` has no contact fields so no change needed.
- [x] **Prevent status field in update payloads** — `update_job` and `update_profile` now use explicit field whitelists instead of generic `setattr()` loop.
- [x] **Fix race condition in duplicate report detection** — DB-level unique constraint `uq_report_entity_reporter` on `(entity_type, entity_code, reporter_email)` added via migration 0006.
- [x] **Clarify detail view status filtering** — documented as intentional preview behaviour in service docstrings.

### Rate Limiting

- [x] **Add HTTP rate limiting on create/verify/resend endpoints** — `slowapi` added; limits: 10 creates/hour/IP on POST /jobs and /profiles, 5/minute on POST /verify, 3/day on POST /verify/resend, 10/hour on POST /reports.
- [x] **Rate-limit view count endpoints** — Separate POST /view endpoints removed; view increment now happens inline in GET detail (no separate endpoint to abuse).
- [x] **Add max pagination guard** — `page` query param capped at `MAX_PAGE=200` on GET /jobs and GET /profiles; returns HTTP 422 beyond that.

### Auth Hardening

- [x] **Reduce admin session expiry** — Admin sessions now use `ADMIN_SESSION_EXPIRY_DAYS=7`; inactivity timeout of 1 hour enforced via `last_active_at` in `validate_session`.
- [x] **Invalidate sessions on recruiter status change** — `reject_recruiter` and `reject_recruiter_with_reason` now DELETE all `auth_session` rows for the rejected recruiter's email.

---

## Phase 3 — Infrastructure Hardening & Observability

> Production readiness, deployment safety, and operational visibility.

### Deployment & Docker

- [x] **Harden Dockerfile** — Multi-stage build, non-root `appuser`, `HEALTHCHECK` pointing to `/api/v1/health`.
- [x] **Add `.dockerignore`** — Added, excludes `.env*`, `.venv`, `__pycache__`, `tests/`, `*.md`, `uv.lock`.
- [x] **Pin Docker base image digest** — Base image pinned to `python:3.12-slim@sha256:804ddf3...`.
- [x] **Add pre-deploy health check in CI** — `deploy-api.yml` polls `/api/v1/health` up to 5 times after deploy.
- [x] **Add secrets validation step in CI** — `deploy-api.yml` validates all 4 required GCP secrets before auth.
- [ ] **Restrict GCS CORS** — Current config allows `origin: ["*"]`. Replace with actual frontend domain(s). (Requires GCS bucket config change — done via `gsutil` or Console, not code.)

### Health & Observability

- [x] **Expand health check to verify dependencies** — `GET /api/v1/health` now runs `SELECT 1` and returns 503 if DB is unreachable.
- [x] **Add structured JSON logging** — `pythonjsonlogger` replaces `basicConfig`; JSON format in production, plain text in dev, toggled via `LOG_FORMAT` env var.
- [x] **Add request correlation IDs** — UUID generated per request, propagated via `X-Request-Id` response header; available as `request.state.request_id`.
- [x] **Integrate error tracking (Sentry)** — `sentry-sdk[fastapi]` added; activated when `SENTRY_DSN` env var is set.
- [x] **Add connection pool monitoring** — Engine `connect` and `checkin` events log at DEBUG level.
- [x] **Add query timeout** — PostgreSQL connections now use `statement_timeout=30000ms` via `connect_args`.
- [x] **Add slow query logging** — SQLAlchemy event hooks log a WARNING for queries exceeding 500ms.

### Database

- [x] **Index email columns** — `ix_job_email`, `ix_profile_email` added via migration 0006.
- [x] **Add compound index `(status, expires_at)`** — `ix_job_status_expires_at`, `ix_profile_status_expires_at` added via migration 0006.
- [x] **Add compound index `(entity_type, entity_code)` on `email_verification`** — `ix_email_verification_entity` added via migration 0006.
- [x] **Add compound index `(email, status)` on job/profile** — `ix_job_email_status`, `ix_profile_email_status` added via migration 0006.

---

## Phase 4 — Implement Auto-Expiry & Data Lifecycle

> Listings currently never expire despite having `expires_at` set. This phase implements the full lifecycle.

- [ ] **Implement auto-expiry cron for listings** — `expires_at` is set on creation but nothing transitions listings to `expired` status. Add `POST /api/v1/internal/expire-listings` endpoint (protected by shared secret). SQL: `UPDATE job SET status='expired' WHERE status='active' AND expires_at < now()` (same for profile). Wire to Cloud Scheduler.
- [ ] **Add session/token cleanup job** — Auth sessions, expired verification codes, and email logs grow unbounded. Add scheduled cleanup for records older than 30/90 days respectively.
- [ ] **Add resume cleanup for removed profiles** — When a profile is removed, the GCS resume file should be deleted. Currently orphaned.
- [ ] **Send expiry warning emails** — Notify listing owners 7 days before expiry with option to renew (extend 60 days).

---

## Phase 5 — Frontend Quality & Accessibility

> Polish, accessibility compliance, and user experience improvements.

### Accessibility (WCAG 2.1 AA)

- [ ] **Add skip-to-main-content link** — No skip link for keyboard navigation. Add as first focusable element in layout.
- [ ] **Fix modal focus trap** — `Modal.tsx` lacks focus trap. Tab key can escape the modal to background content. Implement focus-trap-react or manual trap.
- [ ] **Add keyboard support to dropdowns** — `CreateListingDropdown` in Header opens/closes with click only. Add Enter/Space to open, Escape to close, arrow keys to navigate.
- [ ] **Verify color contrast ratios** — CSS variable color combinations (e.g., `text-text-muted` on `bg-surface`) not verified against WCAG AA 4.5:1 minimum. Audit all combinations.
- [ ] **Add `aria-busy` to loading states** — Form submissions and page loads don't signal loading state to screen readers.
- [ ] **Add `aria-current="page"` to nav links** — Active navigation item not programmatically indicated.

### UX Improvements

- [ ] **Add confirmation dialog for destructive actions** — Delete job/profile on manage page has no confirmation. Add modal: "Are you sure? This cannot be undone."
- [ ] **Preserve form data on submission failure** — API errors cause form data loss. Retain all field values on error; show inline error message.
- [ ] **Add loading skeletons to detail pages** — Job and profile detail pages show nothing while data loads. Add skeleton UI matching the final layout.
- [ ] **Add search loading indicator** — 350ms debounce on search with no visual feedback. Add spinner or "Searching..." text during debounce.
- [ ] **Improve empty state messaging** — Empty search results show generic message. Add suggestions: "Try broadening your filters" or popular categories.
- [ ] **Add toast notification system** — Success/error messages only shown in modals. Add lightweight toast for non-blocking feedback (e.g., "Listing saved", "Link copied").
- [ ] **Form validation on blur** — Forms only validate on submit. Add field-level validation on blur for immediate feedback.

### Performance

- [ ] **Memoize card components** — `JobCard` and `ProfileCard` not wrapped in `React.memo`. Lists re-render all cards on any filter change.
- [ ] **Lazy-load form sections** — `ProfileForm.tsx` (300+ lines) and `JobForm.tsx` (355+ lines) load entirely upfront. Extract numbered sections into lazy-loaded components.
- [ ] **Defer analytics scripts** — Umami loads with `afterInteractive` strategy. Switch to `lazyOnload` since analytics is non-critical.
- [ ] **Add Suspense boundaries with skeletons** — Async data fetches on list/detail pages lack Suspense. Add boundaries with skeleton fallbacks.

---

## Phase 6 — SEO & Structured Data

> Search engine visibility and social sharing improvements.

- [ ] **Add canonical URLs to detail pages** — `/jobs/[jobCode]` and `/profiles/[profileCode]` lack canonical link tags. Risk of duplicate content if accessed via multiple URL patterns.
- [ ] **Add breadcrumb structured data** — `Breadcrumbs.tsx` component exists but is never rendered on list or detail pages. Add to job/profile routes with BreadcrumbList schema.
- [ ] **Add default Open Graph image** — Root layout has title/description metadata but no `og:image`. Add branded fallback image for pages without custom OG.
- [ ] **Disallow admin routes in robots.txt** — `robots.ts` doesn't exclude `/admin/*`. Add `disallow: ['/admin/']`.
- [ ] **Add blog post structured data** — Blog pages missing `Article` schema, `og:type: "article"`, and author metadata.
- [ ] **Validate sitemap size** — Dynamic sitemap generates multiple files but doesn't enforce the 50,000 URL / 50MB per-file limits. Add validation.

---

## Phase 7 — Test Coverage & CI Hardening

> Developer confidence and automated quality gates.

### Backend Tests

- [ ] **Test email failure scenarios** — No tests for when Resend API is down or returns errors. Mock failures and verify routers return 503.
- [ ] **Test verification flow end-to-end** — Create entity, send verification, verify, check status transitions. Include expired code and resend scenarios.
- [ ] **Test update validators** — Ensure `contact_method`/`contact_email`/`contact_url` consistency enforced on updates (once Phase 2 fix is in).
- [ ] **Test view count atomicity** — Concurrent view increments should all succeed and produce correct final count.
- [ ] **Test rate limiting under load** — Verify rate limits actually reject excess requests (once Phase 2 limits are in).
- [ ] **Test admin rejection flow** — Create recruiter, admin rejects, verify session invalidated, verify entity status.
- [ ] **Test report auto-hide threshold** — Submit 3 reports for same entity, verify status changes to `under_review`.
- [ ] **Test GCS upload failure handling** — Mock GCS errors and verify graceful fallback.

### Frontend Tests

- [ ] **Test form submission and validation** — All form components (JobForm, ProfileForm) with valid/invalid data, error states, loading states.
- [ ] **Test search and filter interactions** — Debounce behavior, URL parameter sync, empty results, filter clearing.
- [ ] **Test error boundary rendering** — Trigger errors in child components, verify error UI renders correctly.
- [ ] **Test authentication flows** — Login, session persistence, logout, expired session handling.
- [ ] **Test responsive layouts** — Key pages at mobile/tablet/desktop breakpoints.

### CI Improvements

- [x] **Add dependency caching to CI** — `test-api.yml` caches `~/.cache/uv` keyed on `pyproject.toml` hash.
- [x] **Add security scanning to CI** — `bandit -r app/ -ll` added to `test-api.yml`; `npm audit --audit-level=high` added to `test-web.yml`; both non-blocking.
- [ ] **Add E2E test suite** — No Playwright/Cypress tests. Add critical path E2E: create listing -> verify email -> browse -> view detail -> manage -> delete.
- [ ] **Parallelize API and web test jobs** — Currently sequential. Run in parallel GitHub Actions jobs.

---

## Phase 8 — Admin Portal Enhancements

> Improve admin tooling for content moderation and operations.

- [ ] **Add admin audit log** — No record of who approved/rejected which recruiter, when, or why. Add `admin_audit_log` table: `(id, admin_email, action, entity_type, entity_code, details_json, created_at)`. Log all admin mutations.
- [ ] **Add manual entity flagging** — Admins cannot manually flag a job/profile for removal without waiting for 3 reports. Add `POST /api/v1/admin/entities/{type}/{code}/flag` with reason.
- [ ] **Add session invalidation on admin email removal** — If admin email is removed from `ADMIN_EMAILS` config, existing sessions for that email should be invalidated on next request.

---

## Phase 9 — Email & Compliance

> Email delivery reliability and legal compliance.

- [ ] **Add List-Unsubscribe header** — All transactional emails lack unsubscribe mechanism. Required by CAN-SPAM (US) and good practice under GDPR. Add `List-Unsubscribe` header with mailto and URL options.
- [ ] **Implement email retry with backoff** — Single-attempt email sends with no retry. Add exponential backoff retry (3 attempts, 1s/5s/30s delays) before marking as failed.
- [ ] **Add circuit breaker for Resend** — If Resend API fails repeatedly, stop attempting sends for a cooldown period rather than queuing failures. Log circuit state changes.
- [ ] **Add report notification emails for admins** — `send_admin_new_recruiter_notification` function exists but is never called. Implement admin notification for: new reports (3+ threshold), new recruiter registrations.
- [ ] **Remove hardcoded domain from email templates** — `base.py` hardcodes `hirebridgeuae.com`. Pull from `settings.frontend_url` for compatibility with custom domains.

---

## Phase 10 — Scalability & Performance

> Prepare for growth beyond initial launch traffic.

### Backend

- [ ] **Fix N+1 query in admin report listing** — `admin_service.py` enriches each report with entity title in a loop (1 + N queries). Refactor to use JOIN or batch IN clause.
- [ ] **Batch view count writes** — Each page view triggers an atomic UPDATE. At scale, high-traffic listings cause write contention. Buffer counts in Redis (or in-memory), flush to DB on interval (e.g., every 60 seconds).
- [ ] **Add query result caching** — List endpoints (browse jobs/profiles) hit DB on every request. Add short TTL cache (30-60s) for list queries using Redis or in-memory cache.
- [ ] **Enforce max key_skills array length** — JSONB `key_skills` arrays have no max length at DB level. Add CHECK constraint: `array_length(key_skills, 1) <= 30`.
- [ ] **Add graceful shutdown handling** — Lifespan handler only covers startup. Add shutdown hook to drain in-flight requests and close DB connections cleanly.

### Frontend

- [ ] **Implement ISR or SWR caching for browse pages** — List pages fetch fresh data on every navigation. Add `revalidate` to server components or use SWR for client-side caching.
- [ ] **Add image CDN optimization** — Profile/company images (if added) should go through Next.js Image Optimization with specific width/quality settings.
- [ ] **Bundle analysis and code splitting** — No bundle analysis configured. Add `@next/bundle-analyzer` to identify and split large chunks.

### Database

- [ ] **Connection pooling with PgBouncer** — Direct asyncpg connections to CloudSQL limited by instance. Add PgBouncer for connection multiplexing at scale.

---

## Phase 11 — Feature Requests

> New capabilities requested or identified during audit.

### User-Facing Features

- [ ] **Job/profile renewal flow** — Listings expire after 60 days with no renewal mechanism. Add "Renew" button on manage page that extends `expires_at` by 60 days (max 2 renewals).
- [ ] **Saved search alerts** — Users can bookmark listings but can't save searches. Add ability to save search criteria and receive weekly email with new matches.
- [ ] **Application tracking (lightweight)** — No way for job posters to know how many people clicked their contact link. Add anonymous click tracking on contact_url/contact_email reveal.
- [ ] **Similar listings recommendations** — Detail pages show no related content. Add "Similar Jobs" / "Similar Profiles" section based on matching skills/location.
- [ ] **Dark mode** — No dark mode specification or implementation. Add theme toggle respecting `prefers-color-scheme`, using design system CSS variables.

### Platform Features

- [ ] **Employer/company profiles** — Jobs are standalone with no company page. Add optional company profile that groups all listings from the same company.
- [ ] **API rate limit headers** — API doesn't return rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`). Add to all rate-limited endpoints.
- [ ] **Public API for job boards** — No public API for third-party aggregators. Add read-only API with API key auth for partners to pull active listings.

---

## Phase 12 — Documentation & Developer Experience

> Improve onboarding, troubleshooting, and operational runbooks.

- [ ] **Add troubleshooting section to PRODUCTION.md** — No guidance for common failures: migration errors, GCS auth failures, Resend outages, CloudSQL connection limits.
- [ ] **Add API documentation (OpenAPI)** — FastAPI auto-generates OpenAPI spec but no security scheme declared, no 429 response documented, no example values on schemas. Enrich OpenAPI spec.
- [ ] **Export design tokens as JSON** — Design system lives only in CLAUDE.md and HTML mockups. Export as `design-tokens.json` consumable by Tailwind config and email templates.

---

## Dependency Notes

- **Rate limiting** (Phase 2) should land before **auto-expiry cron** (Phase 4) — cron endpoint needs protection.
- **Email index** (Phase 3) should land before **expiry cron** goes live — cron queries benefit from it.
- **Structured logging** (Phase 3) should land before **Sentry** — structured logs make Sentry context richer.
- **Auto-expiry cron** (Phase 4) needs **deploy workflow env vars** (Phase 3) to work in production.
- **Test expansion** (Phase 7) should cover all changes from Phases 1-6.
- **Admin audit log** (Phase 8) should land before **admin 2FA** — audit trail captures auth events.
- **Email retry** (Phase 9) depends on **non-blocking Resend** (Phase 1) — can't retry blocking calls efficiently.

---

## Completed Items

> Items from previous roadmap versions that have been shipped.

- [x] **Add error boundaries** — `error.tsx` files in `app/`, `app/jobs/`, `app/profiles/` with user-friendly fallback UI.
- [x] **Add OG images for social sharing** — `opengraph-image.tsx` with dynamic social cards on job and profile detail pages.
- [x] **Paginate sitemap** — `sitemap.ts` refactored to use `generateSitemaps()` for sitemap index with paginated children.
- [x] **Replace hardcoded color values** — Audit of raw hex values replaced with CSS custom properties.
- [x] **Add frontend file upload size validation** — 5MB size check before upload begins.
