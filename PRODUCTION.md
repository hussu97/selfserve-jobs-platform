# Production Setup Guide

Step-by-step instructions to deploy the selfserve-jobs-platform to production.

## 0. Set Your Variables

Run these once in your terminal session before executing any commands below. All subsequent commands use these variables.

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="me-central1"
export DB_INSTANCE="selfserve-jobs-db"
export DB_NAME="selfserve_jobs"
export DB_USER="selfserve_jobs_api"
export DB_PASSWORD="your-secure-db-password"
export BUCKET_NAME="selfserve-jobs-resumes"
export API_SERVICE_NAME="selfserve-jobs-customer-api"
export FRONTEND_URL="https://yourdomain.com"
export RESEND_API_KEY="re_your_resend_api_key"
export RESEND_FROM_EMAIL="hirebridge <noreply@hirebridgeuae.com>"
export REPO_NAME="selfserve-jobs-platform"
export REGISTRY_LOCATION="${REGION}-docker.pkg.dev"
export DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
```

## 1. GCP Project Setup

```bash
# Create and configure project (skip if project already exists)
gcloud projects create $PROJECT_ID --name="selfserve-jobs"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com

# Set default region
gcloud config set run/region $REGION
```

## 2. Artifact Registry (Docker images)

```bash
# Create repository for Docker images
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="selfserve-jobs Docker images"

# Verify
gcloud artifacts repositories list --location=$REGION
```

## 3. CloudSQL PostgreSQL Database

```bash
# Create PostgreSQL 16 instance (~5-10 minutes)
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04

# Create database
gcloud sql databases create $DB_NAME \
  --instance=$DB_INSTANCE

# Create application user
gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE \
  --password=$DB_PASSWORD

# Verify the connection name matches your DB_CONNECTION_NAME variable
gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)'
# Should output: PROJECT_ID:REGION:DB_INSTANCE (same as $DB_CONNECTION_NAME set in step 0)
```

## 4. GCS Bucket (Resume Storage)

```bash
# Create bucket
gcloud storage buckets create gs://$BUCKET_NAME \
  --location=$REGION \
  --uniform-bucket-level-access

# Set CORS policy (allows browser uploads)
cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=/tmp/cors.json

# Set lifecycle rule to delete files after 365 days (optional cost management)
cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 365}
    }
  ]
}
EOF
gcloud storage buckets update gs://$BUCKET_NAME --lifecycle-file=/tmp/lifecycle.json
```

## 5. Service Account for Cloud Run

```bash
# Create service account for the API
gcloud iam service-accounts create $API_SERVICE_NAME \
  --display-name="selfserve-jobs Customer API"

export SA_EMAIL="${API_SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Cloud SQL access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client"

# Grant GCS access
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

# Grant Artifact Registry access (required for GitHub Actions to push Docker images)
gcloud artifacts repositories add-iam-policy-binding $REPO_NAME \
  --location=$REGION \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Grant Cloud Run access (required for GitHub Actions to deploy/update the service)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.developer"

# Grant actAs on itself (required for GitHub Actions to deploy Cloud Run with this SA attached)
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Grant Token Creator on itself (required for GCS v4 signed URLs on Cloud Run)
# Cloud Run credentials have no private key; signBlob via IAM is used instead.
# Without this role, generate_signed_url() returns 403 → 500.
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

## 6. Deploy the API (Cloud Run)

> **Note:** Steps 6a and 6b are for the **initial / manual deploy only**. After this, the GitHub Actions `deploy-api.yml` workflow handles both steps automatically on every push to `main`. Pushing an image to Artifact Registry alone does **not** trigger Cloud Run — step 6b is what actually deploys it. Alembic migrations run automatically on app startup.

### 6a. Build and push Docker image

