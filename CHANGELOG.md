# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- **Vercel ISR write usage** — reduced frontend ISR churn by lengthening server-side list/stat/blog revalidation windows, moving `sitemap.xml` and `llms.txt` regeneration to daily, and making sitemap `lastModified` values stable for static/SEO routes so Vercel does not persist fresh output just because the render timestamp changed.
- **Passkey setup and login flow** — the account passkey manager no longer asks users to type a device label; the frontend presents passkeys as a single enabled/disabled setting while the backend still supports multiple credentials per email and auto-generates stored labels. Login now follows a two-step flow: enter email first, then show magic-link and passkey options only when that email already has a registered passkey.

### Fixed
- **Resume viewer load width** — the resume PDF preview now measures the viewer frame before rendering PDF pages and keeps page rendering synced to that measured width, preventing the resume from expanding the card on load and ensuring the preview fills 100% of the available viewer width.
- **Approved recruiters stuck behind job-posting gate** — the web auth provider now refreshes stored sessions against `/auth/me` before marking auth as hydrated, and the account page waits for auth hydration before redirecting, so recruiters who were approved after logging in get their latest `recruiter_status` without needing to clear local storage or request a fresh magic link.
- **ProfileDetail owner resume test** — `ProfileDetail.test.tsx` was asserting resume visibility synchronously after waiting for the email to appear, but for owner profiles `getResumeUrl` fires only after `getProfile` resolves and `is_owner` becomes `true` (two sequential async hops vs one for recruiters). The resume assertion now uses its own `waitFor` to properly await the second async operation.

### Added
- **Cleanup job workflow** — added a scheduled GitHub Actions cleanup job that validates required GCP/internal secrets, resolves the deployed `selfserve-jobs-customer-api` URL, and calls `POST /api/v1/internal/cleanup` daily with the protected internal secret header.

- **Substack-powered Field Notes integration** — added configurable Substack RSS ingestion (`SUBSTACK_FEED_URL`, `SUBSTACK_PUBLICATION_URL`, `SUBSTACK_PUBLICATION_NAME`) through a protected `POST /api/v1/internal/sync-substack` endpoint, source metadata on `blog_post`, and synced-post public API fields. `/blog` remains the canonical article archive while homepage, blog detail, profile creation, and talent listing pages now surface integrated career-market article modules and optional Substack subscribe/read CTAs. Sitemap, `llms.txt`, production docs, env examples, and deploy env propagation were updated for the new content flow.

- **Passkey authentication** — users, recruiters, and admins can now sign in with a passkey (Face ID, Touch ID, Windows Hello, Android biometrics) as an alternative to magic-link email. The login page and admin login page each show a "Sign in with passkey" button when the browser/device supports platform authentication (feature-detected via `platformAuthenticatorIsAvailable()` — hidden automatically on unsupported browsers). A `PasskeyManager` section in the account dashboard and admin Security tab lets users register labelled passkeys and remove old ones. Multiple passkeys per email are supported (e.g., iPhone + MacBook). Backend: new `passkey` and `webauthn_challenge` tables (Alembic migration 0018), `webauthn` library for CBOR verification, 8 endpoints under `POST/GET/DELETE /api/v1/passkey/`, admin-restricted variants for the admin portal. Frontend: `@simplewebauthn/browser` handles the browser WebAuthn flow. 14 new API tests cover registration/authentication success and failure paths, list, delete, and admin guards.

- **Email logs admin portal tab** — new "Email Logs" tab in the admin dashboard; lists all `email_log` rows with filterable columns: recipient search (400ms debounce), email type dropdown (10 types), and outcome (All/Delivered/Failed); table shows timestamp, colour-coded email-type badge, recipient, entity type/code, outcome badge (Delivered/Failed), and details (Resend ID on success, truncated error message on failure); paginated at 50 per page with Previous/Next controls; backed by a new `GET /api/v1/admin/email-logs` endpoint with `search`, `email_type`, `success`, `page`, and `per_page` query parameters; 4 new API tests covering list, success-filter, recipient-search, and auth guard.

- **Email retry queue** — failed Resend API calls (after all in-process retries) are now persisted to a new `email_pending` table (Alembic migration 0017) containing the full email content (subject, HTML body, text body). Every subsequent `_send()` call first flushes all pending emails created within the last 24 hours with a single delivery attempt each (no delay loop, to keep request latency bounded). Successfully flushed records are deleted; failed ones have their `attempt_count` incremented and `last_attempted_at` updated. When the circuit breaker is open, the flush is aborted early and the new email is also queued. This ensures no email is silently dropped when Resend has a transient outage — it will be retried the next time any email is triggered. 11 new tests in `tests/test_email_pending.py` cover save, flush (success/failure/partial/circuit-open), expiry, and `_send` integration.

- **Admin verification resend** — added an admin Users-table action to resend talent profile verification emails for pending users, backed by a new admin API endpoint with a five-minute per-user cooldown and audit logging.
- **noon careers blog post** — added a new published blog article about using noon's careers site and hirebridge together for UAE job search; includes Alembic migration 0015 to seed the database row.
- **Cloud Run deploy failure logs** — the API deploy workflow now prints recent Cloud Run revisions, latest revision status conditions, and service logs when `gcloud run deploy` fails, so startup exceptions are easier to diagnose directly in GitHub Actions.
- **Playwright CLI artifact ignore rule** — `.playwright-cli/` is now ignored so local browser automation logs and screenshots do not appear as untracked repo files.
- **Seed 6 initial blog posts** — Alembic data migration 0014 inserts the 6 static blog posts (previously served from `blog-content.ts` only) as published `blog_post` rows on first deployment; uses a count-guard so seeding is skipped if any posts already exist; posts retain their original authored dates and reading times; the 6 posts are now manageable through the admin blog portal and have view/click metrics tracked from the moment of deployment; added `per-file-ignores` ruff exception for the migration file to allow long-form blog content strings
- **Admin blog management** — new "Blog" tab in the admin dashboard; admins can create, edit, delete, and change the status (draft/published/archived) of blog posts through a full-featured inline form (title, slug auto-generated from title, excerpt, markdown content, author, tags, reading minutes, featured image URL); blog tab shows a metrics bar with total posts, published count, total views, and total link clicks across the loaded page
- **Database-backed blog posts** — new `blog_post` table (Alembic migration 0013) with fields: `post_code` (public nanoid), `title`, `slug` (unique), `excerpt`, `content` (Markdown), `author`, `tags` (JSONB), `status` (draft/published/archived), `featured_image_url`, `reading_minutes`, `view_count`, `link_click_count`, `link_preview` (JSONB with url/title/description/image/domain); all public CRUD under `GET/POST/PUT/DELETE /api/v1/admin/blog/posts` (admin-authed) and public listing/detail under `GET /api/v1/blog/posts`
- **Link preview on blog posts** — admins can attach a URL to any blog post; the backend fetches OG/meta tags (`POST /api/v1/admin/blog/link-preview`) and stores the result as `link_preview` JSONB; the blog detail page renders a styled link preview card at the bottom of the article with title, description, thumbnail image, and domain; clicking the card increments the link click count atomically
- **Blog metrics tracking** — view counts and link click counts tracked atomically via `POST /api/v1/blog/posts/{post_code}/track-view` and `/track-link-click`; views are session-deduplicated client-side via `sessionStorage`; admin dashboard shows per-post and aggregate metrics
- **Blog listing page with search and tag filters** — `/blog` is now a client-side interactive page; users can search by title/excerpt/author with 350ms debounce and filter by tag (clickable pills); result count shown with active filter context; pagination for multi-page results; falls back to static content when the database is empty
- **Blog tags endpoint** — `GET /api/v1/blog/tags` returns all unique tags from published posts; used to populate filter pills on the blog listing page
- **Blog carousel on homepage** — new "From the Blog" section before the closing of the homepage showing up to 4 recent published posts; horizontal scroll carousel on mobile (snap-to-card), 4-column grid on desktop; falls back to static blog content when the DB has no published posts; includes "All articles" link to `/blog`
- **Blog detail page fetches from API** — `/blog/[slug]` now attempts to fetch the post from the API first and falls back to static `BLOG_POSTS` content; `generateStaticParams` still covers the static slugs for ISR; featured image shown if present; tags link to `/blog?tag=…` for filtered browsing; view tracking fires client-side on first load per session
- **Blog router** — `app/routers/blog.py` registered in `main.py`; provides public endpoints (`GET /blog/posts`, `GET /blog/posts/{slug}`, `GET /blog/tags`, `POST /blog/posts/{code}/track-view`, `POST /blog/posts/{code}/track-link-click`) and admin-protected endpoints (`GET/POST/PUT/DELETE /admin/blog/posts`, `POST /admin/blog/link-preview`)
- **Blog API tests** — 15 new tests in `tests/test_blog.py` covering public listing (empty, published-only, search), slug fetch, 404 for drafts, atomic view/click tracking, admin CRUD, duplicate-slug rejection, and tag listing; all passing

