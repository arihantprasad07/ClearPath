# ClearPath — Setup Guide

Everything here is **free**. No credit card required at any step.

---

## What You Need Before Starting

| Tool | Where to get it | Cost |
|---|---|---|
| Node.js 18+ | https://nodejs.org | Free |
| Python 3.11+ | https://python.org | Free |
| Gemini API key | https://aistudio.google.com/apikey | Free |
| Firebase project | https://console.firebase.google.com | Free (Spark tier) |

---

## Step 1 — Get a Free Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key — you will paste it into `backend/.env`

---

## Step 2 — Set Up Firebase (Spark tier — free, no CC)

1. Go to https://console.firebase.google.com
2. Create a new project
3. Go to **Authentication** → **Sign-in method** → Enable **Email/Password**
4. Go to **Firestore Database** → Create database → Start in **test mode**
5. Go to **Project Settings** → **Your apps** → Add a **Web app**
6. Copy the config values — you will paste them into `frontend/.env`

---

## Step 3 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Open `backend/.env` and set:

```env
JWT_SECRET_KEY=any-long-random-string-at-least-32-chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-chosen-password
GEMINI_API_KEY=paste-your-gemini-key-here
CORS_ORIGINS=http://localhost:5173
```

Start the backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Test: open http://localhost:8000/health — should show status ok.

---

## Step 4 — Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Open `frontend/.env` and set:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=paste-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=paste-here
VITE_FIREBASE_APP_ID=paste-here
VITE_AUTH_MODE=firebase_primary
```

**No Firebase yet?** Set `VITE_AUTH_MODE=app_jwt` and leave Firebase vars empty.
Log in with username `admin` and the password from `backend/.env`.

Start the frontend:

```bash
npm run dev
```

Open http://localhost:5173.

---

## Step 5 — Create a Firebase Login User

Go to Firebase Console → Authentication → Users → Add user.
Enter an email and password, then use those to log in at /login.

---

## Step 6 — Run the Demo

1. Open http://localhost:5173 → click Get Started → log in
2. Dashboard loads with Leaflet map showing Coimbatore → Surat
3. See the HIGH RISK red pulsing marker on Surat
4. Click **Run AI Analysis** — Gemini responds in 2-3 seconds
5. Click **Approve Best Route**:
   - Marker turns green
   - NH-48 alternate polyline appears on map
   - Success toast with new ETA
   - Event logged to Firestore disruptions collection
6. Toggle **हिंदी में देखें** for Hindi alert

Total demo time: under 60 seconds.

---

## Deployment

See DEPLOYMENT.md for Vercel + Render instructions.

---

## Troubleshooting

**Backend won't start** — JWT_SECRET_KEY and ADMIN_PASSWORD must be set in backend/.env

**AI Analysis returns fallback text** — check GEMINI_API_KEY in backend/.env. The fallback is intentional, demo still works.

**Map does not load** — Leaflet uses OpenStreetMap, needs internet. No API key needed.

**Login fails in firebase_primary mode** — create the user in Firebase Console → Authentication first.

**Login fails in app_jwt mode** — use username `admin` and your ADMIN_PASSWORD.

**Firestore write silent fail** — expected if Firebase vars not set. Check browser console for: Disruption logged to Firestore: DEMO-001
