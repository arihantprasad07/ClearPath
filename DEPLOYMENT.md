# ClearPath Deployment Guide

## Deployment Target

ClearPath is configured as a Firebase Hosting prototype with direct Gemini API calls from the frontend.

## Local Run

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Required Frontend Variables

- `VITE_GEMINI_API_KEY`
- `VITE_AUTH_MODE`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Firebase Deployment (Spark Ready)

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Set project: `firebase use --add`

### Environment Setup
1. Copy `frontend/.env.example` to `frontend/.env`
2. Add your Gemini API key to `VITE_GEMINI_API_KEY`
3. Fill the optional Firebase Auth variables if you want Firebase sign-in enabled

### Deploy
From the `firebase/` directory:
`firebase deploy --only hosting`

Or use the root deploy script:
`chmod +x deploy.sh && ./deploy.sh`

### Verify
1. Open the app from Firebase Hosting
2. Sign in using Firebase Auth or prototype mode
3. Create a shipment and confirm Gemini generates the route reasoning in the UI