- **City filter on talent list** — city dropdown appears below country in filters; disabled with "Select country first" placeholder until a country is chosen; for countries with configured cities shows a dropdown with city options plus an "Other" free-text fallback; for unconfigured countries shows a plain text input; city is wired through backend (`city` query param on `GET /api/v1/profiles`), frontend types, URL param sync, and `getProfiles` API client
- **Top skills endpoint** — `GET /api/v1/profiles/top-skills` queries active profiles and returns the most-used skills ranked by frequency; result is cached module-level in the frontend so it's fetched once per page session; talent filter skills pills now show these DB-derived top skills instead of the static `POPULAR_SKILLS` constant
- **Skills filter moved above Employment Status** — reordered filter sidebar sections so skills appear before employment status and notice period
- **"Immediate & Open to Work" quick filter on talent page** — new prominent checkbox at the top of the filter sidebar that simultaneously sets `notice_period=immediate` and `employment_status=open_to_work`; highlights with a sage green background when active; stays in sync with the individual employment status and notice period filters bidirectionally (selecting the combo checks both individual options, and vice versa)
- **Notice period filter on talent profiles page** — new multi-select checkbox filter below employment status; filters profiles by one or more `notice_period` values (`immediate`, `1_week`, `2_weeks`, `1_month`, `3_months`, `6_months`); wired through backend (`GET /api/v1/profiles?notice_period=immediate&notice_period=1_week`), `getProfiles` API client, and URL query params
- **UAE landmark imagery across homepage and about page** — added Unsplash-hosted photography of Dubai Marina, Burj Khalifa, Dubai Creek, UAE desert dunes (homepage sections), Sheikh Zayed Grand Mosque, Al Fahidi old town, and Palm Jumeirah (about page) as atmospheric section backgrounds; each uses a low-opacity overlay consistent with the existing hero pattern to keep text fully legible while reinforcing the platform's UAE roots
- **Employment status field on talent profiles** — new `current_employment_status` column on the `profile` table (values: `open_to_work`, `part_time`, `full_time` [default], `remote`, `contract`, `freelance`); exposed in `ProfileCreate`, `ProfileUpdate`, `ProfileResponse`, and `ProfileListItem` schemas; displayed as a badge on profile cards ("Open to work" in sage green for actively seeking candidates, muted for others); added to the profile create/edit form in Section 02 (Availability)
- **Smart profile sort — employment status priority then recency** — `GET /api/v1/profiles` default sort now orders by employment status priority (`open_to_work` first, then `part_time`, `full_time`, `remote`, `contract`, `freelance`) and then by `last_renewed_at` descending within each group; "oldest" sort falls back to `last_renewed_at` ascending
- **Renewal bump — `last_renewed_at` column on job and profile** — new `last_renewed_at TIMESTAMPTZ NOT NULL` column on both `job` and `profile` tables (backfilled from `created_at` for existing rows); set to `now()` on creation and updated to `now()` whenever a listing is renewed via the `/renew` endpoint, so renewed listings float to the top of recency-sorted views; job "newest" sort now uses `last_renewed_at` instead of `created_at`
- **Alembic migration 0012** — adds `current_employment_status VARCHAR(20) NOT NULL DEFAULT 'full_time'` to `profile`, `last_renewed_at TIMESTAMPTZ NOT NULL` to both `profile` and `job` (backfilled from `created_at`), and supporting indexes `ix_profile_status_employment_sort` and `ix_job_status_last_renewed`
- **Employment status filter on talent profiles page** — new multi-select checkbox filter in the sidebar (mirrors the employment type filter on the jobs page); filters profiles by one or more `current_employment_status` values; wired through the backend (`GET /api/v1/profiles?employment_status=open_to_work&employment_status=contract`), `getProfiles` API client, and URL query params for shareable/bookmarkable URLs
- **Renamed "Newest first" sort to "Recommended" on talent page** — the default sort is employment-status priority (open to work first) then recency, not pure newest; label now correctly communicates this to users
- **Fixed background images** — replaced black/broken about page hero and random mountains on homepage last section with verified UAE-specific Unsplash photos; enforced minimum opacity floor of 15% on all section backgrounds (hero: 30% → 35%)

- **Pre-push hook** — new `.husky/pre-push` mirrors the GitHub CI test workflows: detects which apps have commits in the push, runs ruff lint + format check + bandit security scan + pytest (verbose) for the API, and eslint + typecheck + vitest + npm audit (high severity) for the web; bandit and npm audit are non-blocking (same as CI)

### Changed
- **Admin user email changes** — admins can now change a talent user's login email from the users table; the backend rejects emails already used by another talent user, recruiter, or admin address, keeps the existing `user_code` ownership for all profiles/jobs, updates matching job contact emails, invalidates old sessions, and records an audit log entry.
- **Admin session lifetime** — admin sessions now match regular and recruiter sessions: 30 days with no one-hour inactivity timeout, while still invalidating if the email is removed from the admin allow-list.

