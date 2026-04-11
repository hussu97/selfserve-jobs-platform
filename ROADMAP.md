# jobs4u Platform Roadmap

Prioritized list of issues and improvements from a full-system audit (April 2026).
Organized into phases by criticality. Each phase should be completed before starting the next unless otherwise noted.

---

## Phase 1 — Critical Security & Silent Failures

> Fix before any feature work. These items expose data, enable abuse, or silently break core flows.

### Security

- [ ] **Delete `resend_api.key` from disk** — Real Resend API key sitting in repo root. Already gitignored via `*.key` but should not exist locally. Revoke key in Resend dashboard and rotate.
- [ ] **Remove hardcoded dev DB URL from `alembic.ini`** — Contains `postgresql+asyncpg://jobs4u:jobs4u_dev@localhost:5432/jobs4u`. Replace with placeholder `driver://`. Runtime override in `env.py` already works.
- [ ] **Remove default DB URL from `app/config.py`** — Default value embeds dev credentials in source. Require env var; fail loudly on startup if missing.
- [ ] **Tighten CORS `allow_methods`** — `main.py` uses `allow_methods=["*"]` with `allow_credentials=True`. Change to `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`. Also restrict `allow_headers` to explicit whitelist instead of `["*"]`.
- [ ] **Add security response headers middleware** — Missing `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Content-Security-Policy`. Add middleware in `main.py`.
- [ ] **Validate `contact_url` scheme** — `contact_url` field accepts any URL. Restrict to `http`/`https` only via Pydantic `HttpUrl` or manual validation to prevent `javascript:` / `data:` XSS vectors.
- [ ] **Restrict Next.js `remotePatterns`** — `next.config.ts` allows wildcard `hostname: '**'` for images. Restrict to GCS bucket and known CDN domains.
- [ ] **Sanitize ReactMarkdown rendering** — `JobDetail.tsx` renders markdown without `allowedElements` whitelist. Add explicit element whitelist to prevent XSS.
- [ ] **Add request body size limit** — No max request size configured. Add middleware to reject payloads > 10MB (excluding file uploads which use GCS signed URLs).

### Silent Failures

- [ ] **Handle email send failures in routers** — `send_verification_email()` returns `False` on failure but callers in `jobs.py` and `profiles.py` routers ignore it. Users get 201 Created but never receive their verification email. Check return value; raise HTTP 503 on failure.
- [ ] **Make Resend SDK calls non-blocking** — `resend.Emails.send()` is synchronous, called inside `async` functions in `email_service.py`. Blocks the event loop. Wrap in `asyncio.to_thread()`.

---

## Phase 2 — Bug Fixes, Rate Limiting & Auth Hardening

> Correctness issues affecting users now, plus rate limiting to prevent abuse.

### Bug Fixes

- [ ] **Fix stale view count in detail responses** — `get_job_detail()` and `get_profile_detail()` increment view count AFTER fetching the object. Response always shows count 1 behind. Increment first, then bump the Python object before returning.
- [ ] **Add contact_method validator to `JobUpdate` / `ProfileUpdate`** — `JobCreate` has a `@model_validator` ensuring `contact_method` matches `contact_email`/`contact_url`, but update schemas lack it. Can create invalid state.
- [ ] **Prevent status field in update payloads** — `update_job` and `update_profile` use generic `setattr()` loop from `model_dump(exclude_unset=True)`. If `status` is included in the update schema, it bypasses the deactivate/activate endpoints. Whitelist updatable fields explicitly.
- [ ] **Fix race condition in duplicate report detection** — `report_service.py` does check-then-insert without atomicity. Two concurrent requests can bypass duplicate check. Use DB-level unique constraint on `(entity_type, entity_code, reporter_email)` or `SELECT ... FOR UPDATE`.
- [ ] **Clarify detail view status filtering** — `get_job_detail()` allows `pending_verification` status but `list_jobs()` only returns `active`. Either document this as intentional preview behavior or gate pending listings behind `X-Edit-Token`.

### Rate Limiting

- [ ] **Add HTTP rate limiting on create/verify/resend endpoints** — CLAUDE.md specifies this but only service-level listing limits exist. Add `slowapi` middleware on `POST /jobs`, `POST /profiles`, `POST /verify`, `POST /verify/resend`, `POST /reports`. Suggested limits: 10 creates/hour/IP, 5 verifies/minute/IP, 3 resends/day/entity.
- [ ] **Rate-limit view count endpoints** — View increment endpoints have no rate limit. Allow artificial inflation. Add per-IP throttle (e.g., 1 view per entity per IP per hour).
- [ ] **Add max pagination guard** — Large `page` values cause expensive OFFSET queries. Cap at a reasonable max (e.g., page <= 200) and return 400 beyond that.

### Auth Hardening

- [ ] **Reduce admin session expiry** — Currently 30 days. Reduce to 7 days. Add inactivity timeout (1 hour idle = session invalidated).
- [ ] **Invalidate sessions on recruiter status change** — If a recruiter is rejected by admin, their existing session token remains valid for up to 30 days. Invalidate sessions when recruiter status changes to `rejected`/`suspended`.

