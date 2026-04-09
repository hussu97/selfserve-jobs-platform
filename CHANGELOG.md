# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
