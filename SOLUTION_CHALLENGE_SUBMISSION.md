# ClearPath — Solution Challenge 2026 India
## Smart Supply Chains Track

### What ClearPath does

ClearPath is an AI supply chain co-pilot for Indian SMBs. It predicts disruptions 18 to 24 hours before they affect a shipment, recommends alternate routes, and sends multilingual alerts to transporters — all in one operator workflow.

### Live demo flow

1. Sign in as shipper or transporter
2. Open an active shipment lane
3. See multi-signal risk detection: weather, traffic, port, road, and history signals
4. Review 3 AI-scored alternate routes with ETA, cost, and reliability scores
5. Approve the best route in one tap
6. See the multilingual transporter alert preview in Hindi, Gujarati, Tamil, and English

### What is live in this MVP

- FastAPI backend with background shipment monitoring and 15-minute signal refresh
- React dashboard with single-screen risk overview and one-tap route approval
- Google Maps Routes API for alternate route geometry and ETA scoring
- Weather signal ingestion with TTL caching and graceful fallback
- Gemini API for plain-language risk explanation and operator reasoning
- Google Cloud Translation API for multilingual alert text in 10 Indian languages
- WhatsApp Business Cloud API for demo transporter notification dispatch
- Firestore persistence when configured, local JSON for offline demos
- JWT-based authentication with role-based access control
- Heuristic historical-pattern risk scoring in Phase 1

### Phase 2 roadmap

- BigQuery ML trained on resolved disruption logs for learned historical scoring
- Expanded language coverage to full 22 Indian languages
- Vertex AI Agent Builder for production-grade agentic orchestration
- Firebase Auth and MFA for production deployment
- Deeper transporter and receiver workflows
- Accessibility improvements including low-literacy assistive flows

### Google technologies used

| Technology | Usage in MVP |
|---|---|
| Google Maps Routes API | Alternate route geometry, ETA scoring, distance matrix |
| Google Geocoding API | Resolves operator-entered origin and destination labels |
| Gemini API | Risk explanation generation, plain-language operator reasoning |
| Google Cloud Translation API | Multilingual alert text in 10 Indian languages |
| Firebase / Firestore | Optional persistence and real-time sync |
| WhatsApp Business API | Demo transporter notification dispatch |