---

## Phase 3 — Infrastructure Hardening & Observability

> Production readiness, deployment safety, and operational visibility.

### Deployment & Docker

- [ ] **Harden Dockerfile** — Add non-root user (`adduser appuser` + `USER appuser`), `HEALTHCHECK` pointing to `/api/v1/health`, and multi-stage build to reduce image size and attack surface.
- [ ] **Add `.dockerignore`** — Missing entirely. Exclude `.env*`, `.git`, `__pycache__`, `tests/`, `*.md` from build context.
- [ ] **Pin Docker base image digest** — Use `python:3.12-slim@sha256:...` instead of mutable tag to ensure reproducible builds.
- [ ] **Add pre-deploy health check in CI** — After `gcloud run deploy`, validate the new revision responds 200 on `/api/v1/health` before marking deployment successful.
- [ ] **Add secrets validation step in CI** — Check that required secrets are non-empty before attempting deployment. Fail fast with clear error.
- [ ] **Restrict GCS CORS** — Current config allows `origin: ["*"]`. Replace with actual frontend domain(s).

### Health & Observability

- [ ] **Expand health check to verify dependencies** — Current `/api/v1/health` returns static `{"status": "ok"}`. Add DB connectivity check, and optionally GCS/Resend reachability. Return 503 if DB is down.
- [ ] **Add structured JSON logging** — Replace basic logging with `python-json-logger` or `structlog`. Include request_id, timestamp, level, module in every log line. Essential for Cloud Run log aggregation.
- [ ] **Add request correlation IDs** — Generate unique request ID per request, propagate through all log messages. Return in `X-Request-Id` response header for debugging.
- [ ] **Integrate error tracking (Sentry)** — No error tracking exists. 500 errors are invisible. Add Sentry SDK to both API and web, configured per environment.
- [ ] **Add connection pool monitoring** — Pool size 10, max_overflow 20, but no visibility. Log pool checkout/checkin events at DEBUG level; alert if pool utilization > 80%.
- [ ] **Add query timeout** — No `statement_timeout` configured. Long-running queries can block the connection pool indefinitely. Set 30s default via SQLAlchemy `execution_options`.
- [ ] **Add slow query logging** — Log queries exceeding 500ms threshold. SQLAlchemy event hooks make this straightforward.

### Database

- [ ] **Index email columns** — `email` field on Job and Profile models is used in many queries (rate limiting, management links, verification) but has no index. Add `index=True` + Alembic migration.
- [ ] **Add compound index `(status, expires_at)`** — Needed for efficient expiry cron queries. Without it, full table scan on every cron run.
- [ ] **Add compound index `(entity_type, entity_code)` on `email_verification`** — Verification lookups use both fields but no composite index exists.
- [ ] **Add compound index `(email, status)` on job/profile** — Used by active listing count checks and session entity lookups.

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

- [ ] **Add dependency caching to CI** — `test-api.yml` installs Python deps fresh every run. Add `uv cache` or pip caching step.
- [ ] **Add security scanning to CI** — Run `bandit` (Python SAST) and `npm audit` on every PR. Block merge on high-severity findings.
- [ ] **Add E2E test suite** — No Playwright/Cypress tests. Add critical path E2E: create listing -> verify email -> browse -> view detail -> manage -> delete.
- [ ] **Parallelize API and web test jobs** — Currently sequential. Run in parallel GitHub Actions jobs.

---

## Phase 8 — Admin Portal Enhancements

> Improve admin tooling for content moderation and operations.

- [ ] **Add admin audit log** — No record of who approved/rejected which recruiter, when, or why. Add `admin_audit_log` table: `(id, admin_email, action, entity_type, entity_code, details_json, created_at)`. Log all admin mutations.
- [ ] **Add manual entity flagging** — Admins cannot manually flag a job/profile for removal without waiting for 3 reports. Add `POST /api/v1/admin/entities/{type}/{code}/flag` with reason.
- [ ] **Add admin dashboard metrics** — Show counts: active jobs, active profiles, pending recruiters, open reports, listings expiring this week. Single SQL query, cached 5 minutes.
- [ ] **Add session invalidation on admin email removal** — If admin email is removed from `ADMIN_EMAILS` config, existing sessions for that email should be invalidated on next request.

---

## Phase 9 — Email & Compliance

> Email delivery reliability and legal compliance.

- [ ] **Add List-Unsubscribe header** — All transactional emails lack unsubscribe mechanism. Required by CAN-SPAM (US) and good practice under GDPR. Add `List-Unsubscribe` header with mailto and URL options.
- [ ] **Implement email retry with backoff** — Single-attempt email sends with no retry. Add exponential backoff retry (3 attempts, 1s/5s/30s delays) before marking as failed.
- [ ] **Add circuit breaker for Resend** — If Resend API fails repeatedly, stop attempting sends for a cooldown period rather than queuing failures. Log circuit state changes.
- [ ] **Add report notification emails for admins** — `send_admin_new_recruiter_notification` function exists but is never called. Implement admin notification for: new reports (3+ threshold), new recruiter registrations.
- [ ] **Remove hardcoded domain from email templates** — `base.py` hardcodes `hirebridgeuae.com`. Pull from `settings.frontend_url` for compatibility with custom domains.
- [ ] **Add email delivery tracking** — Email logs exist in DB but no way to query delivery status. Add admin endpoint to view recent email logs with status.

