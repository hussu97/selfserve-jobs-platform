# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
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