### Fixed
- **Admin blog edit form hydration** — admin blog list/create/update responses now include full post content so reopening a saved post hydrates the Markdown editor correctly; update handling now also persists explicit clearing of nullable featured-image and link-preview fields.
- **Blog seed public codes fit schema** — migration 0014 seed `post_code` values are now 12 characters to match the `blog_post.post_code VARCHAR(12)` schema and project public-code convention.
- **Blog seed migration bind typing hardened** — migration 0014 now uses a typed SQLAlchemy table insert with parsed JSON tag arrays and Python datetimes, avoiding raw `CAST(:param AS jsonb/timestamptz)` binds under asyncpg.
- **Blog seed migration startup crash** — Alembic migration 0014 now binds timezone-aware `datetime` objects for `created_at`/`updated_at` instead of ISO strings, fixing the asyncpg `expected a datetime.date or datetime.datetime instance` failure during Cloud Run startup.
- **Result count relocated to filter context** — moved the "X found" count off the hero heading and onto the filter component: on mobile it sits to the left of the "Filters" toggle button; on desktop it appears below the "Filters" sidebar heading; count is hidden while loading and shown only once results are fetched
- **Mobile infinite scroll not triggering** — the `IntersectionObserver` was set up when `isMobile` became true, but at that point `sentinelRef.current` was always `null` (the sentinel only renders after the initial fetch completes, outside the loading skeleton); added `loading` to the effect's dependency array and guard so the observer re-attaches once the first page of results is in the DOM
- **Resume page preview now fits the viewer card properly** — replaced the lower-level custom PDF rasterization path with a `react-pdf` based viewer and kept the custom Sage & Stone swipe UI around it. Resume pages now size from the actual page frame width and render at full visible width without the left/right edge clipping seen in the previous implementation
- **Admins can now deactivate reported profiles directly from the reports queue** — added an admin endpoint and reports-table action for deactivating reported talent profiles from the admin dashboard; the action sets the profile to `inactive` and resolves related pending reports in one step so moderation can be completed without leaving the report view
- **Profile detail now hydrates sensitive access correctly** — the talent detail page was server-rendered with the public profile payload only, so even valid admin/recruiter sessions still saw masked email and phone details until refreshless client code explicitly refetched with the bearer token. `ProfileDetail` now rehydrates the profile client-side for logged-in viewers, which restores unmasked contact details for admins, active recruiters, and profile owners
- **Resume viewer now renders clean swipeable pages** — replaced the embedded browser PDF viewer chrome in the talent detail page with a custom PDF.js-based horizontal page carousel that shows only the resume pages themselves, preserves the existing download/open actions, and supports horizontal swipe/scroll between pages
- **Profile owners can now open their own resume preview** — `GET /api/v1/profiles/{code}/resume` now authorizes admins, active recruiters, and the profile owner instead of recruiter-only access, which keeps owner-facing profile detail and resume preview behaviour consistent with contact-detail access
- **Recruiter registration crash** — `create_verification()` was called with a spurious `email=` keyword argument in `recruiters.py`; caused a `TypeError` on every `POST /api/v1/recruiters/register` request in production
- **Admins can now view full talent profile details** — `require_active_recruiter` dependency and the `GET /profiles/{code}` router both treated admins as non-recruiters, blocking contact info and resume access. Admins now bypass the recruiter status check and receive `include_sensitive=True` like active recruiters
- **Auto sign-out on expired session** — API calls that receive a 401 now fire a `auth:unauthorized` DOM event; `AuthContext` listens and immediately clears the session from state and `localStorage`, which causes auth-gated pages (`/account`, `/admin`) to redirect to login automatically instead of showing a stale "Session expired or invalid" error with no way out
- **Profile/job update 422 — missing `Content-Type: application/json`** — `request()` in `src/lib/api.ts` spread `...fetchOptions` after the merged `headers` object, causing the `headers` key to be overridden by the caller-supplied headers (e.g. `{ 'X-Edit-Token': token }`). PUT requests with custom headers silently lost `Content-Type: application/json`, so FastAPI received the body as a raw string and rejected it with "Input should be a valid dictionary". Fixed by destructuring `headers` out of options before spreading the remainder.

### Added
- **Mal careers blog seed** — added Alembic migration `0016_seed_mal_careers_blog_post.py` to publish a new DB-backed article about Mal's UAE fintech careers signal, its public roles page, and how candidates can stay discoverable through hirebridge.
- **Request validation error logging** — added a `RequestValidationError` exception handler in `app/main.py` that logs 422 errors with the full field-level detail to Cloud Logging, making it possible to diagnose future validation failures without needing DevTools access; handler uses recursive `_make_json_safe` to avoid `TypeError` on non-serialisable Pydantic error fields (bytes, exceptions)

### Fixed
- **Edit profile section numbers now match create profile** — restructured the edit profile form in `/manage/[entityType]/[code]` from 3 combined sections into 5 separate sections (01 Personal information, 02 Availability, 03 Professional brief, 04 Key skills, 05 Resume) to match the section numbering on the create profile form.
- **Profile update 422 on empty brief** — `ProfileUpdate.brief` had `min_length=50` but `ProfileCreate.brief` allows empty strings (`min_length=0`). Users who created profiles without a brief could not save edits from the manage page — the PUT always sent the current (empty) brief and Pydantic rejected it. Changed `ProfileUpdate.brief` to `min_length=0` to match creation behaviour.

### Added
- **Resume management in profile edit page** — the manage profile page (`/manage/profile/[code]`) now has a "Resume" section (Section 03) that shows the current resume status and lets the owner replace or remove it. Uploading uses the existing signed-URL GCS flow with a progress bar identical to the create-profile form.
- **Security headers: `Referrer-Policy` and `Permissions-Policy`** — added `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` to `security_headers_middleware` in `app/main.py`
- **Google Indexing API integration** — new `app/services/indexing_service.py`; fire-and-forget `notify_url_updated` / `notify_url_deleted` calls hooked into `verification_service.verify_code` (on activation), `internal.expire_listings` (on expiry), `job_service.remove_job`, and `profile_service.remove_profile`. Enabled by setting `GOOGLE_INDEXING_CREDENTIALS` env var to a GCP service-account JSON string; no-op when unset
- **410 Gone for expired/removed listings** — `get_job_detail` and `get_profile_detail` now raise HTTP 410 (instead of 404) when status is `expired` or `removed`; frontend job/profile detail pages render a friendly "listing no longer available" UI with `robots: noindex` metadata on 410 responses
- **`company_logo_url` field on Job** — optional `VARCHAR(2048)` column added to `job` table (migration `0011_company_logo_url`); exposed on `JobCreate`, `JobUpdate`, `JobResponse` schemas, `Job` TypeScript type, and conditionally included as `hiringOrganization.logo` in `jobPostingSchema` JSON-LD
- **Canonical URL tags on paginated browse pages** — `CanonicalTag` client component (`src/components/seo/CanonicalTag.tsx`) dynamically updates `<link rel="canonical">` based on the current `?page=` param; added to `/jobs` and `/profiles` browse pages; filter params intentionally excluded from canonical

### Fixed
- **Profile update endpoint now supports resume replace/remove** — `PUT /api/v1/profiles/{code}` accepts an optional `resume_key` field: a GCS path string replaces the resume, an explicit `null` removes it (and deletes the old file from GCS), and omitting the field leaves the resume untouched. Previously the update endpoint silently ignored resume changes, causing the "error while updating resume" failure.
- **`ProfileUpdate` schema** — added `resume_key: str | None` field so the PUT body can carry resume changes through to the service layer.
- **`UpdateProfileRequest` TypeScript type** — added `resume_key?: string | null` to match the new backend field.

### Changed
- **Disable API docs in production** — FastAPI `docs_url`, `redoc_url`, and `openapi_url` now resolve to `None` when `settings.is_production` is true, reducing attack surface on Cloud Run
- **`CitySelect` added to edit job and edit profile forms** — the city field in `/manage/[entityType]/[code]` now uses the `CitySelect` component (country-aware dropdown with "Other" freetext fallback) instead of a plain text input for both job (`company_city`) and profile (`current_city`); country field is now ordered before the city field in both forms so country is always selected first
- **Backend test updated** — `test_get_removed_profile_returns_404` renamed to `test_get_removed_profile_returns_410` and updated to assert 410
- **PRODUCTION.md** — added section 11 (Cloud Scheduler setup for `expire-listings` and `cleanup` cron jobs) and section 11a (Google Indexing API service account + Search Console owner grant); renumbered Verification Checklist → 13, Umami → 14, Troubleshooting → 15; added `GOOGLE_INDEXING_CREDENTIALS` to the GitHub secrets table

### Fixed
- **ESLint `react-hooks/set-state-in-effect` error in `CitySelect`** — replaced the `useEffect` that called `setShowOther(false)` on country change with derived state: `showOther` is now computed as `showOtherForCountry === country`, so it resets automatically without an effect when the country prop changes; removed unused `useEffect` import

### Added
- **Country-first city selection in job and profile creation forms** — country must now be selected before city; city field renders as a dropdown of major cities for the chosen country (covering all Middle East countries and all major world countries), with "Other" as the last option which reveals a freetext input stored as the city value; unsupported countries fall back directly to a freetext input; selecting a new country resets the city field
- **`CitySelect` component** (`src/components/shared/CitySelect.tsx`) — new shared component encapsulating the country-aware city dropdown + freetext fallback logic
- **`city-data.ts` constant** (`src/lib/city-data.ts`) — comprehensive `COUNTRY_CITIES` mapping from ISO country codes to arrays of major cities for all countries in the platform, with especially thorough Middle East coverage
- **Added missing Middle East countries** to the `COUNTRIES` list in `constants.ts`: Bahrain (BH), Iran (IR), Iraq (IQ), Kuwait (KW), Oman (OM), Palestine (PS), Qatar (QA), Syria (SY), Yemen (YE)

