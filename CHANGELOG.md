# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **`ANALYTICS.md`** — comprehensive Umami analytics implementation plan covering custom event catalog (P0/P1/P2 priority tiers), 5 user funnels (talent, recruiter onboarding, job discovery, direct posting, profile discovery), conversion and engagement goals, event naming conventions, tracking utility design, privacy considerations, and Umami Cloud Hobby tier budget planning

### Fixed
- **Recruiter pending page** — page now polls `GET /auth/me` every 15 s and redirects to `/account` automatically when admin approves the account; fixes recruiter being stuck on "under review" indefinitely after approval
- **Email verification deduplication** — profile and recruiter registration flows now check if the email was already verified (via `is_email_verified` in `verification_service`) and skip sending another verification email; emails verified in any prior flow (job, profile, recruiter) are not re-challenged

### Added
- **`is_email_verified`** helper in `verification_service.py` — queries `email_verification` for any row with a non-null `verified_at` for the given email; used to deduplicate verification across all entity flows

### Changed
- **`ROADMAP.md`** — complete rewrite based on exhaustive full-system audit; expanded from 4 phases to 12 covering security, bugs, infrastructure, observability, accessibility, SEO, testing, admin, email compliance, scalability, features, and documentation (124 items total)
- **`selfserve-jobs-customer-web/package-lock.json`** — regenerated to sync with `package.json` (missing `@testing-library/dom` transitive deps broke `npm ci` in CI)

