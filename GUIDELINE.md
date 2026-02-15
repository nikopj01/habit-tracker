# Habit Tracker Full Deployment Guideline (Backend + Frontend)

This guide is the tested flow for deploying this repository to Google Cloud Run in:

- Project: `habit-tracker-486806`
- Region: `asia-northeast1`

## Quick Start (10-minute version)

Note:
- Use this when you want the fastest path to deploy.
- It assumes your DB/JWT secrets already exist in Secret Manager.

1. Set context and variables:

```powershell
gcloud auth login
gcloud config set project habit-tracker-486806
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

$PROJECT_ID='habit-tracker-486806'
$REGION='asia-northeast1'
$REPO='habit-tracker'
```

2. Build and push backend image:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-api:$TAG"
gcloud auth configure-docker "$REGION-docker.pkg.dev"
docker build -t $BACKEND_IMAGE ./backend
docker push $BACKEND_IMAGE
```

3. Deploy backend:

```powershell
gcloud run deploy habit-tracker-api `
  --image $BACKEND_IMAGE `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --min-instances 1 `
  --concurrency 20 `
  --set-env-vars "DB_HOST=34.84.229.88,DB_PORT=5432,DB_NAME=habit-tracker,DB_USER=postgres,DB_SSL_MODE=Require,Jwt__Issuer=HabitTracker,Jwt__Audience=HabitTrackerClient,APPLY_MIGRATIONS_ON_STARTUP=false,USE_HTTPS_REDIRECTION=false" `
  --set-secrets "DB_PASSWORD=habittracker-db-password:latest,Jwt__Secret=habittracker-jwt-secret:latest"

$BACKEND_URL=(gcloud run services describe habit-tracker-api --region $REGION --format='value(status.url)')
curl.exe -i "$BACKEND_URL/api/health"
```

4. Build and push frontend image (wired to backend):

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-web:$TAG"
docker build --build-arg VITE_API_URL="$BACKEND_URL/api" -t $FRONTEND_IMAGE ./frontend
docker push $FRONTEND_IMAGE
```

5. Deploy frontend and wire CORS:

```powershell
gcloud run deploy habit-tracker-web `
  --image $FRONTEND_IMAGE `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --min-instances 1

$FRONTEND_URL=(gcloud run services describe habit-tracker-web --region $REGION --format='value(status.url)')
gcloud run services update habit-tracker-api --region $REGION --update-env-vars "Cors__AllowedOrigins=$FRONTEND_URL"
```

6. Final check:

```powershell
curl.exe -i "$FRONTEND_URL/"
curl.exe -i "$BACKEND_URL/api/health"
```

Note:
- Region migration creates services in the new region but does not remove old-region services automatically.
- After confirming Tokyo works, delete old `us-central1` services to avoid paying for both.

## 1. Prerequisites

Note:
- This is the one-time foundation. If these are not ready, deployment commands will fail even if your code is correct.

- Google Cloud project with billing enabled.
- `gcloud` CLI installed and authenticated.
- Docker available locally (optional for local container tests).
- Required APIs enabled:
  - `run.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `secretmanager.googleapis.com`

One-time setup:

```powershell
gcloud auth login
gcloud config set project habit-tracker-486806
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Note:
- `gcloud config set project ...` makes all later commands target the correct GCP project.
- Enabling APIs can take a minute or two; retry failed commands once if they fail right after enablement.

## 2. Repository Components Used for Cloud Run

Note:
- These files define how your app is packaged and run in containers. Cloud Run deploys containers, not raw source files.

- Backend container:
  - `backend/Dockerfile`
  - `backend/.dockerignore`
- Frontend container:
  - `frontend/Dockerfile`
  - `frontend/nginx.conf`
  - `frontend/.dockerignore`
  - `frontend/cloudbuild.yaml` (optional if you use Cloud Build manually)

## 3. Backend Configuration Model

Note:
- Cloud Run reads settings from environment variables and secrets at runtime.
- If a required value is missing or wrong, the container may start but API endpoints can still fail.

Backend reads configuration from Cloud Run env vars/secrets:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_SSL_MODE`
- `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`
- `Cors__AllowedOrigins`
- `APPLY_MIGRATIONS_ON_STARTUP` (recommended `false` in steady state)
- `USE_HTTPS_REDIRECTION` (recommended `false` on Cloud Run)

Health endpoint to use in production:

- `GET /api/health`

Note:
- Use `/api/health` as your first check after each deploy. If this fails, stop and fix backend before testing frontend.

## 4. Local Testing

Note:
- Local testing is optional but strongly recommended. It helps catch config mistakes before cloud deployment.

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