### Changed
- **Email verification messages now mention spam/junk folder** — all "check your email" prompts across the frontend (verify page, profile creation, login, recruiter registration, admin login) now include a note to check the spam or junk folder if the email isn't visible

### Changed
- **E2E test suite audited and updated** — `smoke.spec.ts` expanded from 7 to 22 tests, covering `/about`, `/faq`, `/contact`, `/profiles/new`, `/jobs/new`, `/recruiter/register`, `/verify` (no-code state), and `/report` (no-code state); `critical-path.spec.ts` fixed broken profiles navigation selector (was matching "Create Profile" → `/profiles/new` instead of "Talent" nav link → `/profiles`), added recruiter form validation tests, and added mocked verify/manage invalid-state tests; `responsive.spec.ts` expanded from 3 to 8 key pages (added `/about`, `/faq`, `/contact`, `/profiles/new`, `/recruiter/register`)

### Changed
- **Homepage hero subheading** — updated to "If recent events have shaken your career in the UAE, hear this: you're not alone. This is a place where talent is truly valued and opportunities are real — no algorithms, no spam, no cost."
- **Removed all political framing** — replaced "The ongoing conflict in the Middle East" on the About page and "regional conflict" in `llms.txt` with neutral "recent events" language; platform remains apolitical
- **OG image replaced with real homepage screenshot** — retaken at 1200×630 to reflect latest copy — removed dynamic `opengraph-image.tsx` generator; replaced with a static `public/og-image.png` (1200×630 Playwright screenshot of the live homepage); `layout.tsx` now explicitly sets `og:image` and `twitter:image` to this file

### Fixed
- **Umami analytics events not recorded for UAE visitors** — UAE ISPs (e& / du) use deep packet inspection that matches on `/stats/api/send` URL patterns and Umami's JSON payload shape. Replaced the client-side Next.js rewrite for event collection with a server-side Next.js API route (`src/app/api/send/route.ts`) that receives events from the browser and forwards them to Umami from the server, preserving the user's real IP via `X-Forwarded-For` for accurate geo attribution. Also renamed the script proxy path from `/stats/script.js` to `/lib/app.js` to avoid URL pattern matching on "stats".

### Changed
- **Removed all "tech" framing from platform copy** — updated `layout.tsx` site title, OG/Twitter tags, meta description, and keywords; `schema.ts` Organization description; `opengraph-image.tsx` alt text, label, and tag pills; `jobs/new/page.tsx` recruiter posting subheading; `profiles/in/[emirate]/page.tsx` title, description, JSON-LD, and page heading; `jobs/in/[emirate]/page.tsx` meta description and JSON-LD; `jobs/type/[type]/page.tsx` JSON-LD description; `faq/page.tsx` platform description, free zones answer, Golden Visa answer, salary question (broadened from tech-only to cross-industry), emirate jobs question (rewritten from "most tech jobs" to general), and hero subheading
- **Removed "tech" framing across all platform copy** (earlier partial pass) — replaced "UAE's talent-first tech platform" with "Built for the UAE's workforce" in the footer and mobile nav; updated the About page hero heading to "A job platform built for our community" and revised its metadata and subheading to reflect the general, cross-industry nature of the platform; updated `llms.txt` to describe hirebridge as a cross-industry platform for UAE professionals rather than "UAE tech talent", added context about the regional conflict motivation, and broadened the primary market from "UAE tech sector" to all industries
- **Homepage hero redesigned with UAE flag background** — replaced the light cream hero with an editorial dark-background hero featuring the ethereal UAE flag image (`/uae-flag-background.png`) at 40% opacity with a silk-weave mask fade; headline updated to "Your Talent is Still Your Power." with new supportive copy; hero CTAs changed to "Post your Story" (→ `/profiles/new`) and "Discover Roles" (→ `/jobs`)
- **"Our Story" section removed from homepage** — content lives on the `/about` page; removed redundant inline summary
- **"Ready to get started?" CTA strip replaced with Browse section** — new two-card grid ("Browse Talent" / "Discover Roles") with live active profile and job counts, replacing both the primary CTA strip and the inline browse buttons that were previously in the hero

### Added
- **Quick-add skill pills on job and profile forms** — a "Quick add" row of 10 pill buttons appears below the skills text input on both the job and profile creation forms; pills show the top 10 resume skills relevant to the Middle East market (Microsoft Office, Project Management, Data Analysis, Communication, Customer Service, Leadership, Sales, Problem Solving, Teamwork, Bilingual AR/EN); pills disappear as skills are added to prevent duplicates
- **`TOP_SKILLS` replaced with 25 general Middle East skills** — removed the tech-heavy skill list (React, Python, JavaScript, etc.) from `seo-constants.ts` and replaced with 25 broadly applicable cross-industry skills matching what Gulf recruiters actually search for (Project Management, Sales, Customer Service, Financial Analysis, Business Development, Supply Chain Management, etc.); these drive all sitemap skill landing pages (`/jobs/in/{emirate}/{skill}`, `/profiles/skill/{skill}`)
- **Footer "Popular Skills" updated** — replaced tech skill links (React, Python, etc.) with high-volume general skills: Sales, Project Management, Customer Service, Business Development, Marketing, Financial Analysis
- **Job form quick-add expanded to 15 pills** — increased from 10 to 15 skills and updated the list to match recruiter priorities: Project Management, Communication, Sales, Customer Service, Leadership, Data Analysis, Business Development, Financial Analysis, Operations Management, Marketing, Account Management, Negotiation, Strategic Planning, Microsoft Excel, Supply Chain Management
- **`@vercel/speed-insights` reinstalled** — package reinstalled and `<SpeedInsights />` component re-added to `layout.tsx`; Vercel Speed Insights retained for Core Web Vitals monitoring while Vercel Analytics remains removed

### Removed
- **`@vercel/analytics`** — uninstalled package (component was already removed from `layout.tsx` in a prior commit but package remained in `package.json`)

### Fixed
- **Umami tracking reliability improvements** — fixed three issues causing missed page views and events, particularly for UAE users: (1) `data-host-url` was conditionally `undefined` when `NEXT_PUBLIC_SITE_URL` was unset, causing Umami to send beacons directly to `cloud.umami.is` instead of through the `/stats/api/send` proxy — UAE ISPs (Etisalat/du) block external analytics domains, so this silently dropped all tracking for those users; fixed by using the `SITE_URL` constant (which already has the `hirebridgeuae.com` fallback) so the proxy is always used; (2) Umami respects the browser `Do Not Track` header by default — UAE corporate/government devices commonly have DNT enabled; added `data-do-not-track="false"` to ensure all users are tracked regardless of DNT setting; (3) `strategy="lazyOnload"` defers the script until after the page is fully idle, causing missed events on mobile/slow connections where users navigate away before the script fires; changed to `strategy="afterInteractive"` which loads as soon as the page is interactive

### Changed
- **Consolidated PII into `user_sensitive` table** — introduced a new `user_sensitive` table (`user_code`, `user_email`, `user_phone`) as the single source of truth for user email addresses and phone numbers. `job`, `profile`, and `email_verification` tables now store a `user_code` foreign reference instead of duplicating the email. `profile.contact_number` has moved to `user_sensitive.user_phone`. All service-layer operations that previously filtered by email now do a single indexed lookup on `user_sensitive` and then filter by `user_code` — no regression in query performance. `internal.py` expiry-warning queries use a JOIN to fetch owner email in one round-trip. `admin_service.list_users` JOINs `user_sensitive` to enable email search without a separate lookup. Existing data is migrated automatically by Alembic migration `0010_user_sensitive`.

### Fixed
- **Lock file sync** — ran `npm install` in `selfserve-jobs-customer-web/` to regenerate `package-lock.json` after `next` was bumped to `^16.2.3`; resolves `npm ci` failures in CI
- **Admin can now post jobs** — `isActiveRecruiter` in `AuthContext` was gated on `userType === 'recruiter'`, excluding admins; fixed to also return `true` when `isAdmin`
- **Founding year corrected to 2026** — updated `llms.txt` route (both inline text and `Launch year` field) to reflect the correct founding year