### Changed
- **`.env.example`** — added `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `ADMIN_EMAILS`; removed stale `ADMIN_API_SECRET` entry
- **`app/config.py`** — removed `admin_api_secret` field (no longer used; admin auth is session-based Bearer token only)
- **`app/email_templates/recruiter_status.py`** — replaced old `X-Admin-Secret` curl commands in admin notification email with a link to the admin portal dashboard

### Added
- **Admin portal** — full session-based admin portal at `/admin` (hidden from site nav/header)
  - `POST /api/v1/admin/login` — sends magic link to whitelisted admin emails (pointing to `/admin/verify`); returns dev-mode URL when `ENVIRONMENT != production`
  - `app/config.py` — new `ADMIN_EMAILS` env var (comma-separated); `admin_email_list` property for list access
  - `app/models/recruiter_rejection_reason.py` — new `recruiter_rejection_reason` lookup table (`code`, `name`) for structured rejection reasons
  - `app/services/admin_service.py` — `list_users`, `list_recruiters`, `list_reports`, `reject_recruiter_with_reason`, `get_rejection_reasons` with ilike search + filter + pagination
  - `app/schemas/admin.py` — `AdminUserItem`, `AdminRecruiterItem`, `AdminReportItem`, `RejectionReasonItem`, `RejectRecruiterRequest` and paginated list wrappers
  - `app/email_templates/admin_login.py` — admin magic link email template
  - `alembic/versions/0005_admin_portal.py` — creates `recruiter_rejection_reason` table, seeds 7 default reasons, adds `rejection_reason_code`/`rejection_comment`/`reviewed_at` columns to `recruiter`
  - New admin endpoints: `GET /api/v1/admin/users`, `GET /api/v1/admin/recruiters`, `GET /api/v1/admin/reports`, `POST /recruiters/{code}/approve`, `POST /recruiters/{code}/reject`, `GET /api/v1/admin/rejection-reasons` — all protected by `Authorization: Bearer {token}` with `user_type=admin` check
  - `src/app/admin/login/page.tsx` — admin login form with dev-mode magic link display
  - `src/app/admin/verify/page.tsx` — admin magic link verify page (calls `/api/v1/auth/verify`)
  - `src/app/admin/dashboard/page.tsx` — protected dashboard with Users/Recruiters/Reported Posts tabs (tab state in URL)
  - `src/components/admin/UsersTable.tsx` — talent profiles table with debounced search + status filter + pagination
  - `src/components/admin/RecruitersTable.tsx` — recruiters table with LinkedIn button, approve/reject actions, reject reason modal
  - `src/components/admin/ReportsTable.tsx` — reports table with entity-type + status filters

### Changed
- **`app/services/auth_service.py` `create_session()`** — admin takes precedence over recruiter: if email is in `admin_email_list`, sets `user_type="admin"` and clears `recruiter_code`
- **`app/routers/admin.py`** — replaced `X-Admin-Secret` header auth with session-based `Authorization: Bearer` dependency (`user_type == "admin"` required); removed `/recruiters/pending` endpoint (superseded by `/recruiters?status=pending_approval`)
- **`app/models/recruiter.py`** — added `rejection_reason_code`, `rejection_comment`, `reviewed_at` columns
- **`app/services/email_service.py`** — `send_recruiter_rejected_email` now accepts `reason_name` param (included in email body); added `send_admin_login_email`
- **`app/email_templates/recruiter_status.py`** `build_rejected()` — now accepts optional `reason_name` and renders it in the email body
- **`src/context/AuthContext.tsx`** — added `isAdmin: boolean` computed from `userType === 'admin'`
- **`src/components/layout/Header.tsx`** — returns `null` on `/admin/*` routes
- **`src/app/layout.tsx`** — replaced inline `<main>/<Footer>` with `<AppShell>` client wrapper; Footer suppressed on `/admin/*`
- **`src/components/layout/AppShell.tsx`** — new client wrapper that conditionally renders `<Footer>` based on pathname
- **`tests/test_admin.py`** — fully rewritten for session-based auth; tests now cover new `list_recruiters`, `reject_with_reason`, `rejection-reasons` endpoints

### Added (continued)
- `src/lib/types.ts` — `AdminUserItem`, `AdminRecruiterItem`, `AdminReportItem`, `RejectionReason`, `AdminListFilters`, `AdminReportFilters`, `AdminListResponse<T>`
- `src/lib/api.ts` — `adminLogin`, `adminGetUsers`, `adminGetRecruiters`, `adminApproveRecruiter`, `adminRejectRecruiter`, `adminGetReports`, `adminGetRejectionReasons`


- **`app/constants.py`** — single source of truth for all business-rule constants (`JOB_EXPIRY_DAYS`, `MAX_ACTIVE_JOBS_PER_EMAIL`, `PROFILE_EXPIRY_DAYS`, `MAX_ACTIVE_PROFILES_PER_EMAIL`, `SESSION_EXPIRY_DAYS`, `LOGIN_TOKEN_EXPIRY_MINUTES`, `LOGIN_RATE_LIMIT_PER_HOUR`, `VERIFICATION_EXPIRY_HOURS`, `RESEND_LIMIT_PER_ENTITY`, `REPORT_THRESHOLD`); duplicate module-level definitions removed from `job_service`, `profile_service`, `auth_service`, `verification_service`, and `schemas/job.py`
- **`app/services/report_service.py`** — extracted all report submission logic from `reports.py` router into a dedicated service (`submit_report`): entity lookup, duplicate check, report creation, and auto-flag threshold logic; race condition fixed by counting existing reports before flush (count+1 ≥ threshold) instead of post-flush count
- **`profile_service.to_list_item()`** — profile-to-dict mapping extracted from `profiles.py` router into service layer; router now uses a list comprehension
- **`verification_service.get_pending_entity_for_resend()`** — entity lookup for resend flow extracted from `verification.py` router into service layer; router simplified to 3 service calls
- **`src/lib/validation.ts`** — extracted `validateJobForm`, `isJobFormValid`, `validateProfileForm`, `isProfileFormValid` as pure functions for unit testing; `JobForm.tsx` updated to use `validateJobForm`
- **`tests/test_reports.py`** — 11 new tests covering report submission, duplicate prevention, threshold auto-flag, removed-entity rejection
- **`tests/test_admin.py`** — 8 new tests covering admin secret auth, list pending recruiters, approve/reject happy paths and error cases
- **`tests/test_profiles.py`** — expanded from 3 to 18 tests: list filtering, create limit, get detail, update, deactivate/activate cycle, delete, and token validation
- **`tests/test_verification.py`** — expanded from 2 to 11 tests: valid verify, expired code, bulk-activate on verify, double-use prevention, resend not-found, resend success, and rate-limit enforcement
- **`src/lib/__tests__/validation.test.ts`** — 35 Vitest tests covering all job and profile form validation rules (required fields, contact method, salary cross-validation)

### Changed
- **`app/routers/reports.py`** — rewritten to delegate entirely to `report_service.submit_report()`; router is now 11 lines
- **`app/routers/verification.py`** — `resend_verification` endpoint simplified; entity lookup delegated to `verification_service.get_pending_entity_for_resend()`
- **`app/routers/admin.py`** — admin secret comparison changed from `!=` to `secrets.compare_digest()` (timing-safe)
- **`app/routers/auth.py`** — bare `except Exception: pass` replaced with `except HTTPException` + `logger.warning` in `verify_login` and `me` endpoints; added `logging` import
- **`app/database.py`** — `except Exception` in `get_db()` now logs the error before rollback
- **`app/services/storage_service.py`** — all four GCS operations now catch `GoogleCloudError` instead of bare `Exception`; `delete_file` raises on failure instead of returning `False` (callers must handle)
- **`src/lib/api.ts`** — `loginVerify()` refactored to use the centralized `request()` wrapper, eliminating duplicated error-handling logic
- **`.github/workflows/deploy-api.yml`** — Cloud Run deploy step now includes `--set-env-vars` for non-sensitive config and `--set-secrets` for sensitive values, making the deployment reproducible from CI

### Changed
- **Static page messaging updated to reflect talent-first platform with recruiter accounts model** — removed all "no signup", "no middlemen", "no accounts", "no recruiters" copy across About, Privacy, Terms, and FAQ pages:
  - **`about/page.tsx`** — hero tagline updated to "UAE's talent-first tech platform"; intro paragraph rewritten; "For employers" section replaced with "For recruiters & employers" covering the register → approve → post flow (3-step cards); "No signup" value card replaced with "Verified access" (talent contact details gated to approved recruiters); story section updated to explain dual model
  - **`privacy/page.tsx`** — "no-signup jobs platform" reference removed from Overview; new "Recruiter registration" data collection block added (name, company, LinkedIn stored for verification); new "Controlled access to sensitive talent data" section explaining recruiter approval gate; "Your rights" section extended with recruiter account closure right; data retention updated to cover recruiter account records
  - **`terms/page.tsx`** — metadata description updated from "self-serve jobs board" to "talent-first jobs platform"; "What hirebridge is" rewritten to explain dual model; new "Talent profiles" section; old "Posting rules" block replaced with separate "Recruiter registration & job posting" section covering legitimate intent, responsible data handling, and grounds for suspension; "Prohibited use" extended with recruiter-specific prohibition
  - **`faq/page.tsx`** — "About hirebridge" Q&As updated: "no-signup job board" and "no account needed" Q&As rewritten to reflect dual model; "For Employers" section renamed to "For Recruiters" with new Q&As covering registration, approval timeline (1–2 business days), pricing (free), data accessible, and job management; "For Job Seekers" section renamed to "For Talent" with new Q&A on who can see contact details and clarifying profile creation stays email-verification-only; CTA strip updated to remove "no signup" copy and add "Recruiter Register" button

### Added
- **Talent-first platform with recruiter accounts** — major architectural overhaul:
  - **Recruiter model** (`app/models/recruiter.py`) — new `recruiter` table with `recruiter_code`, `email`, `name`, `linkedin_profile_url`, `status` (`pending_verification` → `pending_approval` → `active`)
  - **Recruiter registration flow** — `POST /api/v1/recruiters/register`; verification email sent; on verify, transitions to `pending_approval` and notifies admin; manual admin approval via `POST /api/v1/admin/recruiters/{code}/approve`
  - **Admin API** (`app/routers/admin.py`) — `X-Admin-Secret` protected endpoints to list pending recruiters, approve, reject; sends approval/rejection emails
  - **Recruiter-aware auth sessions** — `auth_session` now stores `user_type` and `recruiter_code`; `create_session` automatically links recruiter accounts
  - **Salary range on job listings** — `salary_min`, `salary_max`, `salary_currency` (ISO 4217, 11 currencies) added to `job` model, API, and frontend job form; display in job detail pages
  - **Recruiter-gated job creation** — `POST /api/v1/jobs` now requires active recruiter session; jobs go directly to `active` (no email verification needed); `email` sourced from session
  - **Sensitive profile data gating** — `GET /api/v1/profiles/{code}` conditionally includes `email` and `contact_number` only for active recruiters via `Authorization` header; `GET /api/v1/profiles/{code}/resume` requires active recruiter
  - **`get_optional_session` dependency** — returns `None` instead of 401 for anonymous requests to profile detail
  - **`require_active_recruiter` dependency** — validates recruiter session and status, raises 403 with helpful message for pending recruiters
  - **Frontend recruiter pages** — `/recruiter/register` (application form with LinkedIn URL), `/recruiter/pending` (account under review state)
  - **Auth context recruiter state** — `AuthContext` extended with `userType`, `recruiterCode`, `recruiterStatus`, `isRecruiter`, `isActiveRecruiter`, `isPendingRecruiter`, `updateRecruiterStatus`
  - **Jobs/new recruiter guard** — shows editorial "Recruiter Access Required" screen for non-recruiters; pending recruiter sees "under review" screen; active recruiter sees form
  - **ProfileDetail sensitive data hiding** — contact info card shows `●●●@●●●.com` / `●●● ●●● ●●●●` for non-recruiters; resume section shows blurred locked state with CTA; active recruiters see real data
  - **Salary display in job detail** — formatted salary range (e.g., "AED 15,000 – 25,000 /month") shown below job title when present
  - **Login callback recruiter routing** — after login verify, pending recruiters route to `/recruiter/pending`, active recruiters route to `/account`
  - **Verify page recruiter handling** — recruiter email verification shows pending state and routes to `/recruiter/pending`
  - **Talent-first UI** — homepage, header, footer, mobile nav reordered: Talent sections before Jobs, "Browse Talent" CTA is primary, stats show profiles first
  - **Email templates** — recruiter verification, approval, rejection, admin notification emails
  - **llms.txt updated** — reflects talent-first platform model with recruiter registration flow description
  - **Alembic migration 0004** — creates `recruiter` table; adds `user_type`/`recruiter_code` to `auth_session`; adds `salary_min`/`salary_max`/`salary_currency`/`recruiter_code` to `job`

### Changed
- **Job form** — removed email section (Section 01); sections renumbered 01–05; added Section 04 Salary Range (currency + min/max fields)
- **Homepage messaging** — eyebrow updated to "UAE's Talent-First Tech Platform"; headline changed to "Find Extraordinary Talent"; hero CTAs swapped (Talent first, Jobs second); stats show profiles count first; sections reordered (Talent section before Jobs section); CTA strip primary action is "Create a Profile"
- **Header nav** — "Talent" link now appears before "Jobs"; "Post a Job" CTA now links to `/recruiter/register` for unauthenticated users
- **Footer** — tagline updated from "No signup required · No middlemen" to "UAE's talent-first tech platform"
- **Mobile nav** — "Browse Talent" appears before "Browse Jobs"; "Post a Job" links to `/recruiter/register`
- **Profile detail page** — removed server-side resume URL fetch; `ProfileDetail` now a client component; fetches resume URL client-side with auth token only for active recruiters
- **`/api/v1/jobs` (POST)** — now requires `Authorization: Bearer <session_token>` with active recruiter; `email` field removed from request body

### Fixed
- **Backend tests for job creation** — updated `test_jobs.py` to work with auth-required job creation; added recruiter session fixture; new tests for salary validation

### SEO/GEO hyperoptimization — full programmatic SEO overhaul** for hirebridge UAE:
  - **next/font migration** — switched from render-blocking Google Fonts CSS `@import` to `next/font/google` for `Newsreader` and `Manrope`; applied via CSS variables on `<html>` tag; eliminates render-blocking font request, improves LCP
  - **Canonical URLs** — added `metadataBase` to root layout, explicit `alternates.canonical` on all pages (job detail, profile detail, about, contact, privacy, terms, FAQ, blog, all landing pages); prevents duplicate content indexing from paginated/filtered URLs
  - **Expanded metadata** — root layout keywords updated to UAE-specific terms; `googleBot` directives added for max-snippet, max-image-preview; all static page metadata enhanced
  - **Organization + WebSite JSON-LD** — global `Organization` schema (name, logo, founders, areaServed: UAE) and `WebSite` schema with `SearchAction` (sitelinks search box) injected on every page via root layout
  - **Person/ProfilePage JSON-LD** — `ProfilePage` + `Person` structured data added to all talent profile detail pages
  - **BreadcrumbList JSON-LD** — `Breadcrumbs` component renders visible breadcrumb nav + `BreadcrumbList` schema; deployed on job detail, profile detail, all landing pages, FAQ, about, blog
  - **JsonLd server component** — reusable `src/components/seo/JsonLd.tsx` for injecting any Schema.org structured data
  - **Schema generation library** — `src/lib/schema.ts` with typed generators for Organization, WebSite, JobPosting, Person/ProfilePage, BreadcrumbList, CollectionPage, Article, FAQ schemas
  - **robots.txt AI crawler rules** — explicit `allow` rules added for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Bytespider; private paths (`/login/`, `/account/`, `/login/callback/`) added to disallow list; `host` directive added
  - **Image optimization** — removed `unoptimized` prop from logo `<Image>` components in Header and Footer; enables Next.js WebP/AVIF conversion
  - **Contextual internal links** — job detail pages now link to emirate landing pages and skill landing pages; profile detail pages link to emirate and skill talent pages
  - **Footer SEO link grid** — footer restructured with UAE Jobs by Emirate, Job Types, Popular Skills, and Resources link sections for internal SEO equity distribution
  - **`city` filter in JobFilters** — added `city?: string` to `JobFilters` type and `getJobs()` API client; connects frontend to backend's existing city filter capability
  - **ISR fetch revalidation** — `getStats()` revalidates every 60s, `getJobs()` every 120s for incremental static regeneration
  - **API Cache-Control middleware** — FastAPI middleware sets `Cache-Control` headers on all GET routes (static data: 24h, listings: 2min SWR, detail: 5min SWR, stats: 60s); improves CDN caching and crawlability
  - **SEO constants** (`src/lib/seo-constants.ts`) — typed data for all 7 UAE emirates (slug, city name, Arabic name), 7 employment types, top 25 skills with slugs and categories; helper functions for slug lookups
  - **SEO content library** (`src/lib/seo-content.ts`) — 200+ word editorial copy for each UAE emirate (intro, work culture, key industries, highlights, FAQs), each employment type (intro, benefits, considerations, FAQs), and top skills (intro, demand drivers, salary ranges, FAQs); all content authored for SEO and AI citation
  - **Programmatic landing pages** (all server components with `generateStaticParams`):
    - `/jobs/in/[emirate]` — 7 pages, one per UAE emirate, with editorial content, live job listings, FAQ accordion, sidebar with skill links and emirate cross-links
    - `/jobs/type/[type]` — 7 pages, one per employment type, with editorial content, benefits/considerations, live listings, sidebar with emirate and type cross-links
    - `/jobs/in/[emirate]/[skill]` — 70 pre-built combination pages (7 emirates × 10 top skills); shows combined listings, related jobs if empty, skill + emirate cross-links
    - `/profiles/in/[emirate]` — 7 emirate talent pages with live profile listings
    - `/profiles/skill/[skill]` — 25 skill talent pages with live listings, demand context, salary info
  - **Sitemap expansion** — sitemap now includes ~160 new static URLs: 7 emirate job pages, 7 employment type pages, 70 emirate+skill pages, 7 emirate profile pages, 25 skill profile pages, FAQ, blog, all blog posts; dynamic job/profile detail URLs unchanged
  - **llms.txt** — dynamic route at `/llms.txt` (Next.js route handler) returns machine-readable site description with real-time job/profile stats for AI engine consumption; revalidates hourly
  - **FAQ page** (`/faq`) — comprehensive 25+ Q&A FAQ page covering UAE jobs, visa sponsorship, salary expectations, work culture, and hirebridge platform; `FAQPage` JSON-LD schema on all items; section nav, accordion UI, internal links to landing pages
  - **Blog** (`/blog`, `/blog/[slug]`) — blog index and 7 full-length articles (1,000–2,000 words each) authored directly in TypeScript (`src/lib/blog-content.ts`); no CMS required; covers: finding Dubai tech jobs, UAE work visa guide, free zone vs mainland, tech salaries, remote work, top skills, emirate guide; each post has `Article` JSON-LD, `BreadcrumbList`, author attribution, `datePublished`
  - **About page canonical** — canonical URL added to about page metadata

### Fixed
- **`tsc --noEmit` added to pre-commit hook** — TypeScript type errors were not caught before commit because the pre-commit hook ran only ESLint (style/lint) and not the TypeScript compiler; `npx tsc --noEmit` now runs alongside ESLint whenever `.ts`/`.tsx` files are staged
- **`EntityType` corrected to singular values** — `EntityType` was `'jobs' | 'profiles'` but the API uses `'job' | 'profile'`; corrected the type alias, fixed stale `=== 'jobs'` comparison in `report/page.tsx`, and the three `TS2820`/`TS2367` typecheck errors now resolve cleanly
- **Report submissions silently broken** — `ReportButton` passed `entityType="jobs"`/`"profiles"` (plural) into the URL; the backend's `/reports` endpoint expects `Literal["job", "profile"]` (singular) and was rejecting all reports with a validation error; fixed `ReportButton` call sites in `JobDetail` and `ProfileDetail` to pass singular values and updated the `EntityType` type alias from `'jobs' | 'profiles'` to `'job' | 'profile'`
- **Removed legacy proxy resume upload endpoint** — `POST /api/v1/upload/resume` (multipart proxy through backend) deleted; only the signed-url flow remains; removed `uploadResume()` from `api.ts`, `UploadResumeResponse` type, and the proxy fallback branch in `ProfileForm`; in dev mode (no GCS bucket) the upload step is skipped and a placeholder `resume_key` is used

### Fixed
- **Verify page "View your listing" link → 404** — backend returns `entity_type` as singular (`"job"` / `"profile"`) but frontend routes are plural (`/jobs/[code]`, `/profiles/[code]`); verify page now maps singular to plural before constructing the href
- **Resend verification form sends wrong entity_type** — radio buttons on the resend form used `"jobs"`/`"profiles"` (plural) which the backend rejects with "Invalid entity type"; changed state type and radio values to `"job"`/`"profile"` (singular)
- **Email verification only activates the directly verified listing** — `verification_service.verify_code()` now bulk-activates all `pending_verification` jobs and profiles under the verified email address, so older unverified listings go live at the same time

### Added
- **Direct browser-to-GCS resume upload** — new `POST /api/v1/upload/resume/signed-url` endpoint returns a v4 GCS signed PUT URL so the browser uploads the PDF directly to GCS without routing through the backend; `ProfileForm` calls the signed-url endpoint first and falls back to the legacy proxy upload only in dev mode (where no GCS bucket is configured); reduces profile creation latency by eliminating the backend-as-proxy hop for file uploads
- **`storage_service.generate_signed_upload_url()`** — new async function generates a GCS v4 signed PUT URL for a given path and content-type; returns `None` in dev mode so callers can detect and fall back gracefully

### Fixed
- **Job deadline validation 500/422** — `validate_deadline` used `mode="before"` so `v` was a raw string when a date was provided; comparing `str < date` raises `TypeError`, causing a 500 (or 422 depending on Pydantic's error path); changed to `mode="after"` so Pydantic parses the string to `date` first and the comparison is always `date < date`
- **JSONB skills filter** — `key_skills` filtering on both jobs and profiles now generates a proper PostgreSQL `@>` containment operator instead of a broken `LIKE '%' || $2::JSONB || '%'` query; root cause was calling `.contains()` on a `JSON`-typed column (the base type of `JSONB_COMPAT`); fixed by casting to `JSONB` at query time before calling `.contains()` in both `profile_service.py` and `job_service.py`

### Added
- **Email logging (`email_log` table)** — new DB table and SQLAlchemy model that records every email send attempt (type, recipient, entity type/code, success flag, Resend-assigned ID on success, full error message on failure); migration `0003_email_log` runs automatically on startup; all three email functions (`send_verification_email`, `send_login_email`, `send_management_links_email`) now accept a `db: AsyncSession` parameter and write a log row after every attempt including dev-mode no-ops

### Changed
- **Email templates redesigned (Sage & Stone)** — all three email templates (verification, login, management links) completely rebuilt to match the hirebridge design system: Newsreader-equivalent Georgia serif headings in forest green, Manrope-equivalent Helvetica Neue body, `#506E54` pill CTA button, `#fcf9f5` background, white card with ambient shadow, terracotta link colour, uppercase Manrope-style eyebrow labels — no borders, no generic Arial/brown palette
- **Email sender address** — changed from hardcoded `jobs4u <noreply@jobs4u.io>` to configurable `RESEND_FROM_EMAIL` env var (no default — must be set explicitly); added `resend_from_email` to `Settings` in `config.py`; documented in PRODUCTION.md §7
- **Email templates extracted to `app/email_templates/`** — split inline template strings out of `email_service.py` into four dedicated modules: `base.py` (design tokens + shared `shell`, `cta_button`, `fallback_link`, `divider` helpers), `verification.py`, `login.py`, `management_links.py`; each template module exposes a `build()` function returning `(subject, html_body, text_body)`; `email_service.py` is now thin — only handles Resend send + DB logging via a shared `_send()` helper
- **Email subjects** — updated to say "hirebridge" throughout (e.g. "Verify your job listing on hirebridge", "Sign in to hirebridge")
- **Rebrand: jobs4u → hirebridge** — renamed the platform to hirebridge across the entire frontend; updated all page metadata, OG images, legal pages (Privacy Policy, Terms of Service), layout components (Header, Footer, MobileNav), and SEO files (sitemap, robots); replaced text-only logo in header/footer/mobile nav with the new `logo.png` image asset; added `icon.png` (favicon) from `design-system/favicon.png` for the browser tab; fallback domain URLs updated from `jobs4u.app` to `hirebridgeuae.com`; about and contact pages use "hirebridge UAE" where referencing the regional UAE/Middle East focus; logo PNG converted from palette mode to RGBA and resized to 560×254 for reliable rendering; `unoptimized` prop added to all logo Image components to bypass Next.js optimization pipeline

### Added
- **Vercel Speed Insights** — added `@vercel/speed-insights` to `layout.tsx` for Core Web Vitals monitoring on Vercel

- **About page "Our Story" section** — new section at the bottom of `/about` explaining the motivation behind jobs4u (economic impact of Middle East conflict, platform as a focused alternative), credits Hussain and Tejasvie with a link to `/contact`, and notes the platform has no monetization plans
- **Umami Cloud analytics** — integrated via Next.js proxy rewrites (`/stats/script.js` and `/stats/api/send` forward to `cloud.umami.is`) to bypass adblockers; script loads only when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` env var is set; setup documented in PRODUCTION.md §12

### Changed
- **Primary button hover contrast** — added `--color-primary-btn: #506E54` (medium forest green) as a lighter default button background; hover now darkens to `--color-primary` (`#384B3B`), giving a clearly visible transition instead of the previous near-invisible dark→darker shift; applied consistently to all filled green buttons across homepage, header, error pages, verify, about, login, account, manage, report, JobDetail, and the `Button` component

### Fixed
- **Mobile filters not visible** — `<aside>` wrapper on `/jobs` and `/profiles` pages used `hidden lg:block`, suppressing the mobile filter toggle that already existed inside `JobFilters`/`ProfileFilters`; fixed by using `w-full lg:w-64 lg:flex-shrink-0` on the aside and `flex-col lg:flex-row` on the container so the filter components control their own responsive rendering

### Fixed
- **MarkdownEditor TypeScript errors** — cast `editor.storage` to `any` to resolve TS2339 (`markdown` property not on `Storage` type); replaced `setContent(value, false)` with `setContent(value, { emitUpdate: false })` to fix TS2559
- **API lint** — removed unused `AuthSession` import from `verification_service.py`; removed unused `pytest` import and fixed import ordering in `tests/test_auth.py`

### Changed
- **ProfileDetail resume actions** — replaced single "Open / Download" text link with two icon buttons (download arrow + external link) in the top-right of the Resume card header; fallback `<object>` message updated to use a proper download link


- **Removed "free" from all marketing copy** — replaced with "no middlemen" / "no account required" messaging across homepage, about, jobs/new, profiles/new, footer, mobile nav, OG images, privacy, and terms pages; terms liability clause updated to "currently provided at no cost"
- **JobDetail redesign** (`src/components/jobs/JobDetail.tsx`) — simplified layout:
  - Removed "How to apply" sidebar card and "Details" sidebar card (both were redundant with header info)
  - Apply button (email or URL) moved to top-right of the header badges row as a compact pill
  - Description now renders full-width (no grid sidebar); share/report actions moved to bottom of article
- **ProfileCard redesign** (`src/components/profiles/ProfileCard.tsx`) — fixed overflow/crowding at narrow widths:
  - Relocation badge + time posted moved to a dedicated top row (mirroring the new JobCard pattern)
  - Avatar shrunk to `w-10 h-10`; name reduced to `text-xl` with `line-clamp-1` — prevents overflow with long names
  - Footer restructured to `flex-col`: location on line 1, experience/notice + "View Profile →" on line 2
- **ProfileDetail cleanup** (`src/components/profiles/ProfileDetail.tsx`):
  - Removed `Location` and `Listed` rows from the Details sidebar card (already visible in the header)
  - Removed `Resume — Available` indicator from Details sidebar
- **Profile detail page** (`src/app/profiles/[profileCode]/page.tsx`) — now fetches the signed resume URL server-side in parallel with recent profiles

### Added
- **Resume PDF preview on profile detail page** — when a profile has a resume, a full-width "Resume" section renders below the About card using a native `<object>` PDF embed (700px tall, browser handles multi-page rendering); includes an "Open / Download" link that opens the signed URL in a new tab for full-screen view, download, and printing

### Added
- **MarkdownEditor component** (`src/components/ui/MarkdownEditor.tsx`) — WYSIWYG markdown editor (JIRA/Confluence-style) replacing the plain textarea for job descriptions and professional briefs:
  - Powered by Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `tiptap-markdown`)
  - Live markdown shortcuts: type `## ` → heading renders in place, `**text**` → bold, `- ` → bullet list, etc.
  - Toolbar at the bottom with Bold, Italic, Heading H2, Bullet List, Ordered List, Code Block buttons (SVG icons, no icon library)
  - Controlled component (`value: string` / `onChange: (val: string) => void`); emits plain markdown string — no change to backend storage
  - Replaced `<Textarea>` in `JobForm.tsx`, `ProfileForm.tsx`, and `manage/[entityType]/[code]/page.tsx` (both job description and profile brief fields)
  - Uses a `mounted` gate (`MarkdownEditorContent` child component) to keep `useEditor` off the server — avoids Tiptap v3 SSR error in Next.js App Router

### Changed
- **MarkdownEditor font size** — removed `text-sm` from the Tiptap editor's ProseMirror attributes so the editor renders at 16px (browser default), matching the `react-markdown` rendered output on job/profile detail pages
- **JobCard layout redesign** (`src/components/jobs/JobCard.tsx`) — fixed overflow and crowding at 2-column grid widths:
  - Removed company initial avatar (`w-16 h-16` box) — title and company name now use the full card width
  - Employment type badge moved to its own top row; time posted displayed inline at top-right
  - Footer restructured from a single cramped flex row to `flex-col`: location on line 1, deadline + "View Details →" on line 2 — eliminates overflow at all card widths
  - Reduced padding `p-8 → p-6` and gap `gap-6 → gap-4`

### Fixed
- **Hydration mismatch in Header** — `AuthProvider` was reading `localStorage` in the `useState` lazy initializer, which runs on the client but not the server, causing the Header to render different elements (logged-out links vs. `CreateListingDropdown`) between SSR and client hydration. Moved the `localStorage` read to a `useEffect`, added `isHydrated` to `AuthContextValue`, and guarded the logged-in header branch with `isHydrated && isLoggedIn` so the initial client render always matches the server-rendered output.

### Added
- **User account & dashboard system** — email magic-link authentication with session management, dashboard page, and header avatar:
  - `alembic/versions/0002_auth_session.py`: new migration adding `login_token` and `auth_session` tables
  - `app/models/login_token.py`, `app/models/auth_session.py`: ORM models for both tables
  - `app/schemas/auth.py`: Pydantic schemas — `LoginRequest`, `LoginResponse`, `LoginVerifyResponse`, `MeResponse`, `EntityItem`, `EntitiesResponse`
  - `app/services/auth_service.py`: `create_login_token` (rate-limited 5/email/hour, 15-min expiry), `verify_login_token`, `create_session` (30-day expiry), `validate_session`, `delete_session`, `get_entities_for_session`
  - `app/routers/auth.py`: `POST /api/v1/auth/login`, `POST /api/v1/auth/verify`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `GET /api/v1/auth/entities`
  - `context/AuthContext.tsx`: React context storing session token + email in `localStorage`; provides `login()`, `logout()`, `isLoggedIn`, `initial` (first char of email) to all client components
  - `app/login/page.tsx`: login page — non-production auto-creates session immediately; production shows "check your email" screen
  - `app/login/callback/page.tsx`: magic-link callback — consumes `?token=`, stores session, redirects to `/account`
  - `app/account/page.tsx`: dashboard — protected page listing all jobs and profiles for the logged-in email with status badges, view counts, expiry dates, Edit/Activate/Deactivate/Delete actions per entity and CTAs to create new listings
- `POST /api/v1/jobs/{code}/deactivate` and `POST /api/v1/jobs/{code}/activate`: toggle job status between `active` ↔ `inactive` (requires `X-Edit-Token`)
- `POST /api/v1/profiles/{code}/deactivate` and `POST /api/v1/profiles/{code}/activate`: same for profiles
- `app/dependencies.py`: `get_current_session` dependency — parses `Authorization: Bearer {token}` header and validates session
- `app/services/email_service.py`: `send_login_email` — magic login link email template (15-min expiry, single-use)

### Changed
- `app/main.py`: registered `auth` router
- `app/models/__init__.py`: registered `LoginToken` and `AuthSession` models
- `app/services/verification_service.py`: `verify_code()` now also creates an `auth_session` and returns `session_token` + `email` alongside entity data — user is auto-logged in on email verification
- `app/routers/verification.py`: `POST /verify` response now includes `session_token` and `email` fields
- `app/schemas/verification.py`: `VerificationResponse` gains `session_token: str | None` and `email: str | None`
- `lib/types.ts`: `VerificationResponse` updated with `session_token` and `email` fields; added `LoginResponse`, `LoginVerifyResponse`, `AuthEntity`, `EntitiesResponse` types
- `lib/api.ts`: added `loginRequest`, `loginVerify`, `logout`, `getMyEntities`, `deactivateJob`, `activateJob`, `deactivateProfile`, `activateProfile` API helpers
- `app/layout.tsx`: wrapped app in `<AuthProvider>`
- `components/layout/Header.tsx`: when logged in shows "Create Listing" dropdown (Post a Job / Create Profile) + circular avatar with first letter of email linking to `/account`; when logged out shows original "Post a Job" + "Create Profile" CTAs
- `components/layout/MobileNav.tsx`: when logged in shows "My Account" link at top and "Sign Out" at bottom; when logged out shows "Sign In" link
- `app/verify/page.tsx`: auto-logs in user when verification response contains `session_token`
- `app/services/job_service.py`: added `deactivate_job` and `reactivate_job`
- `app/services/profile_service.py`: added `deactivate_profile` and `reactivate_profile`
- `app/routers/jobs.py`: added deactivate/activate endpoints
- `app/routers/profiles.py`: added deactivate/activate endpoints

### Fixed
- `tests/test_auth.py`: 14 new tests covering login auto-session (non-production), login token verify/expiry/reuse, session validation, logout, entities endpoint, and job deactivate/activate cycle
- `app/manage/[entityType]/[code]/page.tsx`: "Invalid management link" error when editing a job from the account dashboard — manage page compared `entityType === 'jobs'` (plural) but all URLs (email links and dashboard edit links) use `'job'` (singular), causing the job to be looked up as a profile. Changed all comparisons to use singular `'job'`/`'profile'`.

### Fixed
- `globals.css`: move `*:focus-visible` rule into `@layer base` so Tailwind utility classes (e.g. `focus-visible:outline-none`) can override it — previously, the unlayered rule had higher cascade priority than all Tailwind utilities, causing duplicate focus outlines on any element that suppressed focus-visible via a utility class
- `upload.py`: `POST /upload/resume` was requiring `profile_code` and `edit_token` as form fields, but the frontend uploads the resume before the profile exists — 422 on every profile creation. Endpoint now accepts only the file; GCS path is `resumes/{uuid}.pdf`. `create_profile` service now sets `resume_gcs_path` from `data.resume_key`.
- `PhoneInput`: global `*:focus-visible` CSS rule was adding a second green outline around the number `<input>` element, appearing as an extra border on the right side of the component — added `focus-visible:outline-none` to both the dial-code button and number input to suppress the duplicate ring (the container's `focus-within:ring-2` already provides the focus indicator)
- `EmploymentTypeBadge`: missing `consulting` entry in `TYPE_COLORS` map caused TypeScript error (TS2741)
- View counts were being incremented multiple times per page load: `generateMetadata()` and the page component each called `getJob`/`getProfile`, and the view increment was baked into the GET handler — resulting in 2+ increments per visit. Moved increment to dedicated `POST /api/v1/jobs/{code}/view` and `POST /api/v1/profiles/{code}/view` endpoints; added `ViewTracker` client component that fires once per session using `sessionStorage` dedup.

### Added
- `routers/jobs.py`: `POST /api/v1/jobs/{code}/view` — dedicated endpoint to atomically increment job view count
- `routers/profiles.py`: `POST /api/v1/profiles/{code}/view` — dedicated endpoint to atomically increment profile view count
- `components/shared/ViewTracker.tsx`: client component that calls the view endpoint once per browser session (keyed by entity type + code in `sessionStorage`)
- `lib/api.ts`: `trackJobView(code)` and `trackProfileView(code)` API helpers

### Changed
- `services/job_service.py`: `get_job_detail` no longer calls `increment_view_count`; GET is now read-only
- `services/profile_service.py`: `get_profile_detail` no longer calls `increment_view_count`; GET is now read-only

### Changed
- `privacy/page.tsx`: replaced named third-party services list (Resend, GCS, Cloud SQL, Vercel) with a generic statement — no tech stack exposed publicly
- `privacy/page.tsx`, `terms/page.tsx`: updated candidate profile retention from 90 days to 180 days
- `profile_service.py`: `PROFILE_EXPIRY_DAYS` changed from 90 to 180
- `schemas/job.py`: added `validate_deadline` field validator — rejects deadlines in the past or beyond the 60-day listing life; also extracted `JOB_EXPIRY_DAYS = 60` constant
- `JobForm`: application deadline input now enforces `min=today` and `max=today+60d` via native HTML date constraints

### Added
- `app/contact/page.tsx`: new Contact page with founder profile cards (name, initials avatar, headline, LinkedIn link) and two info cards for listing reports and privacy requests
- `app/privacy/page.tsx`: Privacy Policy page covering data collected, purposes, third-party services (Resend, GCS, Cloud SQL, Vercel), retention, user rights, and cookie policy
- `app/terms/page.tsx`: Terms of Service page covering acceptable use, posting rules, listing lifecycle, resume uploads, prohibited use, no-warranty clause, and governing law (UAE)
- `components/ui/PhoneInput.tsx`: new phone input component with searchable country dial code dropdown (default UAE +971), flag emoji, and combined value output; used in profile creation form
- `lib/constants.ts`: `DIAL_CODES` constant — 55 countries with ISO code, flag emoji, country name, and dial code

### Changed
- `ProfileForm`: contact number is now mandatory (was optional); replaced plain text input with `PhoneInput` (dial code dropdown + local number); city placeholder changed to "Dubai"; resume is now required (was optional); professional brief is now optional (was required); success screen shows context-aware message based on API response (immediate live vs. email verification required)
- `JobForm`: city placeholder changed to "Dubai"; added "Consulting" to employment type options; success screen updated to match `ProfileForm` — context-aware message and design-system colours
- `schemas/job.py` (API): added `consulting` to `EMPLOYMENT_TYPES` Literal
- `schemas/profile.py` (API): `contact_number` is now required (`str`, min 3 chars); `brief` is now optional (defaults to empty string, no minimum length)
- `routers/jobs.py` (API): when `ENVIRONMENT != production`, newly created jobs are auto-activated (`email_verified=True`, `status=active`) without sending a verification email; in production the existing flow is unchanged
- `routers/profiles.py` (API): same non-production auto-activation bypass as jobs router
- `services/job_service.py` (API): added `activate_job()` helper for non-production auto-activation
- `services/profile_service.py` (API): added `activate_profile()` helper for non-production auto-activation
- `config.py` (API): added `is_production` property (complement of existing `is_development`)
- `lib/types.ts`: added `'consulting'` to `EmploymentType` union
- `lib/constants.ts`: added `'consulting'` entry to `EMPLOYMENT_TYPES`

### Fixed
- `globals.css`: wrapped element-level base resets (`*`, `html`, `body`, headings, `a`) in `@layer base {}` — in Tailwind v4 unlayered styles have higher cascade priority than `@layer utilities`, causing the `* { padding: 0; margin: 0 }` reset to override every `px-*`/`py-*`/`mx-*`/`my-*` utility class, making all spacing zero

### Added
- `app/error.tsx`, `app/jobs/error.tsx`, `app/profiles/error.tsx`: root and section-level error boundaries with on-brand fallback UI and reset/home actions
- `app/jobs/[jobCode]/opengraph-image.tsx`, `app/profiles/[profileCode]/opengraph-image.tsx`: dynamic OG social cards using Next.js `ImageResponse` (1200×630); job card shows title, company, location, employment type, and skills; profile card shows name, title, avatar initials, location, experience, and skills
- `ProfileForm`: 5 MB client-side file size check before resume upload (previously only MIME type was validated); UI hint corrected from "max 10MB" to "max 5 MB"

### Changed
- `sitemap.ts`: refactored from a single default export fetching 500 items to a paginated sitemap index using `generateSitemaps()` + `sitemap({ id })` — static routes at id 0, jobs pages at ids 1–50 (200 items each), profiles pages at ids 51–100
- `Footer`: replaced hardcoded `bg-[#e5e2de]` with design token `bg-surface-dim`
- `ProfileDetail`: extracted inline `'#0A66C2'` LinkedIn brand color to a named constant `LINKEDIN_BLUE`

### Changed
- `JobForm`, `ProfileForm`: increased section card padding from `p-6` to `p-8`; replaced `<Button>` submit with an inline `<button>` using secondary color (`bg-secondary`) and `rounded-xl` to match the design system CTA style; `ProfileForm` sections also promoted to full card treatment (`bg-surface-lowest shadow-ambient rounded-2xl`) to align with `JobForm`
- `page.tsx` (home), `jobs/page.tsx`, `profiles/page.tsx`: widened all containers from `max-w-6xl` to `max-w-7xl`; increased hero vertical padding on browse pages (`pt-14 pb-10` → `pt-16 pb-12`) and section padding on home page (`py-16 sm:py-24` → `py-20 sm:py-28`); home hero padding increased to `py-28 sm:py-36 lg:py-48`; card grids updated from `gap-4`/`gap-5` to `gap-6`; browse page grids changed from `xl:grid-cols-3` to `xl:grid-cols-2` to prevent cramping with larger `p-8` cards
- `JobCard`, `ProfileCard`: editorial overhaul to match design mockups — increased padding to `p-8`, enlarged titles to `font-heading text-2xl`, added 64×64 company/person initial avatar, multi-color `SkillTag` cycling via `colorIndex`, optional description/brief 2-line excerpt, border-t footer separator, and "View Details →" / "View Profile →" CTA links
- `Input`, `Select`: increased padding from `px-4 py-3` to `px-5 py-3.5` to better match design system mockup; also increased `Select` right padding from `pr-9` to `pr-10` to accommodate the larger horizontal padding
- `Header`: switched nav links from uppercase Manrope label style to editorial Newsreader (`font-heading tracking-tight`); active state now uses `border-b-2 border-primary` directly on the link; removed absolute `<span>` bottom indicator; increased container to `max-w-7xl` and height to `h-[68px]`; logo scaled to `text-2xl`; "Create Profile" CTA changed to `rounded-xl text-sm uppercase tracking-widest`
- `Footer`: replaced 3-column nav group layout with a horizontal brand + flat link row layout; background changed to `bg-[#e5e2de]`; container widened to `max-w-7xl`; vertical padding increased to `py-12 sm:py-16`; links updated to Privacy Policy, Terms of Service, About, Contact; tagline moved under brand name
- `globals.css`: updated `.shadow-ambient` to softer elevated values (`0 20px 40px` spread); added 8 new color tokens (`--color-secondary-fixed`, `--color-tertiary-fixed`, `--color-surface-container-high`, `--color-surface-dim`, `--color-primary-fixed`, `--color-on-secondary-fixed-variant`, `--color-on-tertiary-fixed-variant`, `--color-on-surface-variant`) to both `@theme` and `:root` blocks
- `SkillTag`: added optional `colorIndex` prop enabling 3-family color cycling (warm terracotta, warm brown, neutral gray); default behavior unchanged when prop is absent
- **Full "Sage & Stone" design system implementation across all 13 pages and all components:**
  - **Fonts:** switched from Outfit + Instrument Serif → Newsreader (serif headlines) + Manrope (body/UI)
  - **Color palette:** forest green primary `#384B3B`, terracotta secondary `#8C4E32`, warm cream background `#fcf9f5`, tonal surface hierarchy (`bg-bg` → `bg-surface` → `bg-surface-lowest`)
  - **No-Line Rule:** removed all 1px structural borders from cards, sections, layouts; replaced with ambient dual-layer shadow (`shadow-ambient`) and tonal background shifts
  - **Buttons:** pill-shaped (`rounded-full`) across all components
  - **Cards:** white on cream (`bg-surface-lowest shadow-ambient rounded-2xl`), hover lift and ambient shadow intensification
  - **Forms:** borderless inputs (`bg-surface rounded-xl`), numbered sections (01–05) with left accent, uppercase tracking-widest labels
  - **Typography:** editorial italic serif emphasis words in all headlines, uppercase tracking-widest section labels/eyebrows, large serif step numbers in bento grids
  - **Navigation:** serif italic logo, pill-shaped CTAs, no bottom border (ambient shadow instead), uppercase tracking-widest nav links
  - **Hero sections:** `hero-gradient` radial backgrounds on all page headers
  - **CLAUDE.md:** updated design system section with full Sage & Stone spec, font table, no-line rule, shadow classes, and component patterns
- globals.css: added `fadeInUp`, `fadeIn`, `scaleIn` keyframe animations with delay variants and `prefers-reduced-motion` support; smooth scroll; refined scrollbar

### Fixed
- `GET /api/v1/jobs`, `GET /api/v1/profiles`, `POST /api/v1/jobs`, `POST /api/v1/profiles`, `POST /api/v1/verify`, `POST /api/v1/reports` all returned 404 because routes were registered with a trailing slash (`"/"`) while `redirect_slashes=False` is set on the app — changed all collection/root route decorators from `"/"` to `""`
- Card component build error: `cn()` received `string[]` from conditional hover classes — collapsed into single string to fix type mismatch

### Added
- Initial project setup with FastAPI API (`selfserve-jobs-customer-api`) and Next.js 15 web app (`selfserve-jobs-customer-web`)
- Job listings: create, browse, view, edit, and delete (via email magic link)
- Candidate profiles: create, browse, view, edit, and delete (via email magic link)
- Email verification flow using Resend (64-char verification codes, 24h expiry)
- Resume upload to GCS (PDF only, 5MB max, magic byte validation)
- Reporting system with automatic listing hide after 3+ reports
- Local bookmarks via localStorage (no auth required)
- Docker Compose for local development (DB + API with hot-reload)
- Alembic database migrations
- GitHub Actions CI/CD: separate test and deploy workflows for API and web
- Backend tests: pytest + pytest-asyncio + httpx (SQLite in-memory, 11 tests)
- Frontend tests: Vitest + Testing Library (98 tests across utils, API client, and components)
- Pre-commit hooks with Husky: ruff for Python, ESLint for TypeScript, tests on commit
- Project documentation: README, CHANGELOG, PRODUCTION setup guide

### Fixed
- 307 redirect on all API calls: FastAPI's default `redirect_slashes=True` was redirecting `/api/v1/jobs` → `/api/v1/jobs/` over plain `http://`, causing mixed-content CORS failures from the HTTPS frontend; disabled with `redirect_slashes=False`
- CORS error on all API calls from the frontend: Cloud Run had `WEB_DOMAIN` set instead of `FRONTEND_URL`, so the backend fell back to `http://localhost:3000` as the allowed origin
- Initial Alembic migration was missing — all tables (`job`, `profile`, `email_verification`, `report`) are now created on first deploy via the lifespan migration runner
- CI deploy pipeline failing due to wrong Artifact Registry repository name (`selfserve-jobs` → `selfserve-jobs-platform`) in the Docker image path
- CI deploy pipeline failing due to missing `artifactregistry.writer` IAM grant on the service account
- CI deploy pipeline failing due to missing `iam.serviceAccountUser` grant, preventing Cloud Run from attaching the service account during deployment
- All CI/CD workflows now also trigger on changes to `.github/workflows/**` and `README.md`
