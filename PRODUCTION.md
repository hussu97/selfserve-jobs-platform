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
export WEB_DOMAIN="yourdomain.com"
export RESEND_API_KEY="re_your_resend_api_key"
export REPO_NAME="selfserve-jobs"
export REGISTRY_LOCATION="${REGION}-docker.pkg.dev"
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

# Get the connection name (you'll need this for Cloud Run)
gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)'
# Output format: PROJECT_ID:REGION:DB_INSTANCE
export DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
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
```

## 6. Deploy the API (Cloud Run)

> **Note:** Steps 6a, 6b, and 6c must all be run together for a full deployment. Pushing an image to Artifact Registry (6a) does **not** automatically update Cloud Run — step 6c is what actually deploys it. The GitHub Actions `deploy-api.yml` workflow runs all three steps automatically on every push to `main`.

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

### 6b. Run Alembic migrations (before deploying new image)

```bash
gcloud run jobs create selfserve-jobs-migrate \
  --image "${REGISTRY_LOCATION}/${PROJECT_ID}/${REPO_NAME}/${API_SERVICE_NAME}:latest" \
  --region $REGION \
  --service-account $SA_EMAIL \
  --set-cloudsql-instances $DB_CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}" \
  --set-env-vars "RUN_MIGRATIONS=true" \
  --command "alembic" \
  --args "upgrade,head" \
  --max-retries=1

# Execute the migration job
gcloud run jobs execute selfserve-jobs-migrate --region $REGION --wait
```

### 6c. Deploy Cloud Run service

```bash
gcloud run deploy $API_SERVICE_NAME \
  --image "${REGISTRY_LOCATION}/${PROJECT_ID}/${REPO_NAME}/${API_SERVICE_NAME}:latest" \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --service-account $SA_EMAIL \
  --add-cloudsql-instances $DB_CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}" \
  --set-env-vars "GCS_BUCKET_NAME=${BUCKET_NAME}" \
  --set-env-vars "RESEND_API_KEY=${RESEND_API_KEY}" \
  --set-env-vars "FRONTEND_URL=https://${WEB_DOMAIN}" \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "RUN_MIGRATIONS=false" \
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
2. Go to **Domains** → **Add Domain** → enter your domain (e.g. `yourdomain.com`)
3. Add the DNS records shown (MX, TXT, DKIM) to your DNS provider
4. Wait for verification (usually a few minutes)
5. Go to **API Keys** → **Create API Key** → copy the key
6. Use this key as `RESEND_API_KEY` in your Cloud Run env vars

```bash
# Update the Cloud Run service with your Resend key
gcloud run services update $API_SERVICE_NAME \
  --region $REGION \
  --update-env-vars "RESEND_API_KEY=${RESEND_API_KEY}"
```

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
gcloud run domain-mappings create \
  --service $API_SERVICE_NAME \
  --domain api.${WEB_DOMAIN} \
  --region $REGION

# Get DNS records to configure
gcloud run domain-mappings describe \
  --domain api.${WEB_DOMAIN} \
  --region $REGION
```

Update the FRONTEND_URL in Cloud Run to use the custom domain:
```bash
gcloud run services update $API_SERVICE_NAME \
  --region $REGION \
  --update-env-vars "FRONTEND_URL=https://${WEB_DOMAIN}"
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