### Added
- **Sentry error monitoring for frontend** — `@sentry/nextjs` installed; `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` created; `src/instrumentation.ts` registers server/edge configs via Next.js instrumentation hook; `next.config.ts` wrapped with `withSentryConfig` (source map upload gated on `SENTRY_AUTH_TOKEN`, tunnel route `/monitoring` to bypass ad-blockers); errors only sent in production, 10% performance tracing sample rate

### Removed
- **Vercel Analytics and Speed Insights** — removed `@vercel/analytics` and `@vercel/speed-insights` packages and their `<Analytics />` / `<SpeedInsights />` components from `layout.tsx`

### Added
- **Phase 7 — Test Coverage & CI Hardening (full implementation)**
  - *Backend — rate limiting:* `test_coverage_gaps.py` extended with `test_verify_ip_rate_limit` (POST /verify, 5/minute), `test_create_job_ip_rate_limit` (POST /jobs, 10/hour), and `test_report_ip_rate_limit` (POST /reports, 10/hour) — verifies slowapi middleware rejects the N+1 request with HTTP 429 after counting all requests regardless of their response status
  - *Backend — view count:* `test_view_count_accumulates_over_multiple_requests` — verifies five sequential GET /jobs/{code} requests each increment the counter atomically so the final count equals 5
  - *Frontend — search:* `SearchBar.test.tsx` — covers rendering, custom placeholder, onChange fired on each keystroke, clear button visibility, clear action, searching spinner, and mutual exclusion of spinner vs clear button
  - *Frontend — auth:* `AuthContext.test.tsx` — covers initial state, login/logout, localStorage persistence, role flags (isAdmin, isActiveRecruiter, isPendingRecruiter), updateRecruiterStatus, session restore on mount, corrupt storage handling, and useAuth outside provider guard
  - *Frontend — error boundary:* `error-boundary.test.tsx` — covers GlobalError: "Something went wrong" label, heading, descriptive message, "Try again" button, "Go home" link, reset() callback, console.error on mount, and re-render stability
  - *CI — parallelization:* `.github/workflows/test-all.yml` — single workflow with two parallel jobs (`test-api` / `test-web`) using reusable workflow references; triggered on PRs that touch either layer or workflow files
  - *CI — E2E:* `.github/workflows/e2e.yml` — manual `workflow_dispatch` workflow that installs Playwright Chromium, runs E2E tests against a `BASE_URL` input, and uploads the HTML report as an artifact
  - *E2E — Playwright scaffold:* `playwright.config.ts` — Desktop Chrome, Mobile Chrome (Pixel 5), and Tablet projects; `webServer` auto-starts dev server locally; `retries: 2` in CI; `BASE_URL` override for staging
  - *E2E — smoke tests:* `e2e/smoke.spec.ts` — homepage, jobs list, and profiles list smoke checks (HTTP 200, main region visible, search input present)
  - *E2E — responsive tests:* `e2e/responsive.spec.ts` — key pages tested at 375 px / 768 px / 1280 px viewports for visible main content and absence of horizontal scroll
  - *E2E — critical-path tests:* `e2e/critical-path.spec.ts` — browse, search, and clear interactions always run; full create→verify→manage→delete flow gated behind `E2E_FULL_FLOW=true`
  - `@playwright/test ^1.50.0` added to `devDependencies`; `e2e`, `e2e:ui`, and `e2e:install` npm scripts added

### Fixed
- **MarkdownEditor** — toolbar bold/italic/underline/heading buttons were unclickable because the outer container's `onClick` (focus trigger) was firing after every toolbar `onMouseDown`; fixed by moving `cursor-text` + `onClick` to the `EditorContent` div only, and adding `e.stopPropagation()` to every toolbar button's `onMouseDown` handler
- **MarkdownEditor** — bullet/numbered lists had no visible markers (Tailwind v4 preflight resets `list-style: none`); fixed by adding `list-style-type: disc` / `list-style-type: decimal` + `padding-left` to `.ProseMirror ul` / `.ProseMirror ol` in `globals.css` (the editor content lives in `.ProseMirror`, not `.prose`)

### Added
- **MarkdownEditor** — underline support via `@tiptap/extension-underline`; underline toolbar button (⌘U) added between Italic and the list group

- **Migration 0008** — `json_array_length()` does not work on `jsonb` columns; replaced with `jsonb_array_length()` in both `chk_job_key_skills_max_length` and `chk_profile_key_skills_max_length` CHECK constraints
- **Deploy workflow** — `ADMIN_EMAILS` and `ADMIN_NOTIFICATION_EMAIL` env vars were missing from `deploy-api.yml`; both now passed from GitHub secrets to Cloud Run on every deploy so they no longer need to be set manually in the GCP console
- **PRODUCTION.md** — added `ADMIN_EMAILS` and `ADMIN_NOTIFICATION_EMAIL` to the GitHub Actions secrets table and the manual deploy command in step 6b

### Changed
- **Homepage restructured** — "Ready to get started?" CTA strip moved above "Our story" section; "Our story" section gains an eyebrow + `h2` heading ("Why we built *this*") matching the about page pattern; background alternation (primary → surface → bg → surface → bg) preserved throughout.

### Added
- **Phase 6 — SEO & Structured Data (full implementation)**
  - *OG image:* `app/opengraph-image.tsx` added — branded `ImageResponse` (1200×630) with design-system palette (sage green, forest, cream); serves as site-wide default OG/Twitter card for all pages without a page-specific image; replaces broken `/og-default.png` reference in root layout metadata
  - *Canonical URLs:* `alternates.canonical` already present on `/jobs/[jobCode]` and `/profiles/[profileCode]` `generateMetadata` — confirmed complete
  - *Breadcrumbs:* `Breadcrumbs.tsx` renders both visual trail and `BreadcrumbList` JSON-LD on all job/profile detail pages and blog post pages — confirmed complete
  - *Robots:* `/admin/` already in `PRIVATE_PATHS` disallow list in `robots.ts` — confirmed complete
  - *Blog structured data:* `articleSchema` JSON-LD, `og:type: 'article'`, author metadata, and canonical URL already on `/blog/[slug]` — confirmed complete
  - *Sitemap validation:* 50,000 URL hard cap and 45,000 warn threshold already enforced in `sitemap.ts` — confirmed complete

### Changed
- **All Resend email sends moved to FastAPI `BackgroundTasks` across every user-facing router** — `POST /auth/login`, `POST /verify/resend`, `POST /recruiters/register` (verification email + admin notification), `POST /manage/request-links`, `POST /admin/login`, `POST /admin/recruiters/{code}/approve`, and `POST /admin/recruiters/{code}/reject` no longer block on the Resend HTTP call; each handler returns as soon as DB work is flushed. 503 guards on `/auth/login` and `/verify/resend` removed. Test updated to assert 200 on email failure.
- **`POST /profiles` verification email sent as BackgroundTask** — `send_verification_email` moved off the request thread using FastAPI `BackgroundTasks`; the handler now returns as soon as the profile and verification records are flushed (~100–150 ms), cutting profile creation latency from ~1.2 s to ~150 ms. The db session stays alive until after background tasks complete so the email log write still commits in the same transaction. The now-unreachable 503 guard (raised if email send failed) has been removed; resend is available if the email is not received.
- **Resume upload now happens immediately on file selection, not on form submit** — as soon as the user picks a PDF, the frontend calls `POST /upload/resume/signed-url` and starts a direct browser-to-GCS PUT upload via XHR; form submission only calls `POST /profiles` (no upload step), cutting the end-to-end wait from ~2.7 s to ~1.2 s
- **Upload progress bar on resume section** — XHR `upload.onprogress` drives a real percentage bar during the upload; the dropzone cycles through `idle → uploading (with %) → done (green checkmark) → error (retry prompt)` states
- **"Create Profile" button disabled during upload** — button is disabled while `uploadState === 'uploading'`; re-enabled when upload completes or errors out so the user knows they must fix the file first
- **`uploadResumeWithProgress` replaces `uploadResumeDirect` in `api.ts`** — XHR-based implementation with an `onProgress` callback; dev-mode behaviour unchanged (signed URL is `null`, upload is skipped, state moves directly to `done`)