Note:
- Use `curl.exe` in PowerShell (not `curl`) to avoid command alias issues.

### 4.2 Frontend (Vite local)

```powershell
cd frontend
$env:VITE_API_URL='http://localhost:5160/api'
npm ci
npm run dev
```

Note:
- `VITE_API_URL` is a build/runtime frontend setting telling browser code where your backend lives.

## 5. Create Artifact Registry Repository (One Time)

Note:
- Artifact Registry stores your container images (backend/frontend). Think of it as a private Docker Hub in GCP.

```powershell
$PROJECT_ID='habit-tracker-486806'
$REGION='asia-northeast1'
$REPO='habit-tracker'

gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION `
  --description='Habit Tracker containers'
```

## 6. Create / Rotate Secrets (PowerShell-Safe)

Note:
- Never commit DB passwords/JWT secrets to source code.
- Secret Manager keeps sensitive values out of code and deployment commands.

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

Note:
- `-NoNewline` avoids accidentally adding an extra newline character to secret values.

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

Note:
- Without this permission, deploy may succeed but runtime fails when the app tries to read secrets.

## 7. Deploy Backend (Cloud Run)

Note:
- Backend must be deployed first because frontend build needs the backend URL.

Build and push backend image with unique tag:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-api:$TAG"
gcloud auth configure-docker "$REGION-docker.pkg.dev"
docker build -t $BACKEND_IMAGE ./backend
docker push $BACKEND_IMAGE
```

Note:
- Unique tags make rollbacks/debugging easier than reusing `latest`.

Deploy backend:

```powershell
gcloud run deploy habit-tracker-api `
  --image $BACKEND_IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --min-instances 1 `
  --concurrency 20 `
  --set-env-vars "DB_HOST=34.84.229.88,DB_PORT=5432,DB_NAME=habit-tracker,DB_USER=postgres,DB_SSL_MODE=Require,Jwt__Issuer=HabitTracker,Jwt__Audience=HabitTrackerClient,Cors__AllowedOrigins=https://YOUR_FRONTEND_DOMAIN,APPLY_MIGRATIONS_ON_STARTUP=false,USE_HTTPS_REDIRECTION=false" `
  --set-secrets "DB_PASSWORD=habittracker-db-password:latest,Jwt__Secret=habittracker-jwt-secret:latest"
```

Important:

- `--set-secrets` format must be `ENV_NAME=SECRET_NAME:VERSION`.
- Correct: `DB_PASSWORD=habittracker-db-password:latest`
- Incorrect: raw password on left side.

Note:
- `--set-env-vars` is for normal config.
- `--set-secrets` is for sensitive values only.

Get backend URL:

```powershell
$BACKEND_URL=(gcloud run services describe habit-tracker-api --region $REGION --format='value(status.url)')
```

Note:
- Save this URL; you will use it for frontend build and later checks.

Verify backend:

```powershell
curl.exe -i "$BACKEND_URL/api/health"
```

## 8. Deploy Frontend (Cloud Run)

Note:
- Frontend is static files served by Nginx in Cloud Run.
- Frontend must be rebuilt when backend URL changes.

Build and push frontend image with API URL baked in:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-web:$TAG"

gcloud auth configure-docker "$REGION-docker.pkg.dev"
docker build `
  --build-arg VITE_API_URL="$BACKEND_URL/api" `
  -t $FRONTEND_IMAGE `
  ./frontend
docker push $FRONTEND_IMAGE
```

Note:
- `VITE_API_URL` is injected at build time. If wrong, frontend deploys but API calls fail.

Deploy frontend:

```powershell
gcloud run deploy habit-tracker-web `
  --image $FRONTEND_IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --min-instances 1
```

Get frontend URL:

```powershell
$FRONTEND_URL=(gcloud run services describe habit-tracker-web --region $REGION --format='value(status.url)')
```

Note:
- Cloud Run may show two valid URL styles (`...project-number...` and `...a.run.app`).

Update backend CORS to real frontend URL:

```powershell
gcloud run services update habit-tracker-api `
  --region $REGION `
  --update-env-vars "Cors__AllowedOrigins=$FRONTEND_URL"
```

Note:
- CORS controls browser permission for frontend -> backend requests.
- Wrong CORS causes browser errors even when backend works in Postman/curl.

If you want to allow both Cloud Run URL formats (project-number URL + `a.run.app` URL):

```powershell
gcloud run services update habit-tracker-api `
  --region $REGION `
  --update-env-vars "^@@^Cors__AllowedOrigins=https://habit-tracker-web-609538407050.$REGION.run.app,$FRONTEND_URL"
