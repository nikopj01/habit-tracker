# Habit Tracker Full Deployment Guideline (Backend + Frontend)

This guide is the tested flow for deploying this repository to Google Cloud Run in:

- Project: `habit-tracker-486806`
- Region: `us-central1`

## 1. Prerequisites

- Google Cloud project with billing enabled.
- `gcloud` CLI installed and authenticated.
- Docker available locally (optional for local container tests).
- Required APIs enabled:
  - `run.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `secretmanager.googleapis.com`

One-time setup:

```powershell
gcloud auth login
gcloud config set project habit-tracker-486806
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 2. Repository Components Used for Cloud Run

- Backend container:
  - `backend/Dockerfile`
  - `backend/.dockerignore`
- Frontend container:
  - `frontend/Dockerfile`
  - `frontend/nginx.conf`
  - `frontend/.dockerignore`
  - `frontend/cloudbuild.yaml`

## 3. Backend Configuration Model

Backend reads configuration from Cloud Run env vars/secrets:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_SSL_MODE`
- `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`
- `Cors__AllowedOrigins`
- `APPLY_MIGRATIONS_ON_STARTUP` (recommended `false` in steady state)
- `USE_HTTPS_REDIRECTION` (recommended `false` on Cloud Run)

Health endpoint to use in production:

- `GET /api/health`

## 4. Local Testing

### 4.1 Backend (dotnet run)

If needed:

```powershell
cd backend/src/HabitTracker.API
```

Then:

```powershell
$env:DB_HOST='YOUR_DB_HOST'
$env:DB_PORT='5432'
$env:DB_NAME='habit-tracker'
$env:DB_USER='postgres'
$env:DB_PASSWORD='YOUR_DB_PASSWORD'
$env:DB_SSL_MODE='Require'
$env:Jwt__Secret='YOUR_LONG_RANDOM_SECRET'
$env:Jwt__Issuer='HabitTracker'
$env:Jwt__Audience='HabitTrackerClient'
$env:Cors__AllowedOrigins='http://localhost:5173'
$env:APPLY_MIGRATIONS_ON_STARTUP='false'
$env:USE_HTTPS_REDIRECTION='false'
dotnet run
```

Health check:

```powershell
curl.exe -i http://localhost:5160/api/health
```

### 4.2 Frontend (Vite local)

```powershell
cd frontend
$env:VITE_API_URL='http://localhost:5160/api'
npm ci
npm run dev
```

## 5. Create Artifact Registry Repository (One Time)

```powershell
$PROJECT_ID='habit-tracker-486806'
$REGION='us-central1'
$REPO='habit-tracker'

gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION `
  --description='Habit Tracker containers'
```

## 6. Create / Rotate Secrets (PowerShell-Safe)

Do not use unescaped inline passwords with special characters. Use temp files with `-NoNewline`.

Create or rotate DB password:

```powershell
Set-Content -Path .db_password.tmp -Value 'YOUR_EXACT_DB_PASSWORD' -NoNewline
gcloud secrets create habittracker-db-password --data-file=.db_password.tmp 2>$null
gcloud secrets versions add habittracker-db-password --data-file=.db_password.tmp
Remove-Item .db_password.tmp -Force
```

Create or rotate JWT secret:

```powershell
Set-Content -Path .jwt_secret.tmp -Value 'YOUR_EXACT_JWT_SECRET' -NoNewline
gcloud secrets create habittracker-jwt-secret --data-file=.jwt_secret.tmp 2>$null
gcloud secrets versions add habittracker-jwt-secret --data-file=.jwt_secret.tmp
Remove-Item .jwt_secret.tmp -Force
```

Grant Cloud Run runtime access:

```powershell
$PROJECT_NUMBER=(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding habittracker-db-password `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role='roles/secretmanager.secretAccessor'

gcloud secrets add-iam-policy-binding habittracker-jwt-secret `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role='roles/secretmanager.secretAccessor'
```

## 7. Deploy Backend (Cloud Run)

Build and push backend image with unique tag:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-api:$TAG"
gcloud builds submit ./backend --tag $BACKEND_IMAGE
```

Deploy backend:

```powershell
gcloud run deploy habit-tracker-api `
  --image $BACKEND_IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --set-env-vars "DB_HOST=34.84.229.88,DB_PORT=5432,DB_NAME=habit-tracker,DB_USER=postgres,DB_SSL_MODE=Require,Jwt__Issuer=HabitTracker,Jwt__Audience=HabitTrackerClient,Cors__AllowedOrigins=https://YOUR_FRONTEND_DOMAIN,APPLY_MIGRATIONS_ON_STARTUP=false,USE_HTTPS_REDIRECTION=false" `
  --set-secrets "DB_PASSWORD=habittracker-db-password:latest,Jwt__Secret=habittracker-jwt-secret:latest"
```

Important:

- `--set-secrets` format must be `ENV_NAME=SECRET_NAME:VERSION`.
- Correct: `DB_PASSWORD=habittracker-db-password:latest`
- Incorrect: raw password on left side.

Get backend URL:

```powershell
$BACKEND_URL=(gcloud run services describe habit-tracker-api --region $REGION --format='value(status.url)')
```

Verify backend:

```powershell
curl.exe -i "$BACKEND_URL/api/health"
```

## 8. Deploy Frontend (Cloud Run)

Build and push frontend image with API URL baked in:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-web:$TAG"

gcloud builds submit ./frontend `
  --config frontend/cloudbuild.yaml `
  --substitutions "_IMAGE=$FRONTEND_IMAGE,_VITE_API_URL=$BACKEND_URL/api"
```

Deploy frontend:

```powershell
gcloud run deploy habit-tracker-web `
  --image $FRONTEND_IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080