### Added
- **Phase 5 — Frontend Quality & Accessibility (full implementation)**
  - *Accessibility:* Modal component now stores focus trigger on open, returns focus to trigger on close, and moves focus to first focusable element inside dialog; `role="alertdialog"` variant added for destructive confirmations (prevents backdrop-click dismiss, hides close button); `aria-labelledby` wires title to dialog element
  - *Accessibility:* `aria-haspopup="menu"` (was `"true"`) on `CreateListingDropdown` trigger button in Header to match `role="menu"` popup
  - *Accessibility:* MobileNav drawer now traps Tab focus within the panel, handles Escape key to close, moves focus to close button on open, and returns focus to the hamburger trigger on close
  - *Accessibility:* Removed `text-text-muted/70` opacity modifier from visible text in `JobCard`, `ProfileCard`, `Footer`, and blog page — effective contrast was ~3.93:1 on white backgrounds, below WCAG AA 4.5:1 minimum for normal text
  - *UX:* Delete listing confirmation converted from inline expansion to `Modal` with `role="alertdialog"` — semantically announced as a dialog, no accidental backdrop dismissal
  - *UX:* Save and renew success messages in manage page converted from inline `StatusBanner` to `addToast()` — non-blocking feedback via the existing `ToastContext` system
  - *UX:* `JobDetailSkeleton` and `ProfileDetailSkeleton` components added to `Skeleton.tsx` — match the visual structure of the detail page hero (breadcrumb, title, badges, skills, body lines)
  - *UX:* `loading.tsx` files created for `/jobs/[jobCode]` and `/profiles/[profileCode]` route segments — Next.js now shows the detail skeleton while the server component streams
  - *UX:* Suspense fallback on `/jobs` and `/profiles` list pages upgraded from plain `<span>Loading…</span>` to a full skeleton grid (`JobsPageSkeleton` / `ProfilesPageSkeleton`) matching the page layout
  - *UX:* Blur-time field validation added to `JobForm` (job title, company name, city, contact email/URL) and `ProfileForm` (full name, email, current title, city, years of experience) — `blurField()` helper runs the shared validator and surfaces only the relevant field error on `onBlur`
  - *Performance:* `JobFormLower` extracted to separate file (`JobFormLower.tsx`) and loaded via `next/dynamic` with `ssr: false` — sections 02–05 (description, skills, salary, how-to-apply) now code-split from section 01; loading state renders animated skeleton placeholders
  - *Performance:* `ProfileFormLower` extracted to `ProfileFormLower.tsx` and lazy-loaded the same way — sections 02–05 (availability, brief, skills, resume) deferred until after section 01 hydrates

### Fixed
- **Cloud Run API deploy failing with "container failed to start and listen on the port"** — `deploy-api.yml` was calling `gcloud run deploy` with only `--image`, `--region`, `--platform`, `--allow-unauthenticated`, `--port`. It passed no `--service-account`, no `--add-cloudsql-instances`, and no env vars, so the container started with no `DATABASE_URL`. Since the security hardening in commit d6a9c23 removed the default for `Settings.database_url`, Pydantic now raises a `ValidationError` at module import time (`settings = get_settings()` in `app/main.py`), crashing uvicorn before it can bind to port 8080. The workflow now: attaches the service account, attaches the Cloud SQL instance (`--add-cloudsql-instances`), writes a YAML env-vars file with `DATABASE_URL`, `GCS_BUCKET_NAME`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL`, `INTERNAL_API_SECRET`, `SENTRY_DSN`, `ENVIRONMENT=production`, `LOG_FORMAT=json`, and passes it via `--env-vars-file`, and sets resource limits (`--memory 512Mi --cpu 1 --timeout 300 --cpu-boost --min-instances 0 --max-instances 10`) to match PRODUCTION.md §6b. New required GitHub secrets: `GCP_CLOUDSQL_INSTANCE`, `GCP_DATABASE_URL`, `GCS_BUCKET_NAME`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL`, `INTERNAL_API_SECRET` (and optional `SENTRY_DSN`); the workflow's secret-validation step now errors early if any are missing. PRODUCTION.md §10 updated with the full secret table.
- **ROADMAP.md audit** — unchecked "Paginate sitemap" completed item: `sitemap.ts` uses a single `sitemap()` export with a 50,000-URL cap and warning log, not the `generateSitemaps()` index pattern described; item moved back to open/pending