```

## 9. Integration Verification (Must Pass)

Note:
- Run these checks in order. Do not skip them; they isolate where failures happen.

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

Note:
- A `400` here is expected because body is empty; that is a healthy signal for this smoke test.

## 10. Update in the Future

Note:
- Redeploy backend when API code changes; redeploy frontend when UI changes or backend URL changes.

Backend:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-api:$TAG"
docker build -t $BACKEND_IMAGE ./backend
docker push $BACKEND_IMAGE
gcloud run deploy habit-tracker-api --image $BACKEND_IMAGE --region $REGION
```

Frontend:

```powershell
$TAG=(Get-Date -Format 'yyyyMMdd-HHmmss')
$FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/habit-tracker-web:$TAG"
docker build `
  --build-arg VITE_API_URL="$BACKEND_URL/api" `
  -t $FRONTEND_IMAGE `
  ./frontend
docker push $FRONTEND_IMAGE
gcloud run deploy habit-tracker-web --image $FRONTEND_IMAGE --region $REGION
```

If frontend URL changed, update backend CORS again:

```powershell
gcloud run services update habit-tracker-api --region $REGION --update-env-vars "Cors__AllowedOrigins=$FRONTEND_URL"
```

## 11. GitHub Actions Auto-Deploy (Push to `main`)

Note:
- This automates the manual steps. If it fails, read the failed step name and compare with Troubleshooting below.

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

Note:
- OIDC (keyless auth) is safer than storing a long-lived JSON key in GitHub.

Configured OIDC provider:

- `projects/609538407050/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- Service account:
  - `github-actions-deployer@habit-tracker-486806.iam.gserviceaccount.com`

Service account roles required:

- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.secretAccessor`
- `roles/serviceusage.serviceUsageConsumer`
- `roles/storage.objectAdmin`

Optional role only if you choose `gcloud builds submit` instead of Docker build/push:

- `roles/cloudbuild.builds.editor`

What the workflow does:

1. Builds and pushes backend image with Docker, then deploys backend to Cloud Run.
2. Reads backend URL and builds frontend with `VITE_API_URL=<backend>/api`.
3. Pushes frontend image with Docker and deploys frontend to Cloud Run.
4. Updates backend CORS with frontend URL(s).
5. Runs smoke checks (`/api/health`, frontend `/`, CORS preflight, login validation 400).

Fallback option (not recommended): JSON key auth can be used only if your org policy allows service account key creation.

## 12. Troubleshooting (Issues Encountered and Fixes)

Note:
- Copy the exact error text and match it to the closest item here before changing multiple settings at once.

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

8. GitHub OIDC auth step failed (`ACTIONS_ID_TOKEN_REQUEST_TOKEN` missing)
- Cause seen: workflow lacked `id-token: write` permission.
- Fix: add:
  - `permissions:`
  - `id-token: write`

9. Could not generate `GCP_SA_KEY`
- Cause seen: org policy `constraints/iam.disableServiceAccountKeyCreation`.
- Fix: switched to keyless OIDC (Workload Identity Federation), no JSON key required.

10. Workflow failed on `gcloud projects describe` with Cloud Resource Manager API disabled
- Cause seen: workflow queried project number at runtime.
- Fix: set static `PROJECT_NUMBER` in workflow env and removed runtime `projects describe`.

11. Workflow failed with Cloud Build bucket access (`<project>_cloudbuild`)
- Cause seen: restricted Cloud Build bucket permissions in CI.
- Fix: changed workflow to Docker build/push (no `gcloud builds submit` in CI path).

12. First deploy in a new region failed (`container failed to start and listen on PORT=8080`)
- Cause seen: new Cloud Run service had no runtime env vars/secrets yet, backend crashed with `Missing database configuration`.
- Fix: ensure deploy command (and GitHub workflow) always includes:
  - `--set-env-vars` for DB/JWT/non-secret config
  - `--set-secrets` for `DB_PASSWORD` and `Jwt__Secret`

## 13. Current Working Service URLs

Note:
- These are the currently known-good URLs. If Cloud Run creates a new URL format, update CORS accordingly.

- Backend (project-number URL): `https://habit-tracker-api-609538407050.asia-northeast1.run.app` (after next deploy)
- Backend (canonical URL): from `gcloud run services describe habit-tracker-api --region $REGION --format='value(status.url)'`
- Frontend (project-number URL): `https://habit-tracker-web-609538407050.asia-northeast1.run.app` (after next deploy)
- Frontend (canonical URL): from `gcloud run services describe habit-tracker-web --region $REGION --format='value(status.url)'`

Primary health check:

- `https://habit-tracker-api-609538407050.asia-northeast1.run.app/api/health` (after next deploy)

