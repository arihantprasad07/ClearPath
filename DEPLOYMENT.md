# ClearPath Deployment Guide

## Deployment Target

ClearPath is now configured for Firebase Hosting + Firebase Cloud Functions + Firestore.

## Local Smoke Run

### Functions

```powershell
cd firebase\functions
copy .env.example .env
npm install
```

### Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Required Production Variables

### Functions

- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `WEATHER_API_KEY`
- `JWT_SECRET_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `FIREBASE_PROJECT_ID`
- `GOOGLE_TRANSLATE_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

### Frontend

- `VITE_API_URL`
- `VITE_AUTH_MODE`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Firebase Deployment (Current)

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Set project: `firebase use --add` (select your Firebase project)

### Environment Setup
1. Copy `firebase/functions/.env.example` to `firebase/functions/.env` and fill in all keys
2. Copy `frontend/.env.production` and fill in your Firebase project values

### Deploy
From the `firebase/` directory:
`firebase deploy`

Or use the root deploy script:
`chmod +x deploy.sh && ./deploy.sh`

### URLs after deployment
- Frontend: `https://YOUR_PROJECT_ID.web.app`
- API: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/`

### Verify
1. Visit `/health` endpoint to confirm: `{ status: "ok", database: "firestore" }`
2. Sign in and create a shipment
3. Confirm risk scoring, route options, and AI explanation appear
