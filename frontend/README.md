# ClearPath Frontend

This frontend is the live ClearPath web client built with React, Vite, TypeScript, Tailwind CSS, React Router, and optional Firebase Authentication.

It now talks directly to the backend for:

- JWT login
- Firebase token exchange
- shipment listing
- shipment creation
- shipment refresh
- route approval

## Local Run

```bash
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend origin when it differs from `http://localhost:8000`.

Set `VITE_AUTH_MODE=firebase_primary` and the `VITE_FIREBASE_*` values from [frontend/.env.example](/d:/Arihant/Data/Code/clearpath_full_project/frontend/.env.example) when you want the existing login screen to use Firebase Authentication without changing the current theme.