```bash
# Authenticate Docker to Artifact Registry (one-time setup per machine)
gcloud auth configure-docker ${REGISTRY_LOCATION}

# From repo root — build for linux/amd64 (required by Cloud Run, even on Apple Silicon)
docker build --platform linux/amd64 \
  -t "${REGISTRY_LOCATION}/${PROJECT_ID}/${REPO_NAME}/${API_SERVICE_NAME}:latest" \
  selfserve-jobs-customer-api/

# Push to Artifact Registry
docker push "${REGISTRY_LOCATION}/${PROJECT_ID}/${REPO_NAME}/${API_SERVICE_NAME}:latest"
```

Or use Cloud Build (no local Docker or auth setup needed):
```bash
gcloud builds submit selfserve-jobs-customer-api/ \
  --tag "${REGISTRY_LOCATION}/${PROJECT_ID}/${REPO_NAME}/${API_SERVICE_NAME}:latest"
```

### 6b. Deploy Cloud Run service

```bash
gcloud run deploy $API_SERVICE_NAME \
  --image "${REGISTRY_LOCATION}/${PROJECT_ID}/${REPO_NAME}/${API_SERVICE_NAME}:latest" \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --service-account $SA_EMAIL \
  --add-cloudsql-instances=$DB_CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}" \
  --set-env-vars "GCS_BUCKET_NAME=${BUCKET_NAME}" \
  --set-env-vars "RESEND_API_KEY=${RESEND_API_KEY}" \
  --set-env-vars "RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL}" \
  --set-env-vars "FRONTEND_URL=${FRONTEND_URL}" \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "ADMIN_EMAILS=${ADMIN_EMAILS}" \
  --set-env-vars "ADMIN_NOTIFICATION_EMAIL=${ADMIN_NOTIFICATION_EMAIL}" \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1

# Get the API URL
export API_URL=$(gcloud run services describe $API_SERVICE_NAME --region $REGION --format='value(status.url)')
echo "API URL: $API_URL"
```

## 7. Resend Email Setup

1. Create account at https://resend.com
2. Go to **Domains** → **Add Domain** → enter your sending domain (e.g. `hirebridgeuae.com`)
3. Add the DNS records shown (SPF, DKIM, DMARC) to your DNS provider
4. Wait for domain verification (usually a few minutes)
5. Go to **API Keys** → **Create API Key** → copy the key
6. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Cloud Run — the `from` address must use your verified domain

```bash
# Update the Cloud Run service with your Resend credentials
gcloud run services update $API_SERVICE_NAME \
  --region $REGION \
  --update-env-vars "RESEND_API_KEY=${RESEND_API_KEY}" \
  --update-env-vars "RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL}"
```

> **Note:** `RESEND_FROM_EMAIL` must match a domain you have verified in Resend (e.g. `hirebridge <noreply@hirebridgeuae.com>`). Emails will silently fail if the sending domain is unverified.

## 8. Deploy the Web App (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Click **Import Git Repository** → connect your GitHub account if not already connected → select `selfserve-jobs-platform`
3. Under **Configure Project**:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `selfserve-jobs-customer-web`
   - Leave build/output settings as defaults
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = the Cloud Run URL from step 6 (e.g. `https://selfserve-jobs-customer-api-xxxx-uc.a.run.app`)
5. Click **Deploy**

From now on, every push to `main` that touches `selfserve-jobs-customer-web/` will trigger an automatic Vercel deployment (in addition to your GitHub Actions workflow).

## 9. Custom Domain

### For the web app (Vercel):
1. Vercel Dashboard → your project → **Settings** → **Domains**
2. Add `yourdomain.com` and `www.yourdomain.com`
3. Follow the DNS configuration instructions shown

### For the API (Cloud Run custom domain, optional):
```bash
# Note: --region requires the beta track
gcloud beta run domain-mappings create \
  --service $API_SERVICE_NAME \
  --domain api.${FRONTEND_URL#https://} \
  --region $REGION

# Get DNS records to configure
gcloud beta run domain-mappings describe \
  --domain api.${FRONTEND_URL#https://} \
  --region $REGION
```

