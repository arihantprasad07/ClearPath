# ClearPath Setup Guide

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Required backend env vars:
- `JWT_SECRET_KEY` must be set in `backend/.env` or the backend will fail at startup.
- `ADMIN_PASSWORD` must be set in `backend/.env` or the backend will fail at startup.

Optional integrations:
- `GOOGLE_TRANSLATE_API_KEY` enables multilingual alert translations. Without it, ClearPath falls back to the original alert text.
- `VERTEX_AI_PROJECT_ID`, `VERTEX_AI_LOCATION`, and `VERTEX_AI_MODEL` enable Vertex-backed workflow summarization. Without them, ClearPath uses the local orchestration fallback.
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_DEMO_RECIPIENT` enable live WhatsApp alert dispatch. Without them, alerts are still built and logged for demo fallback mode.
- `FCM_PROJECT_ID` and `FCM_DEMO_TOKEN` enable FCM HTTP v1 push delivery when Google credentials are available. `FCM_SERVER_KEY` remains supported as a legacy fallback.
- `FIREBASE_AUTH_ENABLED=true` enables Firebase ID token verification so Firebase-authenticated clients can exchange into the app JWT flow.
- `AUTH_MODE=firebase_primary` makes Firebase Authentication the required runtime auth mode for protected APIs. In local dev you can keep `ALLOW_PASSWORD_LOGIN=true` while migrating.
- `REQUIRE_ADMIN_MFA=true` blocks admin-only routes unless the authenticated admin session carries MFA state.
- `ENFORCE_FIRESTORE_IN_PRODUCTION=true` degrades health and startup validation if production is not using Firestore.
- `FIREBASE_FUNCTIONS_ENABLED=true` and `FIREBASE_FUNCTIONS_BASE_URL` let the backend trigger deployed Firebase Functions for serverless workflow steps.
- `DATABASE_URL` lets you point ClearPath at a different SQLite file for local or staging environments. By default it uses `backend/data/clearpath.db`.
- `FIREBASE_PROJECT_ID` and `FIREBASE_CREDENTIALS_PATH` enable Firestore persistence and Firebase Admin features.
- `BIGQUERY_PROJECT_ID`, `BIGQUERY_DATASET`, and `BIGQUERY_TABLE` enable operational event export for disruption and reroute logs. Without them, audit events stay in SQLite or Firestore.
- `PORT_FEEDS_BASE_URL` and `NHAI_ROADS_BASE_URL` let you connect live port and road-status signals. Without them, the backend uses graceful fallbacks so the demo remains functional.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Optional frontend integrations:
- `VITE_API_URL` points the frontend to the backend when it is not running on `http://localhost:8000`.
- `VITE_AUTH_MODE=firebase_primary` switches the login screen to Firebase Authentication behavior while preserving the current UI theme.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` enable the frontend Firebase SDK.

## Production Notes

- SQLite is the default persistent database for shipments, alerts, users, and audit events in local and staging runs.
- Firestore becomes the primary persistent database when configured.
- JWT auth protects shipment APIs, and Firebase token verification can be enabled as a bridge for Firebase-based sign-in flows.
- Firebase Admin provisioning is used when configured so created users can also receive Firebase custom claims.
- Firebase-first deployments should use `AUTH_MODE=firebase_primary`, `FIREBASE_AUTH_ENABLED=true`, Firestore, and deployed Firebase rules/functions together.
- The frontend can run in backend-password mode or Firebase-primary mode without changing the theme.
- Monitoring runs automatically every `MONITORING_INTERVAL_SECONDS`.
- `JWT_SECRET_KEY` and `ADMIN_PASSWORD` are required env vars and must be set before the backend starts.
- `GET /users`, `POST /users`, and `PUT /users/{user_id}/password` are available for admin-managed user operations.
- Set optional API keys only when you want live integrations; ClearPath still works in fallback mode without them.
- Audit events can be exported to BigQuery when configured, while SQLite-backed audit logging remains available in fallback mode.
- External AI and analytics payloads are anonymized before leaving the app.
- Restrict `CORS_ORIGINS` to your frontend domains in production.

## API Surface

- `GET /health`
- `POST /auth/login`
- `POST /auth/firebase`
- `GET /auth/me`
- `GET /users`
- `POST /users`
- `PUT /users/{user_id}/password`
- `PUT /users/{user_id}/device-token`
- `GET /audit-events`
- `POST /shipments`
- `GET /shipments`
- `GET /shipments/{shipment_id}`
- `PATCH /shipments/{shipment_id}`
- `POST /shipments/{shipment_id}/refresh`

## Deployment

See [DEPLOYMENT.md](/d:/Arihant/Data/Code/clearpath_full_project/DEPLOYMENT.md).
