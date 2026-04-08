# selfserve-jobs-platform

A free, no-signup jobs platform where companies post job listings and candidates post profiles. Email verification prevents fraud. No accounts, no paywalls.

## System Architecture

```
Browser
  ↓
selfserve-jobs-customer-web (Next.js 15 — Vercel)
  ↓ REST API
selfserve-jobs-customer-api (FastAPI — Google Cloud Run)
  ↓                    ↓                    ↓
PostgreSQL          GCS Bucket          Resend Email
(CloudSQL)      (resume PDFs)       (verification emails)
```

## Data Architecture

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `job` | Company job listings | `job_code` (12-char nanoid), `edit_token`, `status`, `key_skills` (JSONB) |
| `profile` | Candidate profiles | `profile_code`, `edit_token`, `status`, `key_skills` (JSONB) |
| `email_verification` | Pending email verifications | `verification_code` (64-char), `expires_at` |
| `report` | User-submitted reports | `report_code`, `entity_type`, `entity_code` |

**Conventions:**
- No foreign key constraints — referential integrity enforced in service layer
- Public identifiers: nanoid 12-char codes (never expose integer PKs)
- Status values: `pending_verification` → `active` → `expired` / `removed` / `under_review`
- JSONB for arrays (skills, etc.) rather than junction tables

## Project Structure

```
selfserve-jobs-platform/
├── selfserve-jobs-customer-api/   # FastAPI backend
│   ├── app/
│   │   ├── routers/               # HTTP route handlers
│   │   ├── services/              # Business logic
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   └── utils/                 # Helpers (countries, skills)
│   ├── alembic/                   # DB migrations
│   └── tests/                     # pytest test suite
├── selfserve-jobs-customer-web/   # Next.js 15 frontend
│   └── src/
│       ├── app/                   # App Router pages
│       ├── components/            # React components
│       ├── lib/                   # API client, types, utils
│       └── hooks/                 # Custom React hooks
├── .github/workflows/             # CI/CD pipelines
└── docker-compose.yml             # Local development
```

## Local Development

### Prerequisites
- Docker + Docker Compose
- Node.js 22+
- Python 3.12+

### Start the API + Database
```bash
docker compose up
```
This starts PostgreSQL on port 5432 and the API on port 8080 with hot-reload.

### Start the web app
```bash
cd selfserve-jobs-customer-web
npm install
npm run dev
```
Open http://localhost:3000

### Run tests

**API tests:**
```bash
cd selfserve-jobs-customer-api
pip install -e ".[dev]"
python -m pytest tests/ -v
```

**Web tests:**
```bash
cd selfserve-jobs-customer-web
npm test
```

## Deployment

See [PRODUCTION.md](./PRODUCTION.md) for full step-by-step production setup.

| Component | Platform | Directory |
|-----------|----------|-----------|
| Web app | Vercel | `selfserve-jobs-customer-web/` |
| API | Google Cloud Run | `selfserve-jobs-customer-api/` |
| Database | Google CloudSQL (PostgreSQL 16) | — |
| File storage | Google Cloud Storage | — |
| Email | Resend | — |

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `test-api.yml` | Push/PR touching `selfserve-jobs-customer-api/` | Lint (ruff) + pytest |
| `test-web.yml` | Push/PR touching `selfserve-jobs-customer-web/` | ESLint + typecheck + vitest |
| `deploy-api.yml` | Push to `main` touching API files | Runs tests, then deploys to Cloud Run |
| `deploy-web.yml` | Push to `main` touching web files | Runs tests, then deploys to Vercel |

## Pre-commit Hooks

Husky runs automatically on `git commit`:
- **Python files staged:** ruff lint + format check + pytest
- **TypeScript files staged:** ESLint + vitest
