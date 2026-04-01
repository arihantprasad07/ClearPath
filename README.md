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

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend: FastAPI, httpx, Pydantic
- Intelligence: Gemini API, risk engine, ranking engine, prediction engine
- Data sources: Google Routes API, Google Geocoding API, weather API

## What The System Does

- Detects disruption risk from weather, traffic, congestion, and historical-pattern scoring
- Produces a prediction window for the next 18-24 hours
- Computes delay probability and cascade impact
- Ranks 3 route options by ETA, risk, reliability, and cost
- Generates a recommendation and approval message for Priya
- Continuously monitors saved shipments in the background every 15 seconds

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