---

## Phase 10 — Scalability & Performance

> Prepare for growth beyond initial launch traffic.

### Backend

- [ ] **Fix N+1 query in admin report listing** — `admin_service.py` enriches each report with entity title in a loop (1 + N queries). Refactor to use JOIN or batch IN clause.
- [ ] **Batch view count writes** — Each page view triggers an atomic UPDATE. At scale, high-traffic listings cause write contention. Buffer counts in Redis (or in-memory), flush to DB on interval (e.g., every 60 seconds).
- [ ] **Add query result caching** — List endpoints (browse jobs/profiles) hit DB on every request. Add short TTL cache (30-60s) for list queries using Redis or in-memory cache.
- [ ] **Enforce max key_skills array length** — JSONB `key_skills` arrays have no max length at DB level. Add CHECK constraint: `array_length(key_skills, 1) <= 20`.
- [ ] **Add graceful shutdown handling** — Lifespan handler only covers startup. Add shutdown hook to drain in-flight requests and close DB connections cleanly.

### Frontend

- [ ] **Implement ISR or SWR caching for browse pages** — List pages fetch fresh data on every navigation. Add `revalidate` to server components or use SWR for client-side caching.
- [ ] **Add image CDN optimization** — Profile/company images (if added) should go through Next.js Image Optimization with specific width/quality settings.
- [ ] **Bundle analysis and code splitting** — No bundle analysis configured. Add `@next/bundle-analyzer` to identify and split large chunks.

### Database

- [ ] **Add read replica for browse queries** — All reads and writes go to the same CloudSQL instance. For scaling reads, add a read replica and route browse/list queries to it.
- [ ] **Connection pooling with PgBouncer** — Direct asyncpg connections to CloudSQL limited by instance. Add PgBouncer for connection multiplexing at scale.

---

## Phase 11 — Feature Requests

> New capabilities requested or identified during audit.

### User-Facing Features

- [ ] **Job/profile renewal flow** — Listings expire after 60 days with no renewal mechanism. Add "Renew" button on manage page that extends `expires_at` by 60 days (max 2 renewals).
- [ ] **Email notification preferences** — No opt-in/out mechanism for emails beyond transactional. Add preferences endpoint and UI for: expiry warnings, weekly digest, platform updates.
- [ ] **Saved search alerts** — Users can bookmark listings but can't save searches. Add ability to save search criteria and receive weekly email with new matches.
- [ ] **Application tracking (lightweight)** — No way for job posters to know how many people clicked their contact link. Add anonymous click tracking on contact_url/contact_email reveal.
- [ ] **Similar listings recommendations** — Detail pages show no related content. Add "Similar Jobs" / "Similar Profiles" section based on matching skills/location.
- [ ] **Multi-language support (i18n)** — All content is English-only. Add `next-intl` or similar for Arabic/English bilingual support (relevant for UAE market).
- [ ] **Dark mode** — No dark mode specification or implementation. Add theme toggle respecting `prefers-color-scheme`, using design system CSS variables.

### Platform Features

- [ ] **Analytics dashboard for listing owners** — Listing owners have no visibility into views, clicks, or engagement. Add basic analytics on the manage page: view count over time, top referrers.
- [ ] **Employer/company profiles** — Jobs are standalone with no company page. Add optional company profile that groups all listings from the same company.
- [ ] **API rate limit headers** — API doesn't return rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`). Add to all rate-limited endpoints.
- [ ] **Webhook notifications** — No webhook system for external integrations. Add optional webhook URL on listing creation that fires on status changes (verified, expired, reported).
- [ ] **Public API for job boards** — No public API for third-party aggregators. Add read-only API with API key auth for partners to pull active listings.

---

## Phase 12 — Documentation & Developer Experience

> Improve onboarding, troubleshooting, and operational runbooks.

- [ ] **Add troubleshooting section to PRODUCTION.md** — No guidance for common failures: migration errors, GCS auth failures, Resend outages, CloudSQL connection limits.
- [ ] **Add monitoring & alerting setup guide** — No documentation on how to set up alerts for error rates, latency spikes, or resource exhaustion.
- [ ] **Add backup & disaster recovery plan** — No CloudSQL backup schedule documented. Add automated daily backups, document restoration procedure, test recovery quarterly.
- [ ] **Add API documentation (OpenAPI)** — FastAPI auto-generates OpenAPI spec but no security scheme declared, no 429 response documented, no example values on schemas. Enrich OpenAPI spec.
- [ ] **Add runbook for common operations** — Document: how to manually expire a listing, how to ban an email, how to re-send a verification, how to rotate secrets.
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
