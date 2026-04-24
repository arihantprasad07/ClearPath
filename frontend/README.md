# ClearPath Frontend

This frontend is the live ClearPath web client built with React, Vite, TypeScript, Tailwind CSS, React Router, optional Firebase Authentication, and direct Gemini API calls.

It now runs as a Firebase Hosting prototype with:

- direct Gemini-powered shipment reasoning
- browser-local shipment storage
- optional Firebase Authentication for sign-in

## Local Run

```bash
npm install
copy .env.example .env
npm run dev
```

Set `VITE_GEMINI_API_KEY` to a valid Gemini API key.

Set `VITE_AUTH_MODE=firebase_primary` and the `VITE_FIREBASE_*` values from [frontend/.env.example](/d:/Arihant/Data/Code/clearpath_full_project/frontend/.env.example) when you want the existing login screen to use Firebase Authentication without changing the current theme.