Update the FRONTEND_URL in Cloud Run to use the custom domain:
```bash
gcloud run services update $API_SERVICE_NAME \
  --region $REGION \
  --update-env-vars "FRONTEND_URL=${FRONTEND_URL}"
```

## 10. GitHub Actions Secrets

Configure these secrets in your GitHub repo (**Settings → Secrets and variables → Actions**). The API deploy workflow (`deploy-api.yml`) passes runtime config to Cloud Run on every deploy — without these, the container fails to start because `DATABASE_URL` is a required Pydantic setting (no default).

### Core GCP auth

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_REGION` | e.g. `me-central1` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | See Workload Identity setup below |
| `GCP_SERVICE_ACCOUNT` | `${API_SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com` |
| `VERCEL_TOKEN` | From vercel.com → Account Settings → Tokens |

### API runtime config (Cloud Run env vars)

| Secret | Value | Notes |
|--------|-------|-------|
| `GCP_CLOUDSQL_INSTANCE` | `$DB_CONNECTION_NAME` — `PROJECT_ID:REGION:DB_INSTANCE` | Passed to `--add-cloudsql-instances`; attaches the Unix socket at `/cloudsql/$GCP_CLOUDSQL_INSTANCE` |
| `GCP_DATABASE_URL` | `postgresql+asyncpg://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$DB_CONNECTION_NAME` | Full async DSN; the `host=` query arg routes through the Cloud SQL socket |
| `GCS_BUCKET_NAME` | `$BUCKET_NAME` from step 0 | Bucket for resume uploads |
| `RESEND_API_KEY` | `re_...` | Resend API key (see step 7) |
| `RESEND_FROM_EMAIL` | e.g. `hirebridge <noreply@hirebridgeuae.com>` | Must match a verified Resend domain |
| `FRONTEND_URL` | e.g. `https://hirebridgeuae.com` | Used for CORS allow-list and links in outgoing emails |
| `INTERNAL_API_SECRET` | Long random string | Shared secret for `POST /api/v1/internal/*` cron endpoints (`X-Internal-Secret` header) |
| `SENTRY_DSN` | (optional) `https://...@sentry.io/...` | Enables Sentry error tracking when set |
| `ADMIN_EMAILS` | (optional) comma-separated list e.g. `admin@example.com,ops@example.com` | Comma-separated list of admin email addresses used for access control |
| `ADMIN_NOTIFICATION_EMAIL` | (optional) e.g. `admin@example.com` | Destination address for report/flag notification emails |

> **Note:** The workflow also hard-codes `ENVIRONMENT=production` and `LOG_FORMAT=json` on every deploy. `ENVIRONMENT` controls dev/prod behaviour in `config.py`; `LOG_FORMAT=json` switches to structured JSON logging for Cloud Logging.

### Workload Identity Federation (keyless auth for GitHub Actions)

```bash
# Set your GitHub repo (org/repo or username/repo)
export GITHUB_REPO="YOUR_GITHUB_ORG/YOUR_REPO"

# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create OIDC provider
# --attribute-condition restricts access to your specific repo only (required by GCP)
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get pool resource name
export POOL_ID=$(gcloud iam workload-identity-pools describe "github-pool" \
  --location="global" \
  --format="value(name)")

# Allow GitHub Actions from your repo to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_REPO}"

# Get the provider resource name for the GitHub secret
gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
# This is your GCP_WORKLOAD_IDENTITY_PROVIDER secret value
```

## 11. Verification Checklist

After completing setup, verify everything works:

- [ ] `curl $API_URL/api/v1/health` returns `{"status": "ok"}`
- [ ] `curl $API_URL/` returns `{"service": "selfserve-jobs-customer-api", ...}`
- [ ] Web app loads at your Vercel URL / custom domain
- [ ] Create a test job listing — check email arrives with verification link
- [ ] Click verification link — job becomes active and visible in browse
- [ ] Upload a resume PDF — check it appears in GCS bucket
- [ ] Submit a report — check it creates a report record
- [ ] GitHub Actions workflows appear in GitHub → Actions tab
- [ ] Push a change to `selfserve-jobs-customer-api/` — CI runs automatically

## 12. Umami Analytics

Umami Cloud is integrated with adblock bypass via a proxy rewrite. The proxy is already configured in `selfserve-jobs-customer-web/next.config.ts` — requests to `/stats/script.js` and `/stats/api/send` are transparently forwarded to Umami Cloud, so adblockers have no known pattern to block.

### Setup steps

1. Create an account at [cloud.umami.is](https://cloud.umami.is)
2. Add your website: **Settings → Websites → Add Website** → enter your domain
3. Copy the **Website ID** shown after creation

### Vercel environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Website ID from Umami Cloud (e.g. `abc123-...`) |
| `NEXT_PUBLIC_SITE_URL` | Your production domain, no trailing slash (e.g. `https://yourdomain.com`) |

`NEXT_PUBLIC_SITE_URL` is used as `data-host-url` so Umami sends tracking events through your domain's `/stats/api/send` proxy instead of directly to `cloud.umami.is`.

### Verification

After deploying:
1. Visit your site — Umami Cloud dashboard should show a live pageview within ~30 seconds
2. Test adblock bypass: enable uBlock Origin, reload the page — the pageview should still register
3. Confirm in browser DevTools → Network: tracking requests go to `yourdomain.com/stats/api/send`, not `cloud.umami.is`

### Local development

The analytics script only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set. Leave it unset locally to skip analytics entirely.

---

## 13. Troubleshooting

Common failure modes and how to resolve them.

### Migration errors on startup

**Symptom:** Cloud Run container starts, then immediately crashes with `alembic.util.exc.CommandError` or `sqlalchemy.exc.OperationalError` in logs.

**Causes & fixes:**

| Symptom detail | Fix |
|---|---|
| `can't connect to postgres` | Verify `DATABASE_URL` env var in Cloud Run includes `?host=/cloudsql/<connection-name>`. Check `--add-cloudsql-instances` flag matches `DB_CONNECTION_NAME`. |
| `relation already exists` | A previous partial migration left the DB in an inconsistent state. Connect via Cloud SQL proxy, run `SELECT * FROM alembic_version;`, manually set to the last clean revision, then restart. |
| `column ... of relation ... already exists` | Same cause — partial migration. Drop the partially-created column manually, then restart. |
| `permission denied for table alembic_version` | DB user lacks DDL privileges. Grant: `ALTER USER selfserve_jobs_api CREATEDB;` or `GRANT ALL ON SCHEMA public TO selfserve_jobs_api;` |

**Connect to DB via Cloud SQL Auth Proxy (for manual fixes):**
```bash
# Install proxy if needed
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy in background
./cloud-sql-proxy $DB_CONNECTION_NAME &

# Connect with psql
psql "host=127.0.0.1 port=5432 dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD"
```

---

### GCS auth failures

**Symptom:** Resume upload returns 500 or 403. Logs show `google.auth.exceptions.TransportError` or `403 Forbidden` from `storage.googleapis.com`.

**Causes & fixes:**

| Symptom detail | Fix |
|---|---|
| `iam.serviceAccountTokenCreator` missing | The service account needs `roles/iam.serviceAccountTokenCreator` on itself for signed URL generation. Re-run step 5 of this guide. |
| `The caller does not have permission` on bucket | Re-grant `roles/storage.objectAdmin` on the bucket to the service account (see step 5). |
| CORS errors in browser | Update the bucket CORS policy (see step 4). Ensure `FRONTEND_URL` env var exactly matches the origin (no trailing slash). |
| `GCS_BUCKET_NAME` not set | Verify the env var is set in the Cloud Run service configuration. |

**Verify IAM:**
```bash
# Check service account roles
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SA_EMAIL" \
  --format="table(bindings.role)"
```

---

### Resend outages

**Symptom:** Verification/transactional emails not delivered. Logs show `Failed to send ... email` warnings after all retry attempts. The in-memory circuit breaker opens after 5 consecutive failures and stays open for 2 minutes.

**Diagnosis:**
```bash
# Check recent email log (connect to DB first)
SELECT email_type, success, error_message, created_at
FROM email_log
ORDER BY created_at DESC
LIMIT 20;
```

**Causes & fixes:**

| Symptom detail | Fix |
|---|---|
| `422 Unprocessable Entity` from Resend | `RESEND_FROM_EMAIL` domain is not verified in Resend. Verify the domain at resend.com/domains. |
| `401 Unauthorized` | `RESEND_API_KEY` is invalid or rotated. Update the env var in Cloud Run. |
| `429 Too Many Requests` | Resend rate limit hit. Reduce send volume or upgrade Resend plan. |
| Status page incident | Check [status.resend.com](https://status.resend.com). The circuit breaker will auto-reset after 2 minutes of no failures; no action needed once Resend recovers. |

**Manually resend a verification email (if user never received it):**
```bash
# Use the resend endpoint (max 3/entity/day enforced)
curl -X POST https://your-api-url/api/v1/verify/resend \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"job","email":"user@example.com","entity_code":"abc123"}'
```

---

### CloudSQL connection limits

**Symptom:** API returns 500 errors under load. Logs show `remaining connection slots are reserved` or `too many connections` from PostgreSQL.

**Causes & fixes:**

| Symptom detail | Fix |
|---|---|
| Single Cloud Run instance exceeding pool | Reduce `pool_size` in `database.py` (currently 10) or scale down `max_overflow` (currently 20). |
| Multiple Cloud Run instances | Each instance has its own pool. With 10 instances × 10 pool_size = 100 connections. `db-f1-micro` supports ~25 connections. Upgrade instance tier or reduce pool. |
| `FATAL: password authentication failed` | DB password changed. Update `DATABASE_URL` env var in Cloud Run. |

**Check current connection count:**
```sql
-- Run via Cloud SQL proxy
SELECT count(*) FROM pg_stat_activity WHERE datname = 'selfserve_jobs';

-- Show max connections allowed
SHOW max_connections;
```

**Scale Cloud Run max instances (short-term fix):**
```bash
gcloud run services update $API_SERVICE_NAME \
  --region $REGION \
  --max-instances=3
```

**Upgrade database instance tier (longer-term fix):**
```bash
# db-g1-small supports ~100 connections
gcloud sql instances patch $DB_INSTANCE \
  --tier=db-g1-small \
  --region=$REGION
```

---

### Slow or failed health checks

**Symptom:** Load balancer marks instances unhealthy. `GET /api/v1/health` returns 503 intermittently.

The health endpoint runs `SELECT 1` against the DB. If the DB is unreachable, it returns `{"status":"degraded","db":"unreachable"}` with a 503 status code.

**Diagnosis:**
```bash
curl https://your-api-url/api/v1/health
# Should return: {"status":"ok","db":"ok"}
```

If degraded: check CloudSQL instance status in GCP Console → SQL → your instance. Check Cloud Run logs for connection errors.

---

### Internal cron endpoints not firing

**Symptom:** Listings are not expiring or expiry warning emails are not being sent.

The cron endpoints (`POST /api/v1/internal/expire-listings`, `POST /api/v1/internal/cleanup`) are protected by `X-Internal-Secret` header matching the `INTERNAL_API_SECRET` env var.

**Verify secret is set:**
```bash
gcloud run services describe $API_SERVICE_NAME \
  --region $REGION \
  --format="value(spec.template.spec.containers[0].env[].value)"
```

**Test manually:**
```bash
curl -X POST https://your-api-url/api/v1/internal/expire-listings \
  -H "X-Internal-Secret: your-internal-secret"
```