```

Get frontend URL:

```powershell
$FRONTEND_URL=(gcloud run services describe habit-tracker-web --region $REGION --format='value(status.url)')
```

Update backend CORS to real frontend URL:

```powershell
gcloud run services update habit-tracker-api `
  --region $REGION `
  --update-env-vars "Cors__AllowedOrigins=$FRONTEND_URL"
```

If you want to allow both Cloud Run URL formats (project-number URL + `a.run.app` URL):

```powershell
gcloud run services update habit-tracker-api `
  --region $REGION `
  --update-env-vars "^@@^Cors__AllowedOrigins=https://habit-tracker-web-609538407050.us-central1.run.app,https://habit-tracker-web-5luiv66eta-uc.a.run.app"
```

## 9. Integration Verification (Must Pass)

Frontend is reachable:

```powershell
curl.exe -i "$FRONTEND_URL/"
```

Backend health is reachable:

```powershell
curl.exe -i "$BACKEND_URL/api/health"
```

CORS preflight from frontend to backend:

```powershell
curl.exe -i -X OPTIONS "$BACKEND_URL/api/auth/login" `
  -H "Origin: $FRONTEND_URL" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

Expected: `204 No Content` and `access-control-allow-origin: $FRONTEND_URL`.

Basic auth API validation:

```powershell
curl.exe -i -X POST "$BACKEND_URL/api/auth/login" `
  -H "Origin: $FRONTEND_URL" `
  -H "Content-Type: application/json" `
  -d "{}"
```

Expected: `400` validation response (this confirms endpoint is alive and request reaches API).

## 10. Update in the Future

Backend:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-api:$TAG"
gcloud builds submit ./backend --tag $BACKEND_IMAGE
gcloud run deploy habit-tracker-api --image $BACKEND_IMAGE --region $REGION
```

Frontend:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-web:$TAG"
gcloud builds submit ./frontend `
  --config frontend/cloudbuild.yaml `
  --substitutions "_IMAGE=$FRONTEND_IMAGE,_VITE_API_URL=$BACKEND_URL/api"
gcloud run deploy habit-tracker-web --image $FRONTEND_IMAGE --region $REGION
```

If frontend URL changed, update backend CORS again:

```powershell
gcloud run services update habit-tracker-api --region $REGION --update-env-vars "Cors__AllowedOrigins=$FRONTEND_URL"
```

## 11. GitHub Actions Auto-Deploy (Push to `main`)

Workflow file:

- `.github/workflows/deploy-cloud-run.yml`

Trigger:

- Push to `main`
- Manual run (`workflow_dispatch`)

Required GitHub secrets:

- `GCP_WIF_PROVIDER`
  - Value: `projects/609538407050/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `GCP_SERVICE_ACCOUNT`
  - Value: `github-actions-deployer@habit-tracker-486806.iam.gserviceaccount.com`

No JSON service-account key is required.

Configured OIDC provider:

- `projects/609538407050/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- Service account:
  - `github-actions-deployer@habit-tracker-486806.iam.gserviceaccount.com`

Service account roles required:

- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/cloudbuild.builds.editor`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.secretAccessor`
- `roles/serviceusage.serviceUsageConsumer`
- `roles/storage.objectAdmin`

What the workflow does:

1. Builds and deploys backend to Cloud Run.
2. Reads backend URL and builds frontend with `VITE_API_URL=<backend>/api`.
3. Deploys frontend to Cloud Run.
4. Updates backend CORS with frontend URL(s).
5. Runs smoke checks (`/api/health`, frontend `/`, CORS preflight, login validation 400).

Fallback option (not recommended): JSON key auth can be used only if your org policy allows service account key creation.

## 12. Troubleshooting (Issues Encountered and Fixes)

1. `curl` in PowerShell fails with missing `Uri`
- Cause: PowerShell alias maps `curl` to `Invoke-WebRequest`.
- Fix: use `curl.exe`.

2. Special characters in passwords break commands (`&`, `|`, `$`)
- Cause: shell parsing.
- Fix: use single quotes for inline values or write secret values to temp files with `-NoNewline`.

3. Cloud Run deploy fails with container not listening on `PORT=8080`
- Cause seen: startup crash from DB auth/migration.
- Fix: set `APPLY_MIGRATIONS_ON_STARTUP=false`, verify DB secret value, redeploy revision.

4. Secret mapping syntax mistake
- Wrong: raw password on left side of `--set-secrets`.
- Correct: `DB_PASSWORD=habittracker-db-password:latest`.

5. `/healthz` returns 404
- In this deployment, reliable probe endpoint is `/api/health`.
- Use `https://<backend-url>/api/health`.

6. Frontend can call API but browser blocks with CORS
- Cause seen: backend origin precedence bug (array from `appsettings.json` taking priority over env scalar).
- Fix applied in `backend/src/HabitTracker.API/Program.cs`: `Cors:AllowedOrigins` scalar is now checked before section array.
- After fix: redeploy backend and verify preflight headers.

7. DB auth (`28P01`) after deployment
- Cause seen: incorrect secret value version.
- Fix: rotate `habittracker-db-password` with exact value, then deploy a new backend revision.

## 13. Current Working Service URLs

- Backend (project-number URL): `https://habit-tracker-api-609538407050.us-central1.run.app`
- Backend (canonical URL): `https://habit-tracker-api-5luiv66eta-uc.a.run.app`
- Frontend (project-number URL): `https://habit-tracker-web-609538407050.us-central1.run.app`
- Frontend (canonical URL): `https://habit-tracker-web-5luiv66eta-uc.a.run.app`

Primary health check:

- `https://habit-tracker-api-609538407050.us-central1.run.app/api/health`
