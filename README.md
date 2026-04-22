# ClearPath

ClearPath is our Google Solution Challenge 2026 submission for the Smart Supply Chains track.

It is an AI supply chain co-pilot for Indian SMBs focused on resilient logistics and dynamic supply chain optimization.

It is not a shipment tracker. It predicts disruption 18-24 hours before it happens, explains the risk with Gemini, ranks 3 route alternatives, and gives Priya a one-tap action she can approve in under 30 seconds.

## Solution Challenge 2026

Problem fit:
- Continuously analyze multifaceted transit signals before delivery failure
- Detect and flag likely supply chain disruptions early
- Recommend or trigger optimized route adjustments before local bottlenecks cascade
- Support resilient logistics workflows for real operators, not just dashboards for analysts

Current architecture direction:
- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend: FastAPI with Firebase-primary capable auth mode, admin user management, SQLite-by-default persistence, optional Firestore, audit logging, and BigQuery export path
- AI and orchestration: Gemini, Vertex-ready workflow orchestration, Firebase Functions scaffold, multilingual alerts
- Signal stack: Maps routes, weather, traffic, port, road-status, and history signals
- Delivery stack: WhatsApp, FCM push fallback, dashboard actions

## Core Product Idea

- Predict before disruption, not after delay
- Turn live signals into a decision, not a dashboard
- Show Priya what to do right now
- Use WhatsApp-style alerts and multilingual action copy

## Quick Demo

1. Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. Seed the demo shipments in a second backend terminal:

```bash
cd backend
.venv\Scripts\activate
python seed_demo.py
```

3. Start the frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

4. Open the app, sign in with your configured company or operator account, and go to the dashboard.
5. Click `Demo: Simulate Risk` in the dashboard header card to trigger the judge-safe disruption moment instantly.
6. Open the first shipment, review the three ranked routes, and click `Approve route` to show the post-approval confirmation panel.

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend: FastAPI, httpx, Pydantic
- Intelligence: Gemini API, risk engine, ranking engine, prediction engine
- Data sources: Google Routes API, Google Geocoding API, weather API
- Decision fields: `valueScore`, `recommendedFlag`, `tradeOff`, `confidence`, `urgency`
- Shipment fields: `estimatedCargoValue`, `priority`

## What The System Does

- Detects disruption risk from weather, traffic, congestion, and historical-pattern scoring
- Produces a prediction window for the next 18-24 hours
- Computes delay probability and cascade impact
- Ranks 3 route options by ETA, risk, reliability, cost, and value
- Generates a recommendation and approval message for Priya
- Continuously monitors saved shipments in the background every 15 seconds

## Phase 1 Enhancements

- `backend/app/clients/gemini_client.py`: richer Gemini prompt with structured JSON reasoning and safer fallback handling
- `backend/app/services/analyze_service.py`: threads `priority` and `estimatedCargoValue` into analysis outputs
- `backend/app/engines/risk_engine.py`: adds time-of-day weighting, monsoon logic, consecutive-signal bonus, and 0-100 clamping
- `backend/app/engines/ranking_engine.py`: adds `valueScore`, `recommendedFlag`, and `tradeOff` to route ranking
- `backend/app/services/shipment_service.py`: wires `priority` and cargo value through shipment creation
- `backend/app/schemas.py`: updates shared contracts for the new analysis and shipment fields
- `backend/seed_demo.py`: seeds three India-specific SMB demo shipments for Mumbai, Surat, and Pune lanes
- `frontend/src/app/pages/*` plus `frontend/src/app/lib/api.ts` and `frontend/src/app/context/AppContext.tsx`: adds risk pulse UI, richer reasoning, route comparison, multilingual alerts, and enhanced shipment creation UX

## Phase 2 Enhancements

- Landing page now includes Priya's story strip, India-scale impact metrics, and a competitive positioning card
- Dashboard now includes the Priya persona banner and a frontend-only disruption simulator for reliable live demos
- Shipment detail now includes a strategy-aligned post-approval confirmation panel and improved Indian-language transporter previews
- Add shipment now includes common Indian route presets and conditional monsoon-season messaging
- Submission docs and README now reflect the judge scorecard, demo script, roadmap, and updated product story

## Main API Surface

- `GET /health`
- `GET /users`
- `POST /users`
- `PUT /users/{user_id}/password`
- `PUT /users/{user_id}/device-token`
- `POST /geocode`
- `POST /analyze`
- `GET /shipments`
- `GET /shipments/{shipment_id}`
- `POST /shipments`
- `PATCH /shipments/{shipment_id}`
- `POST /shipments/{shipment_id}/refresh`

## Frontend Experience

- Decision lanes instead of passive shipment cards
- Gemini reasoning panel instead of generic AI summary
- One-tap approval panel for rerouting
- Decision feed that explains what happened and what Priya should do next
- Firebase Authentication capable login flow while keeping the current theme and backend fallback path for local development
- Demo-safe risk simulation button for live judging reliability

## Production Readiness Direction

- SQLite is the default local persistent store for shipments, alerts, users, and audit events
- Firestore can be enabled without changing the API surface
- Admins can provision operator accounts from the backend API, including org and stakeholder metadata
- `AUTH_MODE=firebase_primary` is now supported for Firebase-first deployments, while dev/test can still keep password login enabled when needed
- Request IDs and security headers are attached to API responses for safer debugging and tracing
- Gemini and BigQuery payloads are anonymized before external processing
- Alert translations now cover 22 Indian language targets in the backend workflow
- Firebase rules and Functions scaffolding live under [firebase/firestore.rules](/d:/Arihant/Data/Code/clearpath_full_project/firebase/firestore.rules) and [firebase/functions/index.js](/d:/Arihant/Data/Code/clearpath_full_project/firebase/functions/index.js)
- Core backend flows are covered by automated API tests under [backend/tests/test_api.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/tests/test_api.py)

## Run It

See [SETUP.md](/d:/Arihant/Data/Code/clearpath_full_project/SETUP.md).

## Deploy It

See [DEPLOYMENT.md](/d:/Arihant/Data/Code/clearpath_full_project/DEPLOYMENT.md).

## Submission Notes

See [SOLUTION_CHALLENGE_SUBMISSION.md](/d:/Arihant/Data/Code/clearpath_full_project/SOLUTION_CHALLENGE_SUBMISSION.md).