### Added
- **Default Open Graph image** — root layout `og:image` and `twitter:image` now reference `/og-default.png` (1200×630); pages without a custom OG image will use this fallback for social sharing
- **Sitemap URL cap** — `sitemap.ts` now hard-caps output at 50,000 URLs (Google's per-file limit) and logs a warning at 45,000 so the team knows to split into multiple sitemaps
- **Skip-to-main-content link** — first focusable element in root layout; visible on focus, invisible otherwise (`sr-only focus:not-sr-only`)
- **Toast notification system** — `ToastContext` + `ToastProvider` with `useToast()` hook; auto-dismisses after 4s; `aria-live="polite"` region for screen readers; success/error/info variants
- **Card skeleton loading** — `JobCardSkeleton` and `ProfileCardSkeleton` components replace spinner on browse pages; layout matches final card structure for zero layout shift
- **Internal cron endpoints** — `POST /api/v1/internal/expire-listings` transitions active listings past `expires_at` to `expired` and sends 7-day expiry warning emails (hourly window ±1h); `POST /api/v1/internal/cleanup` deletes expired `auth_session` / `login_token` rows and `email_log` rows older than 90 days; both endpoints are protected by a shared secret (`X-Internal-Secret` header, `INTERNAL_API_SECRET` env var)
- **Expiry warning email template** — `email_templates/expiry_warning.py` renders a Sage & Stone styled 7-day expiry reminder; `email_service.send_expiry_warning_email()` added as the corresponding send function
- **`INTERNAL_API_SECRET` config field** — new `Settings` field for the cron shared secret; empty string disables the endpoint with 503
- **Admin new-recruiter notification** — `send_admin_new_recruiter_notification` is now called in `POST /api/v1/recruiters/register` after successful registration; failure is non-fatal (warning-logged, not surfaced to caller)
- **Resume GCS cleanup on profile removal** — `profile_service.remove_profile` now calls `storage_service.delete_file(resume_gcs_path)` after marking the profile as `removed`; deletion failure is warning-logged, not re-raised
- **Structured JSON logging** — `pythonjsonlogger` replaces `basicConfig`; production uses JSON format (toggled via `LOG_FORMAT=json` env var), development uses plain text; all log records include `timestamp`, `level`, `logger`
- **Request correlation IDs** — `request_id_middleware` generates a UUID per request (or echoes `X-Request-Id` header if supplied) and returns it in `X-Request-Id` response header; `request.state.request_id` is available to handlers
- **Sentry error tracking** — `sentry-sdk[fastapi]` integrated; initialised at startup when `SENTRY_DSN` env var is set; includes FastAPI and SQLAlchemy integrations; traces sampled at 10%
- **DB query timeout** — PostgreSQL connections now set `statement_timeout=30000ms` via `server_settings` in `connect_args`
- **Slow query logging** — SQLAlchemy engine event hooks log a WARNING for any query exceeding 500ms, including elapsed time and truncated statement
- **Connection pool event logging** — `connect` and `checkin` engine events log at DEBUG level for pool visibility
- **Health check DB probe** — `GET /api/v1/health` now runs `SELECT 1` against the DB and returns `{"db": "ok"}` (200) or `{"db": "unreachable"}` (503)
- **HTTP rate limiting via slowapi** — `POST /jobs`, `POST /profiles` limited to 10/hour/IP; `POST /verify` limited to 5/minute/IP; `POST /verify/resend` limited to 3/day/IP; `POST /reports` limited to 10/hour/IP; returns HTTP 429 on excess
- **Admin inactivity timeout** — admin sessions now expire after 1 hour of inactivity (`last_active_at` column on `auth_session`); `validate_session` bumps this field on every API call and deletes the session if idle too long
- **DB indexes (migration 0006)** — added `ix_job_email`, `ix_profile_email`, `ix_job_status_expires_at`, `ix_profile_status_expires_at`, `ix_email_verification_entity`, `ix_job_email_status`, `ix_profile_email_status` for query performance; added unique constraint `uq_report_entity_reporter` on `(entity_type, entity_code, reporter_email)` to atomically prevent duplicate reports at DB level

- **PRODUCTION.md troubleshooting section** — Section 13 added covering: migration errors (partial migrations, permission failures), GCS auth failures (IAM, CORS, signed URLs), Resend outages (circuit breaker, manual resend), CloudSQL connection limits (pool sizing, instance tier upgrade), slow/failed health checks, and internal cron endpoint failures; each section includes diagnosis commands and fix procedures
- **OpenAPI spec enrichment** — Added `BearerAuth` and `EditToken` security schemes; `429` response documented on all POST/PUT/DELETE operations; `JobCreate` and `ProfileCreate` schemas include concrete request examples; API description documents auth methods and rate-limit rules
- **Listing renewal flow** — `POST /api/v1/jobs/{code}/renew` and `POST /api/v1/profiles/{code}/renew` endpoints extend `expires_at` by 60 days and set status to `active`; max 2 renewals per listing enforced via `renewal_count` column (migration 0009); "Renew for 60 days" section added to manage page showing renewals used out of max
- **`renewal_count` field on `Job` and `Profile` schemas** — exposed in API responses so the frontend can render renewal state
- **`key_skills` CHECK constraint (migration 0008)** — `json_array_length(key_skills) <= 30` added to `job` and `profile` tables as `NOT VALID` constraints (enforces on new/updated rows without a full table scan)
- **Client-side GET cache in api.ts** — 60-second in-memory TTL cache for `getJobs` and `getProfiles` client-side calls; eliminates redundant API fetches on rapid navigation; also adds `next: { revalidate: 120 }` to `getProfiles` for server-side revalidation parity with `getJobs`
- **Email retry with exponential backoff** — `_send()` now retries up to 3 times with 1s / 5s / 30s delays before marking a send as failed; each attempt is logged at WARNING level
- **Circuit breaker for Resend** — after 5 consecutive Resend failures the circuit opens; all sends are skipped for a 2-minute cooldown, then a half-open probe is allowed; state changes are logged at WARNING level
- **`List-Unsubscribe` headers** — all outgoing emails now include `List-Unsubscribe` (mailto + URL) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers for CAN-SPAM / GDPR compliance
- **Admin report threshold notification** — `send_admin_report_notification` added to `email_service`; called automatically from `report_service.submit_report` when the 3-report threshold is reached; fire-and-forget (failure is warning-logged)
- **Dynamic footer domain in email templates** — `base.py shell()` now accepts an optional `site_url` parameter; falls back to `settings.frontend_url`; removes the hardcoded `hirebridgeuae.com` from the email footer
- **Admin report email template** — `email_templates/admin_report.py` renders a formatted alert with entity details and a CTA button to the admin portal
- **Admin audit log** — new `admin_audit_log` table (migration 0007) records every admin mutation (`approve_recruiter`, `reject_recruiter`, `flag_entity`) with `admin_email`, `action`, `entity_type`, `entity_code`, and a `details_json` payload; `write_audit_log` service helper used across all admin mutations
- **Manual entity flagging** — `POST /api/v1/admin/entities/{type}/{code}/flag` allows admins to set a job or profile to `under_review` without waiting for 3 reports; writes an audit log entry
- **Admin session invalidation on email removal** — `validate_session` now checks that admin session emails are still present in `ADMIN_EMAILS` config on every request; sessions for removed admin emails are deleted immediately
- **Backend test coverage (Phase 7)** — 9 new tests in `tests/test_coverage_gaps.py` covering: verification resend 503 on email failure, profile creation 503 on email failure in production mode, job update 422 on invalid `contact_method`/field combinations, view count increment on job/profile GET detail, admin recruiter rejection invalidates all sessions, profile removal succeeds with GCS delete failure

### Fixed
- **N+1 query in admin report listing** — `admin_service.list_reports` now batch-fetches entity titles using two IN-clause queries (one for jobs, one for profiles) instead of one SELECT per report
- **Graceful shutdown** — lifespan handler now calls `engine.dispose()` on shutdown to cleanly drain DB connections
- **`/admin/` disallowed in robots.txt** — added to `PRIVATE_PATHS`; all bot user-agent rules now exclude admin routes
- **Search loading indicator** — `SearchBar` now accepts `searching` prop; shows spinner during 350ms debounce window; browse pages pass state correctly
- **Improved empty state messaging** — browse pages detect whether filters are active and show context-appropriate messages ("Try broadening your search" vs "No jobs posted yet")
- **`aria-current="page"`** — nav links now set `aria-current="page"` on the active route
- **`aria-busy` on content regions** — browse list containers set `aria-busy` during loading
- **Keyboard dropdown navigation** — `CreateListingDropdown` now supports Enter/Space to open, Escape to close, ArrowDown/ArrowUp to navigate items; `aria-haspopup`/`aria-expanded` attributes added; items have `role="menuitem"`
- **`aria-expanded` on mobile menu button** — hamburger menu button now reflects open state
- **React.memo on `JobCard` and `ProfileCard`** — cards no longer re-render on filter changes that don't affect their props
- **Analytics deferred to `lazyOnload`** — Umami script strategy changed from `afterInteractive` to `lazyOnload`; non-critical analytics no longer blocks interactivity
- **Stale view count in detail responses** — `get_job_detail` and `get_profile_detail` now execute an atomic `UPDATE view_count+1` before fetching, so the returned object reflects the current count; removed separate `POST /jobs/{code}/view` and `POST /profiles/{code}/view` endpoints and `ViewTracker` client component (view is now counted server-side on each GET detail)
- **Missing contact_method validator on `JobUpdate`** — added `model_validator` to `JobUpdate` enforcing that `contact_email` is provided when `contact_method='email'` and `contact_url` is provided when `contact_method='url'`
- **Status field bypassable via update payload** — `update_job` and `update_profile` services now whitelist updatable fields explicitly instead of blindly applying `model_dump(exclude_unset=True)`, preventing `status` or other protected fields from being injected via the update body
- **Race condition in duplicate report detection** — added DB-level unique constraint `(entity_type, entity_code, reporter_email)` on `report` table; concurrent submissions that bypass the in-memory check will now receive a DB integrity error
- **Admin session expiry reduced** — admin sessions now use `ADMIN_SESSION_EXPIRY_DAYS=7` (down from 30) instead of the shared `SESSION_EXPIRY_DAYS` constant
- **Sessions not invalidated on recruiter rejection** — `reject_recruiter` in `recruiter_service.py` and `reject_recruiter_with_reason` in `admin_service.py` now DELETE all `auth_session` rows for the rejected recruiter's email before flushing
- **React cache missing on job detail page** — `getJob` was called independently in `generateMetadata` and the page component, counting two views per SSR render; now wrapped with `cache()` matching the existing pattern on profile detail page

### Changed
- **Dockerfile hardened** — multi-stage build (builder + runtime), pinned base image digest (`python:3.12-slim@sha256:804ddf3...`), non-root user `appuser`, `HEALTHCHECK` pointing to `/api/v1/health`
- **`.dockerignore` added** — excludes `.env*`, `.venv`, `__pycache__`, `tests/`, `*.md`, `uv.lock` from build context
- **CI: dependency caching** — `test-api.yml` now caches `~/.cache/uv` keyed on `pyproject.toml` hash
- **CI: bandit security scan** — `test-api.yml` runs `bandit -r app/ -ll` on every run; failures are non-blocking (`|| true`) to avoid blocking on informational findings
- **CI: npm audit security scan** — `test-web.yml` runs `npm audit --audit-level=high` after tests; non-blocking
- **CI: pre-deploy secrets validation** — `deploy-api.yml` validates all 4 required GCP secrets are non-empty before attempting auth
- **CI: post-deploy health check** — `deploy-api.yml` polls `/api/v1/health` up to 5 times after deploy, failing the workflow if it never returns 200
- **Max pagination guard** — `GET /jobs` and `GET /profiles` `page` query param now capped at `MAX_PAGE=200` (HTTP 422 beyond); prevents expensive OFFSET queries on deep pages

### Security
- **Remove hardcoded dev DB credentials from `alembic.ini`** — replaced `postgresql+asyncpg://jobs4u:jobs4u_dev@...` with placeholder `driver://`; runtime override in `alembic/env.py` already supplies the real URL
- **Remove default DB URL from `app/config.py`** — `database_url` field no longer has a default value; startup fails with a clear pydantic validation error if `DATABASE_URL` env var is not set
- **Tighten CORS policy in `main.py`** — `allow_methods` changed from `["*"]` to explicit list `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`; `allow_headers` restricted to `["Content-Type", "Authorization", "X-Session-Token", "X-Edit-Token"]`
- **Add security response headers middleware** — all API responses now include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and `Content-Security-Policy: default-src 'none'`
- **Add request body size limit middleware** — requests with `Content-Length` exceeding 10 MB are rejected with HTTP 413 before reaching any route handler
- **Validate `contact_url` scheme in `JobCreate` and `JobUpdate`** — field now rejects any URL whose scheme is not `http` or `https`, preventing `javascript:` / `data:` XSS vectors
- **Restrict Next.js `remotePatterns` from wildcard** — `next.config.ts` previously allowed all hostnames (`hostname: '**'`) for both http and https; now restricted to `storage.googleapis.com` (https only)
- **Sanitize ReactMarkdown rendering** — `JobDetail.tsx` and `ProfileDetail.tsx` now pass an explicit `allowedElements` whitelist to `ReactMarkdown`, blocking all non-whitelisted HTML elements to prevent XSS via user-supplied markdown
- **Handle email send failures with HTTP 503** — all router callsites that previously ignored `send_*_email()` return values now check the result; a `False` return raises `HTTP_503_SERVICE_UNAVAILABLE` so callers are notified instead of silently succeeding (affected: `profiles.py`, `verification.py`, `auth.py`, `recruiters.py`)
- **Make Resend SDK call non-blocking** — `resend.Emails.send()` is a synchronous call; wrapped in `asyncio.to_thread()` in `email_service.py` so it no longer blocks the event loop during production email sends

### Fixed
- **Next.js logo image aspect-ratio warning** — added explicit `style={{ width: 'Xpx', height: 'Ypx' }}` inline styles to all three logo `<Image>` usages (Header, Footer, MobileNav); Tailwind preflight's `height: auto` was making computed height differ from the `height` attribute while width matched exactly, triggering the "one dimension modified" warning
- **Next.js smooth-scroll route transition warning** — added `data-scroll-behavior="smooth"` to the `<html>` element in `layout.tsx`

### Added
- **Profile owner view toggle** — profile owners now see their own sensitive data (email, phone, resume) when viewing their profile; a "Your view / Public view" toggle in the top-right lets them switch to see exactly what the public sees; backend returns `is_owner: bool` in `ProfileResponse` and includes sensitive fields when owner is detected
- **Homepage "Why we built this" summary** — added a concise story summary section above the "Simple by design" section on the homepage, linking to the full about page

### Fixed
- **Recruiter gate shown after login/verify** — when a recruiter verified a non-recruiter entity (job/profile), `verify/page.tsx` derived `userType` from `entity_type` (e.g. `'job'` → `undefined`), losing the recruiter identity; fixed by returning `user_type` from the backend `verify_code` service and using it directly in the frontend login call
- **ProfileForm email field** — email is now pre-seeded from the logged-in session and disabled (non-editable) when the user is authenticated, preventing profile creation under a different email
- **Double `getProfile` fetch on profile detail page** — `generateMetadata` and the page component each called `getProfile` independently; wrapped with React `cache()` to deduplicate the two calls into one within a single render cycle

### Changed
- **About page "Find your next opportunity" steps** — reordered: 01 = List yourself, 02 = Browse or search, 03 = Apply directly (was 01 Browse, 02 Apply, 03 List)
- **RSC prefetch reduction on profile detail page** — contextual links (city, skills, "Browse all") now use `prefetch={false}` to cut background RSC requests from ~15+ down to a handful on profile detail pages
- **`is_owner` on `ProfileResponse`** — backend profile detail endpoint now detects session email == profile email and sets `is_owner=True`, includes sensitive fields for the owner (without requiring active recruiter status)
- **`user_type` in `VerificationResponse`** — backend now includes `user_type` from the created auth session in the verification response, so the frontend can set the correct user type regardless of which entity type was verified

### Fixed
- **GCS signed URL 500 on Cloud Run** — `blob.generate_signed_url()` with `version="v4"` fails on Cloud Run because the default Compute Engine credentials have no private key to sign with; fixed by refreshing credentials and passing `service_account_email` + `access_token` to both `generate_signed_url` and `generate_signed_upload_url` in `storage_service.py` so GCS uses IAM-based signing instead; also granted `roles/iam.serviceAccountTokenCreator` to the API service account on itself (required for `signBlob` IAM calls to succeed) and documented in `PRODUCTION.md`
- **Sitemap 404** — removed `generateSitemaps` (multi-sitemap pattern) from `sitemap.ts` and replaced with a single `sitemap()` export; the multi-sitemap approach required a runtime index call that could 404 if the API was unreachable; single sitemap is served directly at `/sitemap.xml` with `revalidate = 3600` and API errors are silently skipped rather than failing the entire route


### Added
- **P0 analytics events** — implemented all core conversion events from `ANALYTICS.md` using Umami custom event tracking:
  - `src/lib/analytics.ts` — thin `trackEvent()` wrapper (no-ops gracefully if Umami is blocked)
  - `src/types/umami.d.ts` — `Window.umami` type declaration
  - `JobForm.tsx` — `job-form-start-{direct|recruiter}` (first focus), `job-form-submit-{direct|recruiter}` (with `employment_type`, `has_salary`, `skill_count`), `job-form-error` (with `field`)
  - `ProfileForm.tsx` — `profile-form-start`, `profile-form-submit` (with `has_resume`, `skill_count`, `experience_years`), `profile-form-error` (with `field`)
  - `recruiter/register/page.tsx` — `recruiter-register-start`, `recruiter-register-submit`
  - `verify/page.tsx` — `email-verify-success-{job|profile|recruiter}` (distinct names per entity type), `email-verify-fail` (with `reason`)
  - `ApplyButton.tsx` (new client component) — `job-apply-click` (with `method`); extracted from `JobDetail.tsx` to keep it a server component
  - `ProfileDetail.tsx` — `resume-download` on the download link
- **`ANALYTICS.md`** — comprehensive Umami analytics implementation plan covering custom event catalog (P0/P1/P2 priority tiers), 5 user funnels (talent, recruiter onboarding, job discovery, direct posting, profile discovery), conversion and engagement goals, event naming conventions, tracking utility design, privacy considerations, and Umami Cloud Hobby tier budget planning

### Changed
- **Funnel event naming** — split `job-form-start`, `job-form-submit`, and `email-verify-success` into per-variant event names (e.g. `job-form-submit-direct`, `email-verify-success-recruiter`) because Umami funnel steps match on event name only and do not support filtering by event data properties; updated `JobForm.tsx`, `verify/page.tsx`, and `ANALYTICS.md` accordingly

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
