# ClearPath Deployment Guide

## Deployment Target

ClearPath is submission-ready as a React + Vite frontend and a FastAPI backend, with Firebase, Firestore, BigQuery, FCM, WhatsApp, and Vertex AI available as production integrations.

- Current runtime backend: FastAPI
- Current runtime frontend: Vite static build
- Current default persistence: SQLite
- Production-capable integrations: Firebase Auth, Firestore, BigQuery, Firebase Functions trigger, FCM, WhatsApp

## Local Smoke Run

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Required Production Variables

### Backend

- `ENVIRONMENT=production`
- `PORT`
- `JWT_SECRET_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_USERNAME`
- `CORS_ORIGINS`

### Backend integration variables

- `DATABASE_URL`
- `GOOGLE_MAPS_API_KEY`
- `WEATHER_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_TRANSLATE_API_KEY`
- `VERTEX_AI_PROJECT_ID`
- `VERTEX_AI_LOCATION`
- `VERTEX_AI_MODEL`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_DEMO_RECIPIENT`
- `FCM_SERVER_KEY`
- `FCM_PROJECT_ID`
- `FCM_DEMO_TOKEN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CREDENTIALS_PATH`
- `FIREBASE_AUTH_ENABLED`
- `AUTH_MODE`
- `ALLOW_PASSWORD_LOGIN`
- `REQUIRE_ADMIN_MFA`
- `ENFORCE_FIRESTORE_IN_PRODUCTION`
- `FIREBASE_FUNCTIONS_ENABLED`
- `FIREBASE_FUNCTIONS_BASE_URL`
- `BIGQUERY_PROJECT_ID`
- `BIGQUERY_DATASET`
- `BIGQUERY_TABLE`
- `PORT_FEEDS_BASE_URL`
- `NHAI_ROADS_BASE_URL`
- `MONITORING_INTERVAL_SECONDS`

### Frontend

- `VITE_API_URL`
- `VITE_AUTH_MODE`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Render Backend Deployment

1. Create a new Web Service from the repo.
2. Set the root directory to `backend`.
3. Use the build command `pip install -r requirements.txt`.
4. Use the start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add the backend environment variables from [backend/.env.example](/d:/Arihant/Data/Code/clearpath_full_project/backend/.env.example).
6. If you are staying on SQLite, use a persistent disk and point `DATABASE_URL` at a disk-backed path.
7. If you want Firebase-first production, set:
   `AUTH_MODE=firebase_primary`
   `FIREBASE_AUTH_ENABLED=true`
   `ALLOW_PASSWORD_LOGIN=false`
   `ENFORCE_FIRESTORE_IN_PRODUCTION=true`

## Railway Backend Deployment

1. Create a new project from the repo.
2. Set the service root to `backend`.
3. Use the start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add the same backend environment variables.
5. Do not rely on ephemeral SQLite storage unless this is a demo-only environment.

## Vercel Frontend Deployment

1. Import the repo in Vercel.
2. Set the root directory to `frontend`.
3. Use build command `npm run build`.
4. Use output directory `dist`.
5. Add frontend environment variables from [frontend/.env.example](/d:/Arihant/Data/Code/clearpath_full_project/frontend/.env.example).
6. Set `VITE_API_URL` to the deployed backend origin.
7. Keep [frontend/vercel.json](/d:/Arihant/Data/Code/clearpath_full_project/frontend/vercel.json) so browser-history routes like `/dashboard` and `/shipment/:id` resolve correctly.

## Firebase And Firestore Setup

1. Create a Firebase project.
2. Enable Firestore in production mode.
3. Enable Firebase Authentication if you want `firebase_primary` mode.
4. Generate a Firebase service account JSON.
5. Store that JSON on the host filesystem and set `FIREBASE_CREDENTIALS_PATH` to the absolute path of that file.
6. Set `FIREBASE_PROJECT_ID`.
7. Deploy [firebase/firestore.rules](/d:/Arihant/Data/Code/clearpath_full_project/firebase/firestore.rules).
8. Optionally deploy [firebase/functions/index.js](/d:/Arihant/Data/Code/clearpath_full_project/firebase/functions/index.js) and set `FIREBASE_FUNCTIONS_ENABLED=true`.

Important:
- `FIREBASE_CREDENTIALS_PATH` is a file path, not raw JSON content.
- Firestore rules assume Firebase custom claims include `role` and `orgId`.
- `AUTH_MODE=firebase_primary` requires `FIREBASE_AUTH_ENABLED=true`.

## Recommended Submission Configuration

For a Solution Challenge demo build that best matches the product story:

- Backend:
  `ENVIRONMENT=production`
  `AUTH_MODE=firebase_primary`
  `FIREBASE_AUTH_ENABLED=true`
  `ALLOW_PASSWORD_LOGIN=false`
  `ENFORCE_FIRESTORE_IN_PRODUCTION=true`
  `MONITORING_INTERVAL_SECONDS=900`
- Frontend:
  `VITE_AUTH_MODE=firebase_primary`
- Infrastructure:
  Firestore enabled
  Firebase rules deployed
  Optional BigQuery export enabled
  Optional WhatsApp and FCM enabled for live alert delivery

If you need a faster live demo loop, you can temporarily lower `MONITORING_INTERVAL_SECONDS` without changing the app code.

## Post-Deploy Verification

1. Open `GET /health` and confirm:
   `status=ok`
   `database=firestore` or expected durable mode
   `authMode` matches your intended mode
2. Verify frontend deep links:
   `/dashboard`
   `/shipment/<id>`
3. Sign in and create a shipment.
4. Confirm the shipment detail page shows:
   route network
   signal stack
   AI explanation
   localized alert
5. Refresh a shipment and verify risk, route ranking, and audit behavior update.
6. Approve the best route and verify the dispatch status changes as expected.
7. If using Firebase-first auth, verify Firebase sign-in and `/auth/firebase`.
8. If using WhatsApp or FCM, verify at least one real dispatch succeeds.

## What This Deployment Does Not Require

- Firebase Hosting is not required for the current frontend runtime.
- Firebase Functions are optional; the FastAPI backend can orchestrate the workflow directly.
- Firestore is strongly recommended for production, but SQLite still works for local and demo runs.
