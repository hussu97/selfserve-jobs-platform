# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Homepage, jobs listing, and profiles listing pages updated to "Sage & Stone" design system: Newsreader serif + Manrope body fonts, forest green primary (`#384B3B`), terracotta secondary (`#8C4E32`), `bg-bg`/`bg-surface`/`bg-surface-lowest` tonal shifts replacing border dividers, `rounded-full` pill CTAs, `shadow-ambient` cards, `hero-gradient` page headers, bento-style numbered How-it-Works steps, section eyebrow labels, and a solid `bg-primary` CTA strip
- Typography: replaced Inter + Lora with Outfit (body) + Instrument Serif (headings) for a more modern, distinctive feel
- Center-aligned hero section, section headers, and CTA strip on the home page for better visual balance and mobile readability
- Full frontend visual redesign: modern 2026 aesthetic with depth, motion, and proper mobile-first layout
- Hero section: center-aligned layout, gradient mesh background, eyebrow label, animated entrance, stats as inline elements with color dots
- How it Works: removed generic boxed layout; now uses large muted step numbers as decorative accents with icon blocks, mobile-stacked with dividers
- Section headers: center-aligned with "View all" CTA below subtitle on desktop; mobile gets its own row below the grid
- Job and Profile cards: top gradient accent bar (terracotta/sage), footer row with divider line, cleaner typographic hierarchy, softer shadow + stronger hover
- Card base: updated shadow from `shadow-sm` to a more refined multi-property shadow
- Header: active nav state uses a small underline indicator instead of filled pill background; refined button styles; slightly smaller height
- Footer: multi-column structured layout with labelled nav groups replacing single horizontal row
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
