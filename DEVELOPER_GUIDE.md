# ClearPath Developer Guide

## Product Guardrail

ClearPath is a predictive decision engine for supply chain disruption prevention.

Do not build features as passive dashboards. Every meaningful output should answer:

`What should Priya do right now?`

## Primary User

Priya is a small business owner in India who:

- does not have logistics expertise
- needs instant clarity
- prefers WhatsApp-like flows over dashboards
- should be able to act in under 30 seconds

## Current Architecture

### Frontend

- React + Vite
- TypeScript + React Router
- Tailwind CSS
- Framer Motion
- Decision-first UI built from routed pages and shared app state:
  - `src/app/pages/LoginPage.tsx`
  - `src/app/pages/Dashboard.tsx`
  - `src/app/pages/AddShipment.tsx`
  - `src/app/pages/ShipmentDetail.tsx`
  - `src/app/context/AppContext.tsx`
  - `src/app/lib/api.ts`

### Backend

- FastAPI
- `clients/`
  - geocoding
  - routes
  - weather
  - Gemini
- `engines/`
  - `risk_engine.py`
  - `ranking_engine.py`
- `services/`
  - `analyze_service.py`
  - `shipment_service.py`

## Important Files

- [App.tsx](/d:/Arihant/Data/Code/clearpath_full_project/frontend/src/app/App.tsx)
- [routes.tsx](/d:/Arihant/Data/Code/clearpath_full_project/frontend/src/app/routes.tsx)
- [AppContext.tsx](/d:/Arihant/Data/Code/clearpath_full_project/frontend/src/app/context/AppContext.tsx)
- [api.ts](/d:/Arihant/Data/Code/clearpath_full_project/frontend/src/app/lib/api.ts)
- [Dashboard.tsx](/d:/Arihant/Data/Code/clearpath_full_project/frontend/src/app/pages/Dashboard.tsx)
- [ShipmentDetail.tsx](/d:/Arihant/Data/Code/clearpath_full_project/frontend/src/app/pages/ShipmentDetail.tsx)
- [main.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/app/main.py)
- [analyze_service.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/app/services/analyze_service.py)
- [shipment_service.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/app/services/shipment_service.py)
- [risk_engine.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/app/engines/risk_engine.py)
- [ranking_engine.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/app/engines/ranking_engine.py)
- [schemas.py](/d:/Arihant/Data/Code/clearpath_full_project/backend/app/schemas.py)

## Backend Contract

The important response objects are:

- `risk`
- `predictionWindow`
- `delay`
- `cascadeImpact`
- `decision`
- `alert`
- `routes`
- `explanation`

If you add new features, prefer extending those decision-oriented objects instead of inventing parallel dashboard-only fields.

## Key Flows

### Predictive decision flow

1. User creates a lane with source and destination
2. Backend geocodes both points
3. Routes, weather, congestion, and heuristics are combined
4. Gemini or the local fallback explains the best action
5. UI shows alert, recommendation, and one-tap approval

### Route approval flow

1. User previews one of 3 ranked routes
2. User approves the route
3. Backend updates the active route
4. Backend recalculates the decision on the new route
5. UI confirms the action and refreshes risk state

## Implementation Notes

- Keep Gemini as the reasoning layer, not optional product copy
- Keep route ranking tied to ETA, risk, reliability, and cost
- Preserve multilingual and WhatsApp-style alert framing where possible
- Prefer language like `decision`, `approval`, `prediction`, and `protection`
- Avoid returning to tracking-only terminology unless it serves the decision flow

## Local Run

See [SETUP.md](/d:/Arihant/Data/Code/clearpath_full_project/SETUP.md).
