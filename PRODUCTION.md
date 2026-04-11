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

Configure these secrets in your GitHub repo (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_REGION` | e.g. `me-central1` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | See Workload Identity setup below |
| `GCP_SERVICE_ACCOUNT` | `${API_SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com` |
| `VERCEL_TOKEN` | From vercel.com → Account Settings → Tokens |

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
